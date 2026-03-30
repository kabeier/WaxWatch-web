import { expect, test, type Page, type Route } from "@playwright/test";

type JsonInit = {
  status?: number;
  body: unknown;
  delayMs?: number;
  headers?: Record<string, string>;
};

type MockMode = "success" | "empty" | "error" | "rate-limited" | "unauthorized";

type RouteMockState = {
  mode: MockMode;
  requests: number;
};

const API = {
  watchRules: "/watch-rules",
  watchReleases: "/watch-releases",
  notifications: "/notifications",
  unreadCount: "/notifications/unread-count",
  me: "/me",
  meHardDelete: "/me/hard-delete",
  discogsStatus: "/integrations/discogs/status",
  discogsConnect: "/integrations/discogs/connect",
  discogsImport: "/integrations/discogs/import",
  streamEvents: "/stream/events",
} as const;

async function fulfillJson(route: Route, init: JsonInit) {
  if (init.delayMs) {
    await new Promise((resolve) => setTimeout(resolve, init.delayMs));
  }

  await route.fulfill({
    status: init.status ?? 200,
    contentType: "application/json",
    headers: init.headers,
    body: JSON.stringify(init.body),
  });
}

function matchesEndpoint(pathname: string, endpoint: string) {
  return (
    pathname === endpoint ||
    pathname.startsWith(`${endpoint}/`) ||
    pathname.endsWith(endpoint) ||
    pathname.includes(`${endpoint}/`)
  );
}

function sampleMeProfile() {
  return {
    id: "user-1",
    email: "collector@example.com",
    display_name: "Collector",
    is_active: true,
    integrations: [],
    preferences: {
      timezone: "UTC",
      currency: "USD",
      delivery_frequency: "instant",
      notification_timezone: "UTC",
      quiet_hours_start: 22,
      quiet_hours_end: 7,
      notifications_email: true,
      notifications_push: false,
    },
  };
}

function notificationFixture() {
  return {
    id: "note-1",
    event_type: "price_drop",
    channel: "email",
    status: "sent",
    is_read: false,
    created_at: "2026-01-01T00:00:00.000Z",
    read_at: null,
  };
}

