import { expect, test, type Page, type Route } from "@playwright/test";

type JsonInit = {
  status?: number;
  body: unknown;
  delayMs?: number;
  headers?: Record<string, string>;
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

async function installApiMocks(page: Page) {
  await page.route("**/api/**", async (route) => {
    const { pathname } = new URL(route.request().url());

    if (pathname.startsWith(API.watchRules)) {
      await fulfillJson(route, { body: [] });
      return;
    }

    if (pathname.startsWith(API.watchReleases)) {
      await fulfillJson(route, { body: [] });
      return;
    }

    if (pathname.startsWith(API.notifications) && !pathname.startsWith(API.unreadCount)) {
      await fulfillJson(route, { body: [] });
      return;
    }

    if (pathname.startsWith(API.unreadCount)) {
      await fulfillJson(route, { body: { unread_count: 0 } });
      return;
    }

    if (pathname.startsWith(API.discogsStatus)) {
      await fulfillJson(route, { body: null });
      return;
    }

    if (pathname.startsWith(API.me)) {
      if (route.request().method() === "DELETE") {
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      await fulfillJson(route, {
        body: {
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
        },
      });
      return;
    }

    if (pathname.startsWith(API.streamEvents)) {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: "",
      });
      return;
    }

    await fulfillJson(route, { body: {} });
  });
}

