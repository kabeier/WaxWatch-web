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
  test("alerts route critical flow covers empty/error/rate-limit/retry recovery", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /Alerts/i })).toBeVisible();
    await expect(page.getByText(/No watch rules yet/i)).toBeVisible();

    mocks.setMode(API.watchRules, "error");
    await page.getByRole("button", { name: /Retry watch rules/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Could not load watch rules/i);

    mocks.setMode(API.watchRules, "rate-limited");
    await page.getByRole("button", { name: /Retry watch rules/i }).click();
    await expect(page.getByRole("alert")).toContainText(/temporarily rate limited/i);

    mocks.setMode(API.watchRules, "success");
    await page.getByRole("button", { name: /Retry watch rules/i }).click();
    await expect(page.getByRole("status")).toContainText(/Loaded 1 rules/i);
    await expect(page.getByRole("link", { name: /Ambient restocks/i })).toBeVisible();
  });

  test("watchlist route critical flow covers empty/error/rate-limit/retry recovery", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /Watchlist/i })).toBeVisible();
    await expect(page.getByText(/No watchlist releases yet/i)).toBeVisible();

    mocks.setMode(API.watchReleases, "error");
    await page.getByRole("button", { name: /Retry watchlist/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Could not load watchlist/i);

    mocks.setMode(API.watchReleases, "rate-limited");
    await page.getByRole("button", { name: /Retry watchlist/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Watchlist refresh is cooling down/i);

    mocks.setMode(API.watchReleases, "success");
    await page.getByRole("button", { name: /Retry watchlist/i }).click();
    await expect(page.getByRole("status")).toContainText(/Loaded 1 watchlist releases/i);
    await expect(page.getByRole("link", { name: /Tomorrow's Harvest/i })).toBeVisible();
  });

  test("notifications route critical flow covers empty/error/rate-limit/retry + mark-read", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
    await expect(page.getByText(/No notifications yet/i)).toBeVisible();

    mocks.setMode(API.notifications, "error");
    await page.getByRole("button", { name: /Retry notifications feed/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Could not load notifications/i);

    mocks.setMode(API.notifications, "rate-limited");
    await page.getByRole("button", { name: /Retry notifications feed/i }).click();
    await expect(page.getByRole("alert")).toContainText(
      /Notifications are temporarily rate limited/i,
    );

    mocks.setMode(API.notifications, "success");
    await page.getByRole("button", { name: /Retry notifications feed/i }).click();
    await expect(page.getByText(/price_drop/i)).toBeVisible();
    await expect(page.getByText(/Unread/i)).toBeVisible();

    await page.evaluate(async () => {
      await fetch("/api/notifications/note-1/read", { method: "POST", credentials: "include" });
    });
    expect(mocks.getMarkReadCalls()).toBeGreaterThan(0);
  });

  test("integrations route critical flow covers empty/error/rate-limit/retry + connect/import", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();
    await expect(page.getByText(/No integration status found/i)).toBeVisible();

    mocks.setMode(API.discogsStatus, "error");
    await page.getByRole("button", { name: /Retry Discogs status/i }).click();
    await expect(page.getByRole("alert")).toContainText(
      /Could not load Discogs integration status/i,
    );

    mocks.setMode(API.discogsStatus, "rate-limited");
    await page.getByRole("button", { name: /Retry Discogs status/i }).click();
    await expect(page.getByRole("alert")).toContainText(/cooling down due to rate limiting/i);

    mocks.setMode(API.discogsStatus, "success");
    await page.getByRole("button", { name: /Retry Discogs status/i }).click();
    await expect(page.getByText(/Connected: yes/i)).toBeVisible();

    mocks.setMode(API.discogsConnect, "rate-limited");
    await page.getByLabel(/Discogs user ID/i).fill("discogs-007");
    await page.getByRole("button", { name: /Connect Discogs account/i }).click();
    await expect(page.getByRole("alert")).toContainText(
      /Connecting Discogs is temporarily rate limited/i,
    );

    mocks.setMode(API.discogsConnect, "success");
    await page.getByRole("button", { name: /Retry Discogs connect/i }).click();
    await expect(page.getByRole("status")).toContainText(/Discogs account connected/i);

    mocks.setMode(API.discogsImport, "error");
    await page.getByRole("button", { name: /Start Discogs import/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Could not start Discogs import/i);

    mocks.setMode(API.discogsImport, "success");
    await page.getByRole("button", { name: /Retry Discogs import/i }).click();
    await expect(page.getByRole("status")).toContainText(/Discogs import started/i);
  });

  test("settings profile flow covers empty/error/rate-limit/retry and settings redirect", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: /Profile Settings/i })).toBeVisible();
    await expect(page.getByText(/Signed in as collector@example.com/i)).toBeVisible();

    mocks.setMode(API.me, "empty");
    await page.getByRole("button", { name: /Retry profile load/i }).click();
    await expect(page.getByText(/No profile found/i)).toBeVisible();

    mocks.setMode(API.me, "error");
    await page.getByRole("button", { name: /Retry profile load/i }).click();
    await expect(page.getByRole("alert")).toContainText(/Could not load profile/i);

    mocks.setMode(API.me, "rate-limited");
    await page.getByRole("button", { name: /Retry profile load/i }).click();
    await expect(page.getByRole("alert")).toContainText(
      /Profile requests are temporarily rate limited/i,
    );

    mocks.setMode(API.me, "success");
    await page.getByRole("button", { name: /Retry profile load/i }).click();
    await expect(page.getByRole("button", { name: /Save profile changes/i })).toBeEnabled();

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
  });

  test("/settings/danger destructive flow requires explicit confirmation", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { level: 1, name: /Danger Zone/i })).toBeVisible();

    const deactivateTrigger = page.getByRole("button", { name: "Deactivate account" });
    await deactivateTrigger.click();
    await expect(
      page.getByRole("alertdialog", { name: /Deactivate account now\?/i }),
    ).toBeVisible();
    expect(mocks.getMeDeleteCalls()).toBe(0);

    await page.keyboard.press("Escape");
    expect(mocks.getMeDeleteCalls()).toBe(0);

    const hardDeleteTrigger = page.getByRole("button", { name: "Permanently delete account" });
    await hardDeleteTrigger.click();
    await expect(
      page.getByRole("alertdialog", { name: /Delete account permanently\?/i }),
    ).toBeVisible();
    expect(mocks.getMeHardDeleteCalls()).toBe(0);

    await page.keyboard.press("Escape");
    expect(mocks.getMeHardDeleteCalls()).toBe(0);

    await deactivateTrigger.click();
    await page
      .getByRole("alertdialog", { name: /Deactivate account now\?/i })
      .getByRole("button", { name: /^Deactivate account$/i })
      .click();
    await expect(page.getByRole("status")).toContainText(/Account deactivated/i);
    expect(mocks.getMeDeleteCalls()).toBe(1);

    await hardDeleteTrigger.click();
    await page
      .getByRole("alertdialog", { name: /Delete account permanently\?/i })
      .getByRole("button", { name: /^Permanently delete account$/i })
      .click();
    await expect(page.getByRole("status")).toContainText(/Account permanently deleted/i);
    expect(mocks.getMeHardDeleteCalls()).toBe(1);
  });

  test("auth lifecycle redirects to signed-out when /api/me returns 401", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.setMode(API.me, "unauthorized");
    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required/);
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
  });

  test("auth lifecycle redirects to signed-out when SSE returns 401", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);
    mocks.setStreamStatus(401);
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required/);
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
  });

  test("SSE user-visible behavior follows cookie-mode expectations and refreshes unread/feed data", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setUnreadCountBase(1);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
    await expect(page.getByText(/1 unread items are waiting for review/i)).toBeVisible();
    await expect(page.getByText(/price_drop/i)).toBeVisible();
    await expect(page.getByText(/2 unread items are waiting for review/i)).toBeVisible();

    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.unreadCount)).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.notifications)).toBeGreaterThan(0);
  });
});
