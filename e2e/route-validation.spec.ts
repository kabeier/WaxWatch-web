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
  test("alerts route renders empty/error/rate-limited and retries into success", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /Alerts/i })).toBeVisible();
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
    await expect(
      page.getByRole("status").filter({ hasText: "Status: Loaded 1 rules." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Ambient restocks" })).toBeVisible();
  });

  test("watchlist route renders empty/error/rate-limited and retries into success", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /Watchlist/i })).toBeVisible();
    await expect(
      page.getByText("No watchlist releases yet. Add alerts to populate this feed."),
    ).toBeVisible();

    mocks.setMode(API.watchReleases, "error");
    await page.getByRole("button", { name: "Retry watchlist" }).click();
    await expect(page.getByText("Could not load watchlist.")).toBeVisible();

    mocks.setMode(API.watchReleases, "rate-limited");
    await page.getByRole("button", { name: "Retry watchlist" }).click();
    await expect(
      page.getByText("Watchlist refresh is cooling down due to rate limiting."),
    ).toBeVisible();

    mocks.setMode(API.watchReleases, "success");
    await page.getByRole("button", { name: "Retry watchlist" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "Status: Loaded 1 watchlist releases." }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Tomorrow's Harvest" })).toBeVisible();
  });

  test("notifications route covers empty/error/rate-limited/retry + mark-read", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
    await expect(page.getByText("No notifications yet.")).toBeVisible();

    mocks.setMode(API.notifications, "error");
    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText("Notifications failed to load")).toBeVisible();

    mocks.setMode(API.notifications, "rate-limited");
    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText("Notifications are temporarily rate limited")).toBeVisible();

    mocks.setMode(API.notifications, "success");
    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText("price_drop")).toBeVisible();

    await page.getByRole("button", { name: "Mark first unread as read" }).click();
    await expect.poll(() => mocks.getMarkReadCalls()).toBeGreaterThan(0);
  });

  test("integrations route covers empty/error/rate-limited/retry and connect/import actions", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();
    await expect(page.getByText("No integration status found.")).toBeVisible();

    mocks.setMode(API.discogsStatus, "error");
    await page.getByRole("button", { name: "Refresh Discogs status" }).click();
    await expect(page.getByText("Could not load Discogs integration status.")).toBeVisible();

    mocks.setMode(API.discogsStatus, "rate-limited");
    await page.getByRole("button", { name: "Retry Discogs status" }).click();
    await expect(
      page.getByText("Discogs integration status is cooling down due to rate limiting."),
    ).toBeVisible();

    mocks.setMode(API.discogsStatus, "success");
    await page.getByRole("button", { name: "Retry Discogs status" }).click();
    await expect(page.getByText("Connected: yes")).toBeVisible();

    await page.getByLabel("Discogs user ID").fill("discogs-007");

    mocks.setMode(API.discogsConnect, "rate-limited");
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
  });

  test("settings/profile supports empty/error/rate-limited/retry and legacy integrations redirect", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: /^Settings$/i })).toBeVisible();

    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: /Profile Settings/i })).toBeVisible();

    mocks.setMode(API.me, "empty");
    await page.getByRole("button", { name: "Retry profile load" }).click();
    await expect(page.getByText("No profile found.")).toBeVisible();

    mocks.setMode(API.me, "error");
    await page.getByRole("button", { name: "Save profile changes" }).click();
    await expect(page.getByText("Could not load profile.")).toBeVisible();

    mocks.setMode(API.me, "rate-limited");
    await page.getByRole("button", { name: "Retry profile load" }).click();
    await expect(page.getByText("Profile requests are temporarily rate limited.")).toBeVisible();

    mocks.setMode(API.me, "success");
    await page.getByRole("button", { name: "Retry profile load" }).click();
    await expect(page.getByText("Signed in as collector@example.com")).toBeVisible();

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
  });

  test("/settings/danger destructive confirmation gates /me and /me/hard-delete", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { level: 1, name: /Danger Zone/i })).toBeVisible();

    await page.getByRole("button", { name: "Deactivate account" }).click();
    await expect(page.getByRole("alertdialog", { name: "Deactivate account now?" })).toBeVisible();
    expect(mocks.getMeDeleteCalls()).toBe(0);

    await page.getByRole("button", { name: "Cancel" }).click();
    expect(mocks.getMeDeleteCalls()).toBe(0);

    await page.getByRole("button", { name: "Deactivate account" }).click();
    await page
      .getByRole("alertdialog", { name: "Deactivate account now?" })
      .getByRole("button", { name: "Deactivate account" })
      .click();
    await expect.poll(() => mocks.getMeDeleteCalls()).toBe(1);
    await expect(page).toHaveURL(/\/account-removed$/);

    await page.goto("/settings/danger");
    await page.getByRole("button", { name: "Permanently delete account" }).click();
    await expect(
      page.getByRole("alertdialog", { name: "Delete account permanently?" }),
    ).toBeVisible();
    expect(mocks.getMeHardDeleteCalls()).toBe(0);

    await page.getByRole("button", { name: "Cancel" }).click();
    expect(mocks.getMeHardDeleteCalls()).toBe(0);

    await page.getByRole("button", { name: "Permanently delete account" }).click();
    await page
      .getByRole("alertdialog", { name: "Delete account permanently?" })
      .getByRole("button", { name: "Permanently delete account" })
      .click();
    await expect.poll(() => mocks.getMeHardDeleteCalls()).toBe(1);
    await expect(page).toHaveURL(/\/account-removed$/);
  });

  test("auth lifecycle: unauthorized profile request redirects to signed-out", async ({ page }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);
    mocks.setMode(API.me, "unauthorized");

    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required$/);
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
  });

  test("SSE in cookie-mode updates unread/feed and reauth 401 stops reconnect", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    await ensureAuthenticatedSession(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setUnreadCountBase(1);

    await page.goto("/notifications");
    await expect(page.getByText("1 unread items are waiting for review.")).toBeVisible();

    await expect(page.getByText("2 unread items are waiting for review.")).toBeVisible();
    await expect.poll(() => mocks.getRequests(API.unreadCount)).toBeGreaterThan(1);
    await expect.poll(() => mocks.getRequests(API.notifications)).toBeGreaterThan(1);

    mocks.setStreamStatus(401);
    await page.reload();
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required$/);

    const streamRequestsBeforeWait = mocks.getStreamRequests();
    await page.waitForTimeout(1500);
    expect(mocks.getStreamRequests()).toBe(streamRequestsBeforeWait);
  });
});