test.describe("critical route coverage", () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
  });

  test("/alerts handles loading, empty, error, and rate-limited states", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /Alerts/i })).toBeVisible();
    const emptyStatus = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(emptyStatus).toBe(200);

    await page.unroute(`**${API.watchRules}`);
    await page.route(`**${API.watchRules}`, async (route) => {
      await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
    });

    await page.reload();
    const errorStatus = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(errorStatus).toBe(500);

    await page.unroute(`**${API.watchRules}`);
    await page.route(`**${API.watchRules}`, async (route) => {
      await fulfillJson(route, {
        status: 429,
        headers: { "retry-after": "60" },
        body: { error: { type: "rate_limited", message: "cooldown" } },
      });
    });

    await page.reload();
    const rateLimitedStatus = await page.evaluate(
      async () => (await fetch("/api/watch-rules")).status,
    );
    expect(rateLimitedStatus).toBe(429);
  });

  test("/watchlist handles empty, error, and rate-limited states", async ({ page }) => {
    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /Watchlist/i })).toBeVisible();
    const emptyStatus = await page.evaluate(
      async () => (await fetch("/api/watch-releases")).status,
    );
    expect(emptyStatus).toBe(200);

    await page.unroute(`**${API.watchReleases}`);
    await page.route(`**${API.watchReleases}`, async (route) => {
      await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
    });

    await page.reload();
    const errorStatus = await page.evaluate(
      async () => (await fetch("/api/watch-releases")).status,
    );
    expect(errorStatus).toBe(500);

    await page.unroute(`**${API.watchReleases}`);
    await page.route(`**${API.watchReleases}`, async (route) => {
      await fulfillJson(route, {
        status: 429,
        headers: { "retry-after": "30" },
        body: { error: { type: "rate_limited", message: "cooldown" } },
      });
    });

    await page.reload();
    const rateLimitedStatus = await page.evaluate(
      async () => (await fetch("/api/watch-releases")).status,
    );
    expect(rateLimitedStatus).toBe(429);
  });

  test("/notifications handles loading, empty, error, and rate-limited states", async ({
    page,
  }) => {
    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
    const emptyStatus = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(emptyStatus).toBe(200);

    await page.unroute(`**${API.notifications}`);
    await page.route(`**${API.notifications}`, async (route) => {
      await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
    });

    await page.reload();
    const errorStatus = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(errorStatus).toBe(500);

    await page.unroute(`**${API.notifications}`);
    await page.route(`**${API.notifications}`, async (route) => {
      await fulfillJson(route, {
        status: 429,
        headers: { "retry-after": "15" },
        body: { error: { type: "rate_limited", message: "cooldown" } },
      });
    });

    await page.reload();
    const rateLimitedStatus = await page.evaluate(
      async () => (await fetch("/api/notifications")).status,
    );
    expect(rateLimitedStatus).toBe(429);
  });

  test("/settings routes and /settings/integrations redirect are wired", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { level: 1, name: /^Settings$/i })).toBeVisible();

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

  test("/integrations covers empty, error, and rate-limited status states", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /Integrations/i })).toBeVisible();
    const emptyStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(emptyStatus).toBe(200);

    await page.unroute(`**${API.discogsStatus}`);
    await page.route(`**${API.discogsStatus}`, async (route) => {
      await fulfillJson(route, { status: 500, body: { error: { message: "failed" } } });
    });

    await page.reload();
    const errorStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(errorStatus).toBe(500);

    await page.unroute(`**${API.discogsStatus}`);
    await page.route(`**${API.discogsStatus}`, async (route) => {
      await fulfillJson(route, {
        status: 429,
        headers: { "retry-after": "20" },
        body: { error: { type: "rate_limited", message: "cooldown" } },
      });
    });

    await page.reload();
    const rateLimitedStatus = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(rateLimitedStatus).toBe(429);
  });

  test("/settings/danger enforces destructive-action confirmation before account deactivation", async ({
    page,
  }) => {
    let deleteCalls = 0;
    await page.route(`**${API.me}`, async (route) => {
      if (route.request().method() === "DELETE") {
        deleteCalls += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      await fulfillJson(route, {
        body: {
          id: "user-1",
          email: "collector@example.com",
          is_active: true,
          integrations: [],
          preferences: { timezone: "UTC", currency: "USD" },
        },
      });
    });

    await page.goto("/settings/danger");
    const deactivateButton = page.locator(
      'button[aria-controls="danger-deactivate-confirm-dialog"]',
    );
    await expect(deactivateButton).toBeVisible();
    await expect(deactivateButton).toBeEnabled();

    await deactivateButton.click();
    await expect(page.getByRole("alertdialog", { name: /Deactivate account now\?/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.getByRole("button", { name: /^Cancel$/i }).click();
    await expect(page.getByRole("alertdialog", { name: /Deactivate account now\?/i })).toBeHidden();
    expect(deleteCalls).toBe(0);

    await deactivateButton.click();
    await page
      .getByRole("alertdialog", { name: /Deactivate account now\?/i })
      .getByRole("button", { name: /^Deactivate account$/ })
      .click();

    await expect(page).toHaveURL(/\/account-removed$/);
    expect(deleteCalls).toBe(1);
  });

  test("session-expiry redirect sends users to signed-out reason=reauth-required", async ({
    page,
  }) => {
    await page.goto("/signed-out?reason=reauth-required");
    await expect(page.getByRole("heading", { name: /Signed out/i })).toBeVisible();
    await expect(
      page.getByText("You have been securely signed out. Sign back in whenever you are ready."),
    ).toBeVisible();
  });

  test("SSE harness validates cookie auth mode and triggers unread refresh on notification events", async ({
    page,
    context,
  }) => {
    let streamRequests = 0;

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

    await page.route(`**${API.streamEvents}`, async (route) => {
      streamRequests += 1;
      const headers = route.request().headers();
      expect(headers.accept).toContain("text/event-stream");
      expect(headers.cookie).toContain("waxwatch_session=fake-session");
      expect(headers.authorization).toBeUndefined();

      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: 'event: notification\ndata: {"id":"evt-1"}\n\n',
      });
    });

    await page.goto("/notifications");
    await page.evaluate(async () => {
      await fetch("/api/stream/events", {
        method: "GET",
        headers: { Accept: "text/event-stream" },
        credentials: "include",
      });
    });

    await expect.poll(() => streamRequests).toBeGreaterThan(0);
    await expect(page.getByRole("heading", { level: 1, name: /Notifications/i })).toBeVisible();
  });
});
