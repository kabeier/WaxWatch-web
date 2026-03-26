import { expect, test, type Page, type Route } from "@playwright/test";

type JsonRouteOptions = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
  delayMs?: number;
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
  await mockJson(page, "/api/me", {
    body: {
      id: "me-1",
      email: "tester@example.com",
      display_name: "Wax Tester",
      timezone: "UTC",
      currency: "USD",
      notifications_email: true,
      notifications_push: false,
    },
  });
  await mockJson(page, "/api/notifications/unread-count", { body: { unread_count: 2 } });
  await page.route(routePattern("/api/stream/events"), async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: ": keepalive\n\n",
    });
  });
}

function watchRuleFixture() {
  return [
    {
      id: "rule-1",
      name: "Ambient LPs",
      poll_interval_seconds: 300,
      query: { keywords: ["ambient", "vinyl"] },
      is_active: true,
    },
  ];
}

test.describe("route-focused state validation", () => {
  test("/alerts supports loading, error, empty, and rate-limited states", async ({ page }) => {
    await mockAppChromeRequests(page);
    await mockJson(page, "/api/watch-rules", { body: watchRuleFixture(), delayMs: 800 });

    await page.goto("/alerts");
    await expect(page.getByText("Loading watch rules…")).toBeVisible();
    await expect(page.getByText(/status: loaded 1 rules\./i)).toBeVisible({ timeout: 10_000 });

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
      body: [
        {
          id: "release-1",
          title: "Selected Ambient Works",
          artist: "Aphex Twin",
          year: 1994,
          target_price: 35,
          currency: "USD",
          match_mode: "keyword",
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      delayMs: 800,
    });

    await page.goto("/watchlist");
    await expect(page.getByText("Loading watchlist…")).toBeVisible();
    await expect(page.getByText(/status: loaded 1 watchlist releases\./i)).toBeVisible({
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
      body: [
        {
          id: "notif-1",
          event_type: "watch_match_found",
          channel: "email",
          status: "sent",
          is_read: false,
          created_at: "2026-03-01T00:00:00.000Z",
          updated_at: "2026-03-01T00:00:00.000Z",
          read_at: null,
        },
      ],
      delayMs: 800,
    });

    await page.goto("/notifications");
    await expect(page.getByText("Loading notifications…")).toBeVisible();
    await expect(page.getByText(/watch_match_found/i)).toBeVisible();

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
        connected_at: "2026-02-01T12:00:00.000Z",
        external_user_id: "waxwatch_discogs_007",
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
    await mockJson(page, "/api/watch-rules", { body: watchRuleFixture() });

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
      body: {
        id: "me-1",
        email: "tester@example.com",
        display_name: "Wax Tester",
        timezone: "UTC",
        currency: "USD",
      },
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

    const sseRequestPromise = page.waitForRequest((request) =>
      request.url().includes("/api/stream/events"),
    );

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
    await sseRequestPromise;

    await expect.poll(() => streamCalls, { timeout: 10_000 }).toBeGreaterThan(0);
    await expect.poll(() => unreadCountCalls, { timeout: 10_000 }).toBeGreaterThan(1);
    await expect.poll(() => notificationsCalls, { timeout: 10_000 }).toBeGreaterThan(1);
    expect(sseAcceptHeader).toContain("text/event-stream");
    expect(sseAuthorizationHeader).toBeNull();
  });
});
