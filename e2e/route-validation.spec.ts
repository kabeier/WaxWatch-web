import { expect, test, type Page, type Route } from "@playwright/test";

type JsonInit = {
  status?: number;
  body: unknown;
  delayMs?: number;
  headers?: Record<string, string>;
};

type MockMode = "success" | "empty" | "error" | "rate-limited";

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

  const setMode = (pathname: string, mode: MockMode) => {
    mockStates[pathname] = { ...mockStates[pathname], mode };
  };

  const getRequests = (pathname: string) => mockStates[pathname]?.requests ?? 0;

  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname.startsWith(API.streamEvents)) {
      streamRequests += 1;

      const headers = route.request().headers();
      expect(headers.accept).toContain("text/event-stream");

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
      await fulfillJson(route, { body: { unread_count: 1 } });
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
          headers: { "retry-after": "45" },
          body: { error: { type: "rate_limited", message: "cooldown" } },
        });
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
          headers: { "retry-after": "30" },
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
      const mode = mockStates[API.notifications].mode;

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
          headers: { "retry-after": "20" },
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

    if (pathname.startsWith(API.me)) {
      mockStates[API.me].requests += 1;
      if (route.request().method() === "DELETE") {
        meDeleteCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      const mode = mockStates[API.me].mode;

      if (mode === "error") {
        await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
        return;
      }

      if (mode === "rate-limited") {
        await fulfillJson(route, {
          status: 429,
          headers: { "retry-after": "25" },
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
    getStreamRequests: () => streamRequests,
    getMeDeleteCalls: () => meDeleteCalls,
  };
}

test.describe("critical route coverage", () => {
  test("/alerts supports empty, error, rate-limit, and retry recovery", async ({ page }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /Alerts/i })).toBeVisible();
    await expect(
      page.getByText("No watch rules yet. Create one to start matching releases."),
    ).toBeVisible();

    mocks.setMode(API.watchRules, "error");
    await page.reload();
    await expect(page.getByText("Could not load watch rules.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry watch rules" })).toBeVisible();

    mocks.setMode(API.watchRules, "success");
    await page.getByRole("button", { name: "Retry watch rules" }).click();
    await expect(page.getByRole("status", { name: /Status: Loaded 1 rules\./i })).toBeVisible();

    mocks.setMode(API.watchRules, "rate-limited");
    await page.reload();
    await expect(page.getByText("Watch-rule requests are temporarily rate limited.")).toBeVisible();
    await expect(page.getByText(/Retry-After:\s+45s/)).toBeVisible();
  });

  test("/watchlist supports empty, error, rate-limit, and retry recovery", async ({ page }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /Watchlist/i })).toBeVisible();
    await expect(
      page.getByText("No watchlist releases yet. Add alerts to populate this feed."),
    ).toBeVisible();

    mocks.setMode(API.watchReleases, "error");
    await page.reload();
    await expect(page.getByText("Could not load watchlist.")).toBeVisible();

    mocks.setMode(API.watchReleases, "success");
    await page.getByRole("button", { name: "Retry watchlist" }).click();
    await expect(
      page.getByRole("status", { name: /Status: Loaded 1 watchlist releases\./i }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Tomorrow's Harvest" })).toBeVisible();

    mocks.setMode(API.watchReleases, "rate-limited");
    await page.reload();
    await expect(
      page.getByText("Watchlist refresh is cooling down due to rate limiting."),
    ).toBeVisible();
    await expect(page.getByText(/Retry-After:\s+30s/)).toBeVisible();
  });

  test("/notifications supports empty, error, rate-limit, and retry recovery", async ({ page }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
    await expect(page.getByText("No notifications yet.")).toBeVisible();

    mocks.setMode(API.notifications, "error");
    await page.reload();
    await expect(page.getByText("Could not load notifications.")).toBeVisible();

    mocks.setMode(API.notifications, "success");
    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText("price_drop")).toBeVisible();

    mocks.setMode(API.notifications, "rate-limited");
    await page.reload();
    await expect(page.getByText("Notifications are temporarily rate limited")).toBeVisible();
    await expect(page.getByText(/Retry-After:\s+15s/)).toBeVisible();
  });

  test("/settings/* routes load and /settings/integrations redirects to /integrations", async ({
    page,
  }) => {
    await installApiMocks(page);

    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: /^Settings$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open Profile Settings/i })).toBeVisible();

    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: /Profile Settings/i })).toBeVisible();

    await page.goto("/settings/alerts");
    await expect(
      page.getByRole("heading", { level: 1, name: /Alert Delivery Settings/i }),
    ).toBeVisible();

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { level: 1, name: /Danger Zone/i })).toBeVisible();

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();
  });

  test("/settings/profile and /settings/alerts include load error and retry recovery", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    mocks.setMode(API.me, "error");
    await page.goto("/settings/profile");
    await expect(page.getByText("Could not load profile.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Retry profile load" })).toBeVisible();

    mocks.setMode(API.me, "success");
    await page.getByRole("button", { name: "Retry profile load" }).click();
    await expect(page.getByText("Signed in as collector@example.com")).toBeVisible();

    mocks.setMode(API.me, "rate-limited");
    await page.goto("/settings/alerts");
    await expect(page.getByText("Settings are temporarily rate limited.")).toBeVisible();
    await expect(page.getByText(/Retry-After:\s+25s/)).toBeVisible();

    mocks.setMode(API.me, "success");
    await page.getByRole("button", { name: "Retry settings load" }).click();
    await expect(page.getByLabel("Delivery frequency")).toBeEnabled();
  });

  test("/integrations supports empty, error, rate-limit, and retry recovery", async ({ page }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();
    await expect(page.getByText("No integration status found.")).toBeVisible();

    mocks.setMode(API.discogsStatus, "error");
    await page.reload();
    await expect(page.getByText("Could not load Discogs integration status.")).toBeVisible();

    mocks.setMode(API.discogsStatus, "success");
    await page.getByRole("button", { name: "Retry Discogs status" }).click();
    await expect(page.getByText("Connected: yes")).toBeVisible();

    mocks.setMode(API.discogsStatus, "rate-limited");
    await page.reload();
    await expect(
      page.getByText("Discogs integration status is cooling down due to rate limiting."),
    ).toBeVisible();
    await expect(page.getByText(/Retry-After:\s+20s/)).toBeVisible();
  });

  test("/settings/danger destructive flow requires confirmation before DELETE", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    await page.goto("/settings/danger");

    const deactivateButton = page.getByRole("button", { name: "Deactivate account" });
    await expect(deactivateButton).toBeVisible();
    await deactivateButton.click();

    const dialog = page.locator("#danger-deactivate-confirm-dialog");
    await expect(dialog).toBeVisible();

    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();
    expect(mocks.getMeDeleteCalls()).toBe(0);

    await deactivateButton.click();
    await page.getByRole("button", { name: /^Deactivate account$/ }).click();

    await expect(page).toHaveURL(/\/account-removed$/);
    expect(mocks.getMeDeleteCalls()).toBe(1);
  });

  test("auth lifecycle redirects to signed-out when session expires on SSE (401)", async ({
    page,
  }) => {
    const mocks = await installApiMocks(page);

    mocks.setStreamStatus(401);

    await page.goto("/alerts");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required$/);
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
  });

  test("SSE uses cookie/session mode and invalidates unread data on notification event", async ({
    page,
    context,
  }) => {
    const mocks = await installApiMocks(page);

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

    await expect.poll(() => mocks.getStreamRequests()).toBeGreaterThan(0);
    await expect
      .poll(() => mocks.getRequests(API.unreadCount) + mocks.getRequests(API.notifications))
      .toBeGreaterThan(2);
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
  });
});
