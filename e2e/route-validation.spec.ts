import { expect, test, type Page, type Route } from "@playwright/test";

type JsonRouteOptions = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  delayMs?: number;
};

const meProfileFixture = {
  id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
  email: "listener@example.com",
  is_active: true,
  created_at: "2026-01-20T11:52:00+00:00",
  updated_at: "2026-01-20T12:00:00+00:00",
  display_name: "Wax Collector",
  preferences: {
    timezone: "America/Chicago",
    currency: "USD",
    notifications_email: true,
    notifications_push: false,
    quiet_hours_start: 23,
    quiet_hours_end: 7,
    notification_timezone: "America/Chicago",
    delivery_frequency: "daily",
  },
  integrations: [{ provider: "discogs", linked: true, watch_rule_count: 3 }],
};

const watchRuleFixture = {
  id: "80dc6333-3c3c-49b8-a803-938783fbeb99",
  user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
  name: "Rare techno under $40",
  query: { sources: ["discogs"], q: "detroit techno", max_price: 40 },
  is_active: true,
  poll_interval_seconds: 600,
  last_run_at: "2026-01-20T12:00:00+00:00",
  next_run_at: "2026-01-20T12:10:00+00:00",
  created_at: "2026-01-20T11:52:00+00:00",
  updated_at: "2026-01-20T12:00:00+00:00",
};

const watchReleaseFixture = {
  id: "24550438-0dfc-4f1f-a19b-3b8b682b5f6f",
  user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
  discogs_release_id: 1001,
  discogs_master_id: 5001,
  match_mode: "master_release",
  title: "Demo Want",
  artist: "Artist A",
  year: 1999,
  target_price: 45,
  currency: "USD",
  min_condition: "vg+",
  is_active: true,
  created_at: "2026-01-20T10:00:00+00:00",
  updated_at: "2026-01-20T10:00:00+00:00",
};

const notificationFixture = {
  id: "4c8d9157-4a8c-4ea8-9d27-3ad2fc1e8f95",
  user_id: "8f2a5009-c0a2-4f90-8f1b-c1716c26bf06",
  event_id: "f2eec3e4-1f39-4a9f-9f39-2359f3983be0",
  event_type: "watch_match_found",
  channel: "realtime",
  status: "sent",
  is_read: false,
  delivered_at: "2026-01-20T12:00:04+00:00",
  failed_at: null,
  read_at: null,
  created_at: "2026-01-20T12:00:03+00:00",
};

function routePattern(path: string) {
  return `**${path}*`;
}

async function mockJson(
  page: Page,
  path: string,
  { status = 200, body = {}, headers = {}, delayMs = 0 }: JsonRouteOptions,
) {
  await page.route(routePattern(path), async (route) => {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    await route.fulfill({
      status,
      contentType: "application/json",
      headers,
      body: JSON.stringify(body),
    });
  });
}

async function mockRateLimited(page: Page, path: string, message: string, retryAfterSeconds = 30) {
  await mockJson(page, path, {
    status: 429,
    headers: { "retry-after": `${retryAfterSeconds}` },
    body: {
      error: {
        message,
        details: {
          retry_after_seconds: retryAfterSeconds,
        },
      },
    },
  });
}

async function mockAppChromeRequests(page: Page) {
  await mockJson(page, "/api/me", { body: meProfileFixture });
  await mockJson(page, "/api/notifications/unread-count", { body: { unread_count: 2 } });
  await page.route(routePattern("/api/stream/events"), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: ": keepalive\n\n",
    });
  });
}

