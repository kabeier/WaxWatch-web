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
    [API.meHardDelete]: { mode: "success", requests: 0 },
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
    const { pathname } = new URL(request.url());
    let apiPath = pathname;
    while (/^\/(?:api|v1|v2)(?:\/|$)/.test(apiPath)) {
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
      mockStates[API.meHardDelete].requests += 1;
      if (request.method() === "DELETE") {
        const mode = mockStates[API.meHardDelete].mode;
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

        meHardDeleteCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (matchesEndpoint(apiPath, API.me)) {
      mockStates[API.me].requests += 1;

      if (request.method() === "DELETE") {
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
  test("alerts/watchlist deep UI states with retry + recovery", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.watchRules, "empty");
    await page.goto("/alerts");
    await expect(
      page.getByText("No watch rules yet. Create one to start matching releases."),
    ).toBeVisible();

    mocks.setMode(API.watchRules, "error");
    await page.getByRole("button", { name: "Retry watch rules" }).click();
    await expect(page.getByText("Could not load watch rules.")).toBeVisible();

    mocks.setMode(API.watchRules, "rate-limited");
    await page.getByRole("button", { name: "Retry watch rules" }).click();
    await expect(page.getByText("Watch-rule requests are temporarily rate limited.")).toBeVisible();

    mocks.setMode(API.watchRules, "success");
    await page.getByRole("button", { name: "Retry watch rules" }).click();
    await expect(page.getByRole("status", { name: /Status: Loaded 1 rules\./i })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ambient restocks" })).toBeVisible();

    mocks.setMode(API.watchReleases, "empty");
    await page.goto("/watchlist");
    await expect(
      page.getByText("No watchlist releases yet. Add alerts to populate this feed."),
    ).toBeVisible();

    mocks.setMode(API.watchReleases, "error");
    await page.getByRole("button", { name: "Refresh watchlist" }).click();
    await expect(page.getByText("Could not load watchlist.")).toBeVisible();
    await page.getByRole("button", { name: "Retry watchlist" }).click();

    mocks.setMode(API.watchReleases, "rate-limited");
    await page.getByRole("button", { name: "Retry watchlist" }).click();
    await expect(
      page.getByText("Watchlist refresh is cooling down due to rate limiting."),
    ).toBeVisible();

    mocks.setMode(API.watchReleases, "success");
    await page.getByRole("button", { name: "Retry watchlist" }).click();
    await expect(
      page.getByRole("status", { name: /Status: Loaded 1 watchlist releases\./i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Tomorrow's Harvest" })).toBeVisible();
  });

  test("alerts/watchlist routes load and API states transition", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/alerts");
    await expect(page).toHaveURL(/\/alerts$/);

    mocks.setMode(API.watchRules, "error");
    expect(await page.evaluate(async () => (await fetch("/api/watch-rules")).status)).toBe(500);
    mocks.setMode(API.watchRules, "rate-limited");
    expect(await page.evaluate(async () => (await fetch("/api/watch-rules")).status)).toBe(429);
    mocks.setMode(API.watchRules, "success");
    expect(await page.evaluate(async () => (await fetch("/api/watch-rules")).status)).toBe(200);

    await page.goto("/watchlist");
    await expect(page).toHaveURL(/\/watchlist$/);
    mocks.setMode(API.watchReleases, "error");
    expect(await page.evaluate(async () => (await fetch("/api/watch-releases")).status)).toBe(500);
    mocks.setMode(API.watchReleases, "rate-limited");
    expect(await page.evaluate(async () => (await fetch("/api/watch-releases")).status)).toBe(429);
    mocks.setMode(API.watchReleases, "success");
    expect(await page.evaluate(async () => (await fetch("/api/watch-releases")).status)).toBe(200);
  });

  test("alerts and watchlist show empty/error/rate-limited states and allow retry", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.watchRules, "empty");
    await page.goto("/alerts");
    await expect(page).toHaveURL(/\/alerts$/);
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/watch-rules", { credentials: "include" });
        const payload = await response.json();
        return Array.isArray(payload) ? payload.length : -1;
      }),
    ).toBe(0);

    mocks.setMode(API.watchRules, "error");
    expect(await page.evaluate(async () => (await fetch("/api/watch-rules")).status)).toBe(500);

    mocks.setMode(API.watchRules, "rate-limited");
    expect(await page.evaluate(async () => (await fetch("/api/watch-rules")).status)).toBe(429);

    mocks.setMode(API.watchRules, "success");
    expect(await page.evaluate(async () => (await fetch("/api/watch-rules")).status)).toBe(200);

    mocks.setMode(API.watchReleases, "empty");
    await page.goto("/watchlist");
    await expect(page).toHaveURL(/\/watchlist$/);
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/watch-releases", { credentials: "include" });
        const payload = await response.json();
        return Array.isArray(payload) ? payload.length : -1;
      }),
    ).toBe(0);

    mocks.setMode(API.watchReleases, "error");
    expect(await page.evaluate(async () => (await fetch("/api/watch-releases")).status)).toBe(500);

    mocks.setMode(API.watchReleases, "rate-limited");
    expect(await page.evaluate(async () => (await fetch("/api/watch-releases")).status)).toBe(429);

    mocks.setMode(API.watchReleases, "success");
    expect(await page.evaluate(async () => (await fetch("/api/watch-releases")).status)).toBe(200);
  });

  test("notifications flow covers mark-read and unread refresh requests", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setMode(API.unreadCount, "success");

    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/notifications$/);

    await page.evaluate(async () => {
      await fetch("/api/notifications/unread-count", { credentials: "include" });
      await fetch("/api/notifications", { credentials: "include" });
      await fetch("/api/notifications/note-1/read", { method: "POST", credentials: "include" });
    });

    await expect.poll(() => mocks.getMarkReadCalls()).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.unreadCount)).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.notifications)).toBeGreaterThan(0);
  });

  test("integrations route covers status/connect/import error and retry states", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/integrations");
    await expect(page).toHaveURL(/\/integrations$/);

    mocks.setMode(API.discogsStatus, "error");
    expect(
      await page.evaluate(async () => (await fetch("/api/integrations/discogs/status")).status),
    ).toBe(500);
    mocks.setMode(API.discogsStatus, "success");
    expect(
      await page.evaluate(async () => (await fetch("/api/integrations/discogs/status")).status),
    ).toBe(200);

    mocks.setMode(API.discogsConnect, "rate-limited");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/integrations/discogs/connect", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ external_user_id: "discogs-007" }),
        });
        return response.status;
      }),
    ).toBe(429);

    mocks.setMode(API.discogsImport, "error");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/integrations/discogs/import", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: "both" }),
        });
        return response.status;
      }),
    ).toBe(500);
  });

  test("notifications and integrations user workflows include retries and success paths", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.notifications, "empty");
    mocks.setMode(API.unreadCount, "success");
    await page.goto("/notifications");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/notifications", { credentials: "include" });
        const payload = await response.json();
        return Array.isArray(payload) ? payload.length : -1;
      }),
    ).toBe(0);

    mocks.setMode(API.notifications, "error");
    expect(await page.evaluate(async () => (await fetch("/api/notifications")).status)).toBe(500);

    mocks.setMode(API.notifications, "rate-limited");
    expect(await page.evaluate(async () => (await fetch("/api/notifications")).status)).toBe(429);

    mocks.setMode(API.notifications, "success");
    expect(await page.evaluate(async () => (await fetch("/api/notifications")).status)).toBe(200);
    await page.evaluate(async () => {
      await fetch("/api/notifications/note-1/read", { method: "POST", credentials: "include" });
    });
    await expect.poll(() => mocks.getMarkReadCalls()).toBeGreaterThan(0);

    mocks.setMode(API.discogsStatus, "error");
    await page.goto("/integrations");
    expect(
      await page.evaluate(async () => (await fetch("/api/integrations/discogs/status")).status),
    ).toBe(500);

    mocks.setMode(API.discogsStatus, "rate-limited");
    expect(
      await page.evaluate(async () => (await fetch("/api/integrations/discogs/status")).status),
    ).toBe(429);

    mocks.setMode(API.discogsStatus, "success");
    expect(
      await page.evaluate(async () => (await fetch("/api/integrations/discogs/status")).status),
    ).toBe(200);

    mocks.setMode(API.discogsConnect, "rate-limited");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/integrations/discogs/connect", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ external_user_id: "discogs-007" }),
        });
        return response.status;
      }),
    ).toBe(429);

    mocks.setMode(API.discogsConnect, "success");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/integrations/discogs/connect", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ external_user_id: "discogs-007" }),
        });
        return response.status;
      }),
    ).toBe(200);

    mocks.setMode(API.discogsImport, "error");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/integrations/discogs/import", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: "both" }),
        });
        return response.status;
      }),
    ).toBe(500);

    mocks.setMode(API.discogsImport, "success");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/integrations/discogs/import", {
          method: "POST",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ source: "both" }),
        });
        return response.status;
      }),
    ).toBe(200);
  });

  test("settings profile + danger destructive APIs", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/settings\/profile$/);

    mocks.setMode(API.me, "error");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/me", {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ display_name: "Collector Updated" }),
        });
        return response.status;
      }),
    ).toBe(500);

    mocks.setMode(API.me, "success");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/me", {
          method: "PATCH",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ display_name: "Collector Updated" }),
        });
        return response.status;
      }),
    ).toBe(200);

    await page.goto("/settings/danger");
    await expect(page).toHaveURL(/\/settings\/danger$/);
    await page.evaluate(async () => {
      await fetch("/api/me", { method: "DELETE", credentials: "include" });
      await fetch("/api/me/hard-delete", { method: "DELETE", credentials: "include" });
    });
    await expect.poll(() => mocks.getMeDeleteCalls()).toBe(1);
    await expect.poll(() => mocks.getMeHardDeleteCalls()).toBe(1);
  });

  test("auth/session-expiry and SSE unauthorized behavior", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.me, "unauthorized");
    await page.goto("/settings/profile");
    const meStatus = await page.evaluate(async () => {
      const response = await fetch("/api/me", { credentials: "include" });
      return response.status;
    });
    expect(meStatus).toBe(401);

    mocks.setMode(API.me, "success");
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

  test("auth lifecycle redirects to signed-out on API 401 and SSE 401", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.me, "unauthorized");
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required$/);

    await ensureAuthenticatedSession(page);
    mocks.setMode(API.me, "success");
    mocks.setStreamStatus(401);
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required$/);
  });

  test("danger settings destructive confirmations enforce dialog workflow and retry after errors", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/danger");
    await expect(page).toHaveURL(/\/settings\/danger$/);

    await expect(page.getByRole("button", { name: /^Deactivate account$/i })).toHaveAttribute(
      "aria-controls",
      "danger-deactivate-confirm-dialog",
    );
    await expect(
      page.getByRole("button", { name: /^Permanently delete account$/i }),
    ).toHaveAttribute("aria-controls", "danger-delete-confirm-dialog");

    mocks.setMode(API.me, "error");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/me", { method: "DELETE", credentials: "include" });
        return response.status;
      }),
    ).toBe(500);

    mocks.setMode(API.me, "success");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/me", { method: "DELETE", credentials: "include" });
        return response.status;
      }),
    ).toBe(204);

    mocks.setMode(API.meHardDelete, "error");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/me/hard-delete", {
          method: "DELETE",
          credentials: "include",
        });
        return response.status;
      }),
    ).toBe(500);

    mocks.setMode(API.meHardDelete, "success");
    expect(
      await page.evaluate(async () => {
        const response = await fetch("/api/me/hard-delete", {
          method: "DELETE",
          credentials: "include",
        });
        return response.status;
      }),
    ).toBe(204);
  });

  test("danger settings destructive dialogs require explicit confirm/cancel flows", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/danger");

    await page.getByRole("button", { name: /^Deactivate account$/i }).click();
    await expect(page.getByRole("dialog", { name: "Deactivate account now?" })).toBeVisible();
    await page.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(page.getByRole("dialog", { name: "Deactivate account now?" })).not.toBeVisible();
    expect(mocks.getMeDeleteCalls()).toBe(0);

    mocks.setMode(API.me, "error");
    await page.getByRole("button", { name: /^Deactivate account$/i }).click();
    await page
      .getByRole("dialog", { name: "Deactivate account now?" })
      .getByRole("button", { name: /^Deactivate account$/i })
      .click();
    await expect(page.getByText("Could not deactivate account.")).toBeVisible();

    mocks.setMode(API.me, "success");
    await page
      .getByRole("dialog", { name: "Deactivate account now?" })
      .getByRole("button", { name: /^Deactivate account$/i })
      .click();
    await expect(page.getByText("Success: Account deactivated.")).toBeVisible();

    mocks.setMode(API.meHardDelete, "error");
    await page.getByRole("button", { name: /^Permanently delete account$/i }).click();
    await expect(page.getByRole("dialog", { name: "Delete account permanently?" })).toBeVisible();
    await page
      .getByRole("dialog", { name: "Delete account permanently?" })
      .getByRole("button", { name: /^Permanently delete account$/i })
      .click();
    await expect(page.getByText("Could not permanently delete account.")).toBeVisible();

    mocks.setMode(API.meHardDelete, "success");
    await page
      .getByRole("dialog", { name: "Delete account permanently?" })
      .getByRole("button", { name: /^Permanently delete account$/i })
      .click();
    await expect(page.getByText("Success: Account permanently deleted.")).toBeVisible();
  });

  test("SSE cookie-mode model validations", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setMode(API.unreadCount, "success");

    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/notifications$/);

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

  test("SSE model behavior updates user-visible notifications state and uses cookie mode", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setMode(API.unreadCount, "success");
    mocks.setUnreadCountBase(1);

    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/notifications$/);
    await page.evaluate(async () => {
      await fetch("/api/stream/events", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "text/event-stream" },
      });
      await fetch("/api/notifications/unread-count", { credentials: "include" });
      await fetch("/api/notifications", { credentials: "include" });
    });
    await expect.poll(() => mocks.getRequests(API.notifications)).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.unreadCount)).toBeGreaterThan(0);
    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);
  });

  test("notifications + integrations + settings deep retries and user-visible SSE refresh", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "rate-limited");
    mocks.setMode(API.unreadCount, "rate-limited");
    await page.goto("/notifications");
    await expect(page.getByText("Unread count is temporarily rate limited")).toBeVisible();
    await expect(page.getByText("Notifications are temporarily rate limited")).toBeVisible();

    mocks.setMode(API.unreadCount, "success");
    await page.getByRole("button", { name: "Retry unread count" }).click();
    await expect(page.getByText("1 unread items are waiting for review.")).toBeVisible();

    mocks.setMode(API.notifications, "success");
    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText("price_drop")).toBeVisible();

    await page.getByRole("button", { name: "Mark first unread as read" }).click();
    await expect(page.getByText("Success: Notification marked as read.")).toBeVisible();
    await expect.poll(() => mocks.getMarkReadCalls()).toBeGreaterThan(0);
    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);

    mocks.setMode(API.discogsStatus, "error");
    await page.goto("/integrations");
    await expect(page.getByText("Could not load Discogs integration status.")).toBeVisible();

    mocks.setMode(API.discogsStatus, "success");
    await page.getByRole("button", { name: "Retry Discogs status" }).click();
    await expect(page.getByText("Connected: yes")).toBeVisible();

    mocks.setMode(API.discogsConnect, "rate-limited");
    await page.getByLabel("Discogs user ID").fill("discogs-007");
    await page.getByRole("button", { name: "Connect Discogs account" }).click();
    await expect(page.getByText("Connecting Discogs is temporarily rate limited.")).toBeVisible();

    mocks.setMode(API.discogsConnect, "success");
    await page.getByRole("button", { name: "Retry Discogs connect" }).click();
    await expect(page.getByText("Success: Discogs account connected.")).toBeVisible();

    mocks.setMode(API.discogsImport, "error");
    await page.getByRole("button", { name: "Start Discogs import" }).click();
    await expect(page.getByText("Could not start Discogs import.")).toBeVisible();

    mocks.setMode(API.discogsImport, "success");
    await page.getByRole("button", { name: "Retry Discogs import" }).click();
    await expect(page.getByText("Success: Discogs import started.")).toBeVisible();

    mocks.setMode(API.me, "rate-limited");
    await page.goto("/settings/profile");
    await expect(page.getByText("Profile requests are temporarily rate limited.")).toBeVisible();

    mocks.setMode(API.me, "success");
    await page.getByRole("button", { name: "Retry profile load" }).click();
    await expect(page.getByText("Signed in as collector@example.com")).toBeVisible();

    mocks.setMode(API.me, "error");
    await page.getByRole("button", { name: "Save profile changes" }).click();
    await expect(page.getByText("Could not save profile settings.")).toBeVisible();

    mocks.setMode(API.me, "success");
    await page.getByRole("button", { name: "Save profile changes" }).click();
    await expect(page.getByText("Success: Profile settings saved.")).toBeVisible();
  });
});
