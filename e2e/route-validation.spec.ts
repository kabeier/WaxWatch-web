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
  watchRules: "/api/watch-rules",
  watchReleases: "/api/watch-releases",
  notifications: "/api/notifications",
  unreadCount: "/api/notifications/unread-count",
  me: "/api/me",
  meHardDelete: "/api/me/hard-delete",
  discogsStatus: "/api/integrations/discogs/status",
  streamEvents: "/api/stream/events",
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

async function installApiMocks(page: Page) {
  const mockStates: Record<string, RouteMockState> = {
    [API.watchRules]: { mode: "empty", requests: 0 },
    [API.watchReleases]: { mode: "empty", requests: 0 },
    [API.notifications]: { mode: "empty", requests: 0 },
    [API.unreadCount]: { mode: "success", requests: 0 },
    [API.discogsStatus]: { mode: "empty", requests: 0 },
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

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const { pathname } = new URL(request.url());

    if (pathname.startsWith(API.streamEvents)) {
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

    if (pathname.startsWith(API.unreadCount)) {
      mockStates[API.unreadCount].requests += 1;

      const mode = mockStates[API.unreadCount].mode;
      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "15" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
        return;
      }

      const unreadCount = Math.min(unreadCountBase + mockStates[API.unreadCount].requests - 1, 2);
      await fulfillJson(route, { body: { unread_count: unreadCount } });
      return;
    }

    if (pathname.startsWith(API.watchRules)) {
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

    if (pathname.startsWith(API.watchReleases)) {
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

    if (pathname.startsWith(API.notifications) && !pathname.startsWith(API.unreadCount)) {
      mockStates[API.notifications].requests += 1;

      if (request.method() === "POST" && pathname.endsWith("/read")) {
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

    if (pathname.startsWith(API.discogsStatus)) {
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

    if (pathname.startsWith(API.meHardDelete)) {
      if (request.method() === "DELETE") {
        meHardDeleteCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }
    }

    if (pathname.startsWith(API.me)) {
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

    await fulfillJson(route, { body: {} });
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
  test("alerts flow covers empty/error/rate-limit/retry and recovers to populated state", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /Alerts/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create alert/i })).toBeVisible();

    mocks.setMode(API.watchRules, "error");
    await page.getByRole("button", { name: /Retry watch rules/i }).click();
    await expect(page.getByText(/Could not load watch rules/i)).toBeVisible();

    mocks.setMode(API.watchRules, "rate-limited");
    await page.getByRole("button", { name: /Retry watch rules/i }).click();
    await expect(page.getByText(/temporarily rate limited/i)).toBeVisible();

    mocks.setMode(API.watchRules, "success");
    await page.getByRole("button", { name: /Retry watch rules/i }).click();
    await expect(page.getByRole("status").filter({ hasText: /Loaded 1 rules/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Ambient restocks/i })).toBeVisible();
  });

  test("watchlist flow covers empty/error/rate-limit/retry with actionable row and refresh", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /Watchlist/i })).toBeVisible();

    mocks.setMode(API.watchReleases, "error");
    await page.getByRole("button", { name: /Refresh watchlist/i }).click();
    await expect(page.getByText(/Could not load watchlist/i)).toBeVisible();

    mocks.setMode(API.watchReleases, "rate-limited");
    await page.getByRole("button", { name: /Retry watchlist/i }).click();
    await expect(page.getByText(/cooling down due to rate limiting/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Refresh watchlist/i })).toBeDisabled();

    mocks.setMode(API.watchReleases, "success");
    await page.reload();
    await expect(
      page.getByRole("status").filter({ hasText: /Loaded 1 watchlist releases/i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Tomorrow's Harvest/i })).toBeVisible();
  });

  test("notifications flow covers empty/error/rate-limit/retry and mark-read action", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
    await expect(page.getByText(/unread items are waiting for review/i)).toBeVisible();

    mocks.setMode(API.notifications, "error");
    await page.getByRole("button", { name: /Retry notifications feed/i }).click();
    await expect(page.getByText(/Notifications failed to load/i)).toBeVisible();

    mocks.setMode(API.notifications, "rate-limited");
    await page.getByRole("button", { name: /Retry notifications feed/i }).click();
    await expect(page.getByText(/temporarily rate limited/i)).toBeVisible();

    mocks.setMode(API.notifications, "success");
    await page.reload();
    await expect(page.getByText(/price_drop/i)).toBeVisible();

    await page.getByRole("button", { name: /Mark first unread as read/i }).click();
    await expect.poll(() => mocks.getMarkReadCalls()).toBe(1);
    await expect(
      page.getByRole("status", { name: /Success: Notification marked as read/i }),
    ).toBeVisible();
  });

  test("integrations flow covers empty/error/rate-limit/retry and recoverable status view", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();

    mocks.setMode(API.discogsStatus, "error");
    await page.getByRole("button", { name: /Refresh Discogs status/i }).click();
    await expect(page.getByText(/Could not load Discogs integration status/i)).toBeVisible();

    mocks.setMode(API.discogsStatus, "rate-limited");
    await page.getByRole("button", { name: /Retry Discogs status/i }).click();
    await expect(page.getByText(/cooling down due to rate limiting/i)).toBeVisible();

    mocks.setMode(API.discogsStatus, "success");
    await page.reload();
    await expect(page.getByText(/Connected: yes/i)).toBeVisible();
    await expect(page.getByText(/External user id: discogs-123/i)).toBeVisible();
  });

  test("settings flow covers landing/profile/alerts tabs, redirects, and save dialogs", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: /^Settings$/i })).toBeVisible();
    await page.getByRole("link", { name: /Open Profile Settings/i }).click();

    await expect(page).toHaveURL(/\/settings\/profile$/);
    await expect(page.getByRole("heading", { level: 1, name: /Profile Settings/i })).toBeVisible();

    await page.getByLabel(/Display name/i).fill("Collector Updated");
    await page.getByRole("button", { name: /Save profile changes/i }).click();
    await expect(page.getByText(/Success: Profile settings saved/i)).toBeVisible();
    await expect.poll(() => mocks.getMePatchCalls()).toBeGreaterThan(0);

    await page.goto("/settings/alerts");
    await expect(
      page.getByRole("heading", { level: 1, name: /Alert Delivery Settings/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /Save alert settings/i }).click();
    const dialog = page.locator(".ww-confirm-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: /Save changes/i }).click();
    await expect(
      page.getByRole("status", { name: /Success: Alert delivery settings saved/i }),
    ).toBeVisible();

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
  });

  test("danger settings destructive flows require explicit confirmation for deactivate and hard delete", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { level: 1, name: /Danger Zone/i })).toBeVisible();

    const deactivateButton = page.getByRole("button", { name: "Deactivate account" });
    await deactivateButton.click();
    const deactivateDialog = page.locator("#danger-deactivate-confirm-dialog");
    await expect(deactivateDialog).toBeVisible();
    await deactivateDialog.getByRole("button", { name: /Cancel/i }).click();
    await expect(deactivateDialog).toBeHidden();
    expect(mocks.getMeDeleteCalls()).toBe(0);

    await deactivateButton.click();
    await deactivateDialog.getByRole("button", { name: /^Deactivate account$/ }).click();
    await expect(page).toHaveURL(/\/account-removed$/);
    expect(mocks.getMeDeleteCalls()).toBe(1);

    await page.goto("/settings/danger");
    const hardDeleteButton = page.getByRole("button", { name: "Permanently delete account" });
    await hardDeleteButton.click();
    const hardDeleteDialog = page.locator("#danger-delete-confirm-dialog");
    await expect(hardDeleteDialog).toBeVisible();
    await hardDeleteDialog.getByRole("button", { name: /Cancel/i }).click();
    await expect(hardDeleteDialog).toBeHidden();
    expect(mocks.getMeHardDeleteCalls()).toBe(0);

    await hardDeleteButton.click();
    await hardDeleteDialog.getByRole("button", { name: /^Permanently delete account$/ }).click();
    await expect(page).toHaveURL(/\/account-removed$/);
    expect(mocks.getMeHardDeleteCalls()).toBe(1);
  });

  test("auth lifecycle: /api/me 401 redirects to signed-out with reauth-required reason", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    mocks.setMode(API.me, "unauthorized");

    await page.goto("/settings/profile");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required/);
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
  });

  test("auth lifecycle: SSE session expiry redirects to signed-out and stops stream", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);
    mocks.setStreamStatus(401);

    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required/);
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);
  });

  test("SSE notification event triggers user-visible unread count refresh and feed invalidation", async ({
    page,
    context,
  }) => {
    const mocks = await installApiMocks(page);

    mocks.enforceStreamCookieMode();
    mocks.setMode(API.notifications, "success");
    mocks.setUnreadCountBase(1);

    await context.addCookies([
      {
        name: "waxwatch_session",
        value: "fake-session",
        domain: "127.0.0.1",
        path: "/",
        httpOnly: false,
        sameSite: "Lax",
      },
    ]);

    await page.goto("/notifications");

    const unreadCallout = page.getByText(/unread items are waiting for review/i);
    await expect(unreadCallout).toBeVisible();
    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);
    await expect.poll(() => mocks.getRequests(API.unreadCount)).toBeGreaterThan(1);
    await expect.poll(() => mocks.getRequests(API.notifications)).toBeGreaterThan(1);
  });
});