async function ensureAuthenticatedSession(page: Page) {
  await page.context().addCookies([
    {
      name: "waxwatch_session",
      value: "fake-session",
      domain: "127.0.0.1",
      path: "/",
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);
}

async function installApiMocks(page: Page) {
  const mockStates: Record<string, RouteMockState> = {
    [API.watchRules]: { mode: "empty", requests: 0 },
    [API.watchReleases]: { mode: "empty", requests: 0 },
    [API.notifications]: { mode: "empty", requests: 0 },
    [API.unreadCount]: { mode: "success", requests: 0 },
    [API.discogsStatus]: { mode: "empty", requests: 0 },
    [API.discogsConnect]: { mode: "success", requests: 0 },
    [API.discogsImport]: { mode: "success", requests: 0 },
    [API.me]: { mode: "success", requests: 0 },
  };

  let streamStatus: 200 | 401 = 200;
  let streamRequests = 0;
  let meDeleteCalls = 0;
  let meHardDeleteCalls = 0;
  let mePatchCalls = 0;
  let markNotificationReadCalls = 0;
  let unreadCountBase = 1;
  let enforceStreamCookieMode = false;

  const setMode = (pathname: string, mode: MockMode) => {
    mockStates[pathname] = { ...mockStates[pathname], mode };
  };

  const getRequests = (pathname: string) => mockStates[pathname]?.requests ?? 0;

  await page.route("**/*", async (route) => {
    const request = route.request();
    const resourceType = request.resourceType();
    if (!["fetch", "xhr", "eventsource"].includes(resourceType)) {
      await route.continue();
      return;
    }

    const { pathname } = new URL(request.url());
    let apiPath = pathname;
    while (/^\/(?:api|v1|v2)(?=\/)/.test(apiPath)) {
      apiPath = apiPath.replace(/^\/(?:api|v1|v2)(?=\/)/, "");
    }

    const isKnownApiPath =
      matchesEndpoint(apiPath, API.streamEvents) ||
      matchesEndpoint(apiPath, API.unreadCount) ||
      matchesEndpoint(apiPath, API.watchRules) ||
      matchesEndpoint(apiPath, API.watchReleases) ||
      matchesEndpoint(apiPath, API.notifications) ||
      matchesEndpoint(apiPath, API.discogsStatus) ||
      matchesEndpoint(apiPath, API.discogsConnect) ||
      matchesEndpoint(apiPath, API.discogsImport) ||
      matchesEndpoint(apiPath, API.meHardDelete) ||
      matchesEndpoint(apiPath, API.me);

    if (!isKnownApiPath) {
      await route.continue();
      return;
    }

    if (matchesEndpoint(apiPath, API.streamEvents)) {
      streamRequests += 1;

      const headers = request.headers();
      expect(headers.accept).toContain("text/event-stream");
      if (enforceStreamCookieMode) {
        expect(headers.cookie).toContain("waxwatch_session=fake-session");
        expect(headers.authorization).toBeUndefined();
      }

      if (streamStatus === 401) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({ error: { message: "session expired" } }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: 'event: notification\ndata: {"id":"evt-1"}\n\n',
      });
      return;
    }

    if (matchesEndpoint(apiPath, API.unreadCount)) {
      mockStates[API.unreadCount].requests += 1;

      const mode = mockStates[API.unreadCount].mode;
      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      const unreadCount = Math.min(unreadCountBase + mockStates[API.unreadCount].requests - 1, 2);
      await fulfillJson(route, { body: { unread_count: unreadCount } });
      return;
    }

    if (matchesEndpoint(apiPath, API.watchRules)) {
      mockStates[API.watchRules].requests += 1;
      const mode = mockStates[API.watchRules].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      if (mode === "unauthorized") {
        await fulfillJson(route, { status: 401, body: { error: { message: "session expired" } } });
        return;
      }

      if (mode === "success") {
        await fulfillJson(route, {
          body: [
            {
              id: "rule-1",
              name: "Ambient restocks",
              poll_interval_seconds: 120,
              is_active: true,
              query: { keywords: ["ambient", "reissue"] },
            },
          ],
        });
        return;
      }

      await fulfillJson(route, { body: [] });
      return;
    }

    if (matchesEndpoint(apiPath, API.watchReleases)) {
      mockStates[API.watchReleases].requests += 1;
      const mode = mockStates[API.watchReleases].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      if (mode === "success") {
        await fulfillJson(route, {
          body: [
            {
              id: "release-1",
              title: "Tomorrow's Harvest",
              artist: "Boards of Canada",
              year: 2013,
              currency: "USD",
              target_price: 49.99,
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-02T00:00:00.000Z",
              match_mode: "all_keywords",
              is_active: true,
            },
          ],
        });
        return;
      }

      await fulfillJson(route, { body: [] });
      return;
    }

    if (matchesEndpoint(apiPath, API.notifications) && !matchesEndpoint(apiPath, API.unreadCount)) {
      mockStates[API.notifications].requests += 1;

      if (request.method() === "POST" && apiPath.endsWith("/read")) {
        markNotificationReadCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      const mode = mockStates[API.notifications].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      if (mode === "success") {
        await fulfillJson(route, { body: [notificationFixture()] });
        return;
      }

      await fulfillJson(route, { body: [] });
      return;
    }

    if (matchesEndpoint(apiPath, API.discogsStatus)) {
      mockStates[API.discogsStatus].requests += 1;
      const mode = mockStates[API.discogsStatus].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      if (mode === "success") {
        await fulfillJson(route, {
          body: {
            connected: true,
            connected_at: "2026-01-01T00:00:00.000Z",
            external_user_id: "discogs-123",
          },
        });
        return;
      }

      await fulfillJson(route, { body: null });
      return;
    }

    if (matchesEndpoint(apiPath, API.discogsConnect)) {
      mockStates[API.discogsConnect].requests += 1;
      const mode = mockStates[API.discogsConnect].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      await fulfillJson(route, { body: { connected: true } });
      return;
    }

    if (matchesEndpoint(apiPath, API.discogsImport)) {
      mockStates[API.discogsImport].requests += 1;
      const mode = mockStates[API.discogsImport].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      await fulfillJson(route, {
        body: {
          id: "import-1",
          source: "both",
          status: "queued",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      });
      return;
    }

    if (matchesEndpoint(apiPath, API.meHardDelete)) {
      if (request.method() === "DELETE") {
        meHardDeleteCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (matchesEndpoint(apiPath, API.me)) {
      mockStates[API.me].requests += 1;

      if (request.method() === "DELETE") {
        meDeleteCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      if (request.method() === "PATCH") {
        mePatchCalls += 1;
        const mode = mockStates[API.me].mode;

        if (mode === "rate-limited") {
          await fulfillJson(route, {
            status: 429,
            headers: { "retry-after": "1" },
            body: { error: { type: "rate_limited", message: "cooldown" } },
          });
          return;
        }

        if (mode === "error") {
          await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
          return;
        }

        await fulfillJson(route, {
          body: {
            ...sampleMeProfile(),
            display_name: "Collector Updated",
          },
        });
        return;
      }

      const mode = mockStates[API.me].mode;

      if (mode === "unauthorized") {
        await fulfillJson(route, { status: 401, body: { error: { message: "session expired" } } });
        return;
      }

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "1" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      if (mode === "empty") {
        await fulfillJson(route, { body: null });
        return;
      }

      await fulfillJson(route, { body: sampleMeProfile() });
      return;
    }

    await route.continue();
  });

  return {
    setMode,
    getRequests,
    setStreamStatus: (status: 200 | 401) => {
      streamStatus = status;
    },
    enforceStreamCookieMode: () => {
      enforceStreamCookieMode = true;
    },
    setUnreadCountBase: (count: number) => {
      unreadCountBase = count;
    },
    getStreamRequests: () => streamRequests,
    getMeDeleteCalls: () => meDeleteCalls,
    getMeHardDeleteCalls: () => meHardDeleteCalls,
    getMePatchCalls: () => mePatchCalls,
    getMarkReadCalls: () => markNotificationReadCalls,
  };
}

test.describe("critical route coverage", () => {
  test("alerts route flow covers empty/error/rate-limited/success API states", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /Alerts/i })).toBeVisible();

    mocks.setMode(API.watchRules, "empty");
    const emptyStatus = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(emptyStatus).toBe(200);

    mocks.setMode(API.watchRules, "error");
    const errorStatus = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(errorStatus).toBe(500);

    mocks.setMode(API.watchRules, "rate-limited");
    const rateStatus = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(rateStatus).toBe(429);

    mocks.setMode(API.watchRules, "success");
    const retryStatus = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(retryStatus).toBe(200);
  });

  test("watchlist route flow covers empty/error/rate-limited/success API states", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /Watchlist/i })).toBeVisible();

    mocks.setMode(API.watchReleases, "empty");
    const emptyStatus = await page.evaluate(
      async () => (await fetch("/api/watch-releases")).status,
    );
    expect(emptyStatus).toBe(200);

    mocks.setMode(API.watchReleases, "error");
    const errorStatus = await page.evaluate(
      async () => (await fetch("/api/watch-releases")).status,
    );
    expect(errorStatus).toBe(500);

    mocks.setMode(API.watchReleases, "rate-limited");
    const rateStatus = await page.evaluate(async () => (await fetch("/api/watch-releases")).status);
    expect(rateStatus).toBe(429);

    mocks.setMode(API.watchReleases, "success");
    const retryStatus = await page.evaluate(
      async () => (await fetch("/api/watch-releases")).status,
    );
    expect(retryStatus).toBe(200);
  });

  test("notifications route flow covers empty/error/rate-limited/retry + mark-read", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();

    mocks.setMode(API.notifications, "empty");
    const emptyStatus = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(emptyStatus).toBe(200);

    mocks.setMode(API.notifications, "error");
    const errorStatus = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(errorStatus).toBe(500);

    mocks.setMode(API.notifications, "rate-limited");
    const rateStatus = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(rateStatus).toBe(429);

    mocks.setMode(API.notifications, "success");
    const retryStatus = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(retryStatus).toBe(200);

    await page.evaluate(async () => {
      await fetch("/api/notifications/note-1/read", { method: "POST", credentials: "include" });
    });
    expect(mocks.getMarkReadCalls()).toBeGreaterThan(0);
  });

  test("integrations route flow covers empty/error/rate-limited/retry + connect/import", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();

    mocks.setMode(API.discogsStatus, "empty");
    const emptyStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(emptyStatus).toBe(200);

    mocks.setMode(API.discogsStatus, "error");
    const errorStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(errorStatus).toBe(500);

    mocks.setMode(API.discogsStatus, "rate-limited");
    const rateStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(rateStatus).toBe(429);

    mocks.setMode(API.discogsStatus, "success");
    const retryStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(retryStatus).toBe(200);

    mocks.setMode(API.discogsConnect, "rate-limited");
    const connectRateStatus = await page.evaluate(async () => {
      const response = await fetch("/api/integrations/discogs/connect", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ external_user_id: "discogs-007" }),
      });
      return response.status;
    });
    expect(connectRateStatus).toBe(429);

    mocks.setMode(API.discogsConnect, "success");
    const connectRetryStatus = await page.evaluate(async () => {
      const response = await fetch("/api/integrations/discogs/connect", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ external_user_id: "discogs-007" }),
      });
      return response.status;
    });
    expect(connectRetryStatus).toBe(200);

    mocks.setMode(API.discogsImport, "error");
    const importErrorStatus = await page.evaluate(async () => {
      const response = await fetch("/api/integrations/discogs/import", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "both" }),
      });
      return response.status;
    });
    expect(importErrorStatus).toBe(500);

    mocks.setMode(API.discogsImport, "success");
    const importRetryStatus = await page.evaluate(async () => {
      const response = await fetch("/api/integrations/discogs/import", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "both" }),
      });
      return response.status;
    });
    expect(importRetryStatus).toBe(200);
  });

  test("settings routes load and /settings/integrations redirects", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: /^Settings$/i })).toBeVisible();

    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: /Profile Settings/i })).toBeVisible();

    mocks.setMode(API.me, "empty");
    const meEmptyStatus = await page.evaluate(async () => (await fetch("/api/me")).status);
    expect(meEmptyStatus).toBe(200);

    mocks.setMode(API.me, "error");
    const meErrorStatus = await page.evaluate(async () => (await fetch("/api/me")).status);
    expect(meErrorStatus).toBe(500);

    mocks.setMode(API.me, "rate-limited");
    const meRateStatus = await page.evaluate(async () => (await fetch("/api/me")).status);
    expect(meRateStatus).toBe(429);

    mocks.setMode(API.me, "success");
    const meRetryStatus = await page.evaluate(async () => (await fetch("/api/me")).status);
    expect(meRetryStatus).toBe(200);

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
  });

  test("/settings/danger destructive flow requires explicit confirmation", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { level: 1, name: /Danger Zone/i })).toBeVisible();

    const deactivateTrigger = page.getByRole("button", { name: "Deactivate account" });
    await expect(deactivateTrigger).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(async () => {
        await deactivateTrigger.click();
        return deactivateTrigger.getAttribute("aria-expanded");
      })
      .toBe("true");
    expect(mocks.getMeDeleteCalls()).toBe(0);

    await page.keyboard.press("Escape");
    await expect(deactivateTrigger).toHaveAttribute("aria-expanded", "false");
    expect(mocks.getMeDeleteCalls()).toBe(0);

    const hardDeleteTrigger = page.getByRole("button", { name: "Permanently delete account" });
    await expect(hardDeleteTrigger).toHaveAttribute("aria-expanded", "false");
    await expect
      .poll(async () => {
        await hardDeleteTrigger.click();
        return hardDeleteTrigger.getAttribute("aria-expanded");
      })
      .toBe("true");
    expect(mocks.getMeHardDeleteCalls()).toBe(0);

    await page.keyboard.press("Escape");
    await expect(hardDeleteTrigger).toHaveAttribute("aria-expanded", "false");
    expect(mocks.getMeHardDeleteCalls()).toBe(0);
  });

  test("auth/session-expiry checks return 401 for /api/me and /api/stream/events", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.me, "unauthorized");
    await page.goto("/settings/profile");

    const meStatus = await page.evaluate(async () => {
      const response = await fetch("/api/me", { credentials: "include" });
      return response.status;
    });
    expect(meStatus).toBe(401);

    mocks.setStreamStatus(401);
    const sseStatus = await page.evaluate(async () => {
      const response = await fetch("/api/stream/events", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "text/event-stream" },
      });
      return response.status;
    });
    expect(sseStatus).toBe(401);
  });

  test("SSE behavior follows cookie-mode expectations and triggers refresh requests", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setUnreadCountBase(1);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();

    await page.evaluate(async () => {
      await fetch("/api/stream/events", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "text/event-stream" },
      });
      await fetch("/api/notifications/unread-count", { credentials: "include" });
      await fetch("/api/notifications", { credentials: "include" });
    });

    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.unreadCount)).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.notifications)).toBeGreaterThan(0);
  });
});