test.describe("route-focused state validation", () => {
  test("/alerts supports loading, error, empty, and rate-limited states", async ({ page }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/watch-rules", { body: [watchRuleFixture], delayMs: 800 });

    await page.goto("/alerts");
    await expect(page.getByText("Loading watch rules…")).toBeVisible();
    await expect(page.getByRole("link", { name: /rare techno under \$40/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.unroute(routePattern("/api/watch-rules"));
    await mockJson(page, "/api/watch-rules", {
      status: 500,
      body: { error: { message: "alerts backend down" } },
    });
    await page.getByRole("button", { name: /retry watch rules/i }).click();
    await expect(page.getByText(/could not load watch rules\./i)).toBeVisible();

    await page.unroute(routePattern("/api/watch-rules"));
    await mockJson(page, "/api/watch-rules", { body: [] });
    await page.getByRole("button", { name: /retry watch rules/i }).click();
    await expect(page.getByText(/no watch rules yet\./i)).toBeVisible();

    await page.unroute(routePattern("/api/watch-rules"));
    await mockRateLimited(page, "/api/watch-rules", "alerts cooldown active", 42);
    await page.getByRole("button", { name: /retry watch rules/i }).click();
    await expect(page.getByText(/temporarily rate limited/i)).toBeVisible();
    await expect(page.getByText(/42s/i)).toBeVisible();
  });

  test("/watchlist supports loading, error, empty, and rate-limited states", async ({ page }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/watch-releases", {
      body: [watchReleaseFixture],
      delayMs: 800,
    });

    await page.goto("/watchlist");
    await expect(page.getByText("Loading watchlist…")).toBeVisible();
    await expect(page.getByRole("link", { name: /demo want/i })).toBeVisible({
      timeout: 10_000,
    });

    await page.unroute(routePattern("/api/watch-releases"));
    await mockJson(page, "/api/watch-releases", {
      status: 500,
      body: { error: { message: "watchlist backend down" } },
    });
    await page
      .getByRole("button", { name: /retry watchlist/i })
      .first()
      .click();
    await expect(page.getByText(/could not load watchlist\./i)).toBeVisible();

    await page.unroute(routePattern("/api/watch-releases"));
    await mockJson(page, "/api/watch-releases", { body: [] });
    await page
      .getByRole("button", { name: /retry watchlist/i })
      .first()
      .click();
    await expect(page.getByText(/no watchlist releases yet\./i)).toBeVisible();

    await page.unroute(routePattern("/api/watch-releases"));
    await mockRateLimited(page, "/api/watch-releases", "watchlist cooldown active", 18);
    await page
      .getByRole("button", { name: /retry watchlist/i })
      .first()
      .click();
    await expect(page.getByText(/cooling down due to rate limiting/i)).toBeVisible();
    await expect(page.getByText(/18s/i)).toBeVisible();
  });

  test("/notifications supports loading, error, empty, and rate-limited states", async ({
    page,
  }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/notifications", {
      body: [notificationFixture],
      delayMs: 800,
    });

    await page.goto("/notifications");
    await expect(page.getByText("Loading notifications…")).toBeVisible();
    await expect(page.getByText(/watch_match_found/i)).toBeVisible({ timeout: 10_000 });

    await page.unroute(routePattern("/api/notifications"));
    await mockJson(page, "/api/notifications", {
      status: 500,
      body: { error: { message: "notifications backend down" } },
    });
    await page.getByRole("button", { name: /retry notifications feed/i }).click();
    await expect(page.getByText(/notifications failed to load/i)).toBeVisible();

    await page.unroute(routePattern("/api/notifications"));
    await mockJson(page, "/api/notifications", { body: [] });
    await page.getByRole("button", { name: /retry notifications feed/i }).click();
    await expect(page.getByText(/no notifications yet\./i)).toBeVisible();

    await page.unroute(routePattern("/api/notifications"));
    await mockRateLimited(page, "/api/notifications", "notifications cooldown active", 15);
    await page.getByRole("button", { name: /retry notifications feed/i }).click();
    await expect(page.getByText(/temporarily rate limited/i)).toBeVisible();
    await expect(page.getByText(/15s/i)).toBeVisible();
  });

  test("/integrations supports loading, error, empty, and rate-limited states", async ({
    page,
  }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/integrations/discogs/status", {
      body: {
        connected: true,
        provider: "discogs",
        connected_at: "2026-02-01T12:00:00.000Z",
        external_user_id: "waxwatch_discogs_007",
        has_access_token: true,
      },
      delayMs: 800,
    });

    await page.goto("/integrations");
    await expect(page.getByText("Loading Discogs status…")).toBeVisible();
    await expect(page.getByText(/connected: yes/i)).toBeVisible();

    await page.unroute(routePattern("/api/integrations/discogs/status"));
    await mockJson(page, "/api/integrations/discogs/status", {
      status: 500,
      body: { error: { message: "discogs service unavailable" } },
    });
    await page.getByRole("button", { name: /retry discogs status/i }).click();
    await expect(page.getByText(/could not load discogs integration status\./i)).toBeVisible();

    await page.unroute(routePattern("/api/integrations/discogs/status"));
    await mockJson(page, "/api/integrations/discogs/status", { body: null });
    await page.getByRole("button", { name: /retry discogs status/i }).click();
    await expect(page.getByText(/no integration status found\./i)).toBeVisible();

    await page.unroute(routePattern("/api/integrations/discogs/status"));
    await mockRateLimited(page, "/api/integrations/discogs/status", "discogs cooldown active", 25);
    await page.getByRole("button", { name: /refresh discogs status/i }).click();
    await expect(page.getByText(/cooling down due to rate limiting/i)).toBeVisible();
    await expect(page.getByText(/25s/i)).toBeVisible();
  });

  test("/settings/* routes are reachable and legacy integrations path redirects", async ({
    page,
  }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/watch-rules", { body: [watchRuleFixture] });

    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { name: /profile settings/i })).toBeVisible();

    await page.goto("/settings/alerts");
    await expect(page.getByRole("heading", { name: /alert delivery settings/i })).toBeVisible();

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { name: /danger settings/i })).toBeVisible();

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
    await expect(page.getByRole("heading", { name: /integrations/i })).toBeVisible();
  });

  test("/settings/danger requires destructive confirmation before hard-delete", async ({
    page,
  }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/me/hard-delete", { body: {} });

    let hardDeleteCalls = 0;
    await page.route(routePattern("/api/me/hard-delete"), async (route: Route) => {
      hardDeleteCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto("/settings/danger");

    await page
      .getByRole("button", { name: /^permanently delete account$/i })
      .first()
      .click();
    const dialog = page.getByRole("dialog", { name: /delete account permanently\?/i });
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: /cancel/i }).click();
    await expect(dialog).toBeHidden();
    expect(hardDeleteCalls).toBe(0);

    await page
      .getByRole("button", { name: /^permanently delete account$/i })
      .first()
      .click();
    await dialog.getByRole("button", { name: /^permanently delete account$/i }).click();
    await expect(page).toHaveURL(/\/account-removed$/);
    expect(hardDeleteCalls).toBe(1);
  });

  test("auth-expiry redirects to signed-out when protected route API returns 401", async ({
    page,
  }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/watch-rules", {
      status: 401,
      body: { error: { message: "session expired" } },
    });

    await page.goto("/alerts");
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required$/);
    await expect(page.getByRole("heading", { name: /signed out/i })).toBeVisible();
  });

  test("SSE notification event invalidates unread-count and notifications queries", async ({
    page,
  }) => {
    let unreadCountCalls = 0;
    let notificationsCalls = 0;

    await mockJson(page, "/api/me", {
      body: meProfileFixture,
    });

    await page.route(routePattern("/api/notifications/unread-count"), async (route) => {
      unreadCountCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unread_count: unreadCountCalls }),
      });
    });

    await page.route(routePattern("/api/notifications"), async (route) => {
      notificationsCalls += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    let streamCalls = 0;
    let sseAcceptHeader = "";
    let sseAuthorizationHeader: string | null = null;

    await page.route(routePattern("/api/stream/events"), async (route) => {
      streamCalls += 1;
      sseAcceptHeader = route.request().headers()["accept"] ?? "";
      sseAuthorizationHeader = route.request().headers()["authorization"] ?? null;

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body:
          streamCalls === 1 ? 'event: notification\ndata: {"id":"evt-1"}\n\n' : ": keepalive\n\n",
      });
    });

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();

    await expect.poll(() => streamCalls, { timeout: 10_000 }).toBeGreaterThan(0);
    await expect.poll(() => unreadCountCalls, { timeout: 10_000 }).toBeGreaterThan(1);
    await expect.poll(() => notificationsCalls, { timeout: 10_000 }).toBeGreaterThan(1);
    expect(sseAcceptHeader).toContain("text/event-stream");
    expect(sseAuthorizationHeader).toBeNull();
  });
});
