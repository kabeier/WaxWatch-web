import { expect, test, type Page, type Route } from "@playwright/test";

const API = {
  watchRules: /\/api\/watch-rules(?:\/)?(?:\?.*)?$/,
  watchReleases: /\/api\/watch-releases(?:\/)?(?:\?.*)?$/,
  notifications: /\/api\/notifications(?:\/)?(?:\?.*)?$/,
  unreadCount: /\/api\/notifications\/unread-count(?:\/)?(?:\?.*)?$/,
  me: /\/api\/me(?:\/)?(?:\?.*)?$/,
  meHardDelete: /\/api\/me\/hard-delete(?:\/)?(?:\?.*)?$/,
  discogsStatus: /\/api\/integrations\/discogs\/status(?:\/)?(?:\?.*)?$/,
  sse: /\/api\/stream\/events(?:\/)?(?:\?.*)?$/,
};

const meProfile = {
  id: "user-1",
  email: "collector@example.com",
  is_active: true,
  created_at: "2026-01-01T00:00:00+00:00",
  updated_at: "2026-01-01T00:00:00+00:00",
  display_name: "Collector",
  preferences: {
    timezone: "UTC",
    currency: "USD",
    notifications_email: true,
    notifications_push: false,
    quiet_hours_start: 23,
    quiet_hours_end: 7,
    notification_timezone: "UTC",
    delivery_frequency: "daily",
  },
  integrations: [{ provider: "discogs", linked: true, watch_rule_count: 1 }],
};

async function fulfillJson(route: Route, status: number, payload: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  });
}

async function installApiFallback(page: Page) {
  await page.route("**/api/**", async (route) => {
    const requestUrl = new URL(route.request().url());
    const pathname = requestUrl.pathname.replace(/\/$/, "");
    const method = route.request().method();

    if (pathname === "/api/stream/events") {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body: "",
      });
      return;
    }

    if (pathname === "/api/watch-rules") {
      await fulfillJson(route, 200, []);
      return;
    }

    if (pathname === "/api/watch-releases") {
      await fulfillJson(route, 200, []);
      return;
    }

    if (pathname === "/api/notifications/unread-count") {
      await fulfillJson(route, 200, { unread_count: 0 });
      return;
    }

    if (pathname === "/api/notifications") {
      await fulfillJson(route, 200, []);
      return;
    }

    if (pathname === "/api/me/hard-delete") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (pathname === "/api/me" && method === "DELETE") {
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (pathname === "/api/me") {
      await fulfillJson(route, 200, meProfile);
      return;
    }

    if (pathname === "/api/integrations/discogs/status") {
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
      return;
    }

    await fulfillJson(route, 200, {});
  });
}

test.describe("route-focused validation", () => {
  test.beforeEach(async ({ page }) => {
    await installApiFallback(page);
  });

  test("/alerts covers loading and empty states", async ({ page }) => {
    await page.route(API.watchRules, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await fulfillJson(route, 200, []);
    });

    await page.goto("/alerts");
    await expect(page.getByText("Loading watch rules…")).toBeVisible();
    await expect(page.getByText(/No watch rules yet/i)).toBeVisible();
  });

  test("/alerts covers error and rate-limited states", async ({ page }) => {
    await page.route(API.watchRules, async (route) => {
      await fulfillJson(route, 429, { error: { type: "rate_limited", message: "Calm down." } });
    });

    await page.goto("/alerts");
    await expect(page.getByText(/watch-rule requests are temporarily rate limited/i)).toBeVisible();

    await page.unroute(API.watchRules);
    await page.route(API.watchRules, async (route) => {
      await fulfillJson(route, 500, { error: { message: "Exploded" } });
    });

    await page.getByRole("button", { name: "Retry watch rules" }).click();
    await expect(page.getByText(/Could not load watch rules/i)).toBeVisible();
  });

  test("/watchlist covers error and empty states", async ({ page }) => {
    await page.route(API.watchReleases, async (route) => {
      await fulfillJson(route, 500, { error: { message: "Nope" } });
    });

    await page.goto("/watchlist");
    await expect(page.getByText(/could not load watchlist/i)).toBeVisible();

    await page.unroute(API.watchReleases);
    await page.route(API.watchReleases, async (route) => {
      await fulfillJson(route, 200, []);
    });

    await page.getByRole("button", { name: "Refresh watchlist" }).click();
    await expect(page.getByText(/No watchlist releases yet/i)).toBeVisible();
  });

  test("/notifications covers rate-limited and empty states", async ({ page }) => {
    await page.route(API.notifications, async (route) => {
      await fulfillJson(route, 429, { error: { type: "rate_limited", message: "Cooling down" } });
    });
    await page.route(API.unreadCount, async (route) => {
      await fulfillJson(route, 200, { unread_count: 0 });
    });

    await page.goto("/notifications");
    await expect(page.getByText(/Notifications are temporarily rate limited/i)).toBeVisible();

    await page.unroute(API.notifications);
    await page.route(API.notifications, async (route) => {
      await fulfillJson(route, 200, []);
    });

    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText(/No notifications yet/i)).toBeVisible();
  });

  test("/settings/profile and /settings/alerts load and rate-limit states", async ({ page }) => {
    await page.route(API.me, async (route) => {
      await fulfillJson(route, 429, {
        error: { type: "rate_limited", message: "Profile cooldown" },
      });
    });

    await page.goto("/settings/profile");
    await expect(page.getByText(/Profile requests are temporarily rate limited/i)).toBeVisible();

    await page.goto("/settings/alerts");
    await expect(page.getByText(/Settings are temporarily rate limited/i)).toBeVisible();
  });

  test("/integrations covers empty and error states", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.getByText(/No integration status found/i)).toBeVisible();

    await page.route(API.discogsStatus, async (route) => {
      await fulfillJson(route, 500, { error: { message: "Discogs down" } });
    });

    await page.getByRole("button", { name: "Refresh Discogs status" }).click();
    await expect(page.getByText(/Could not load Discogs integration status/i)).toBeVisible();
  });

  test("/settings/integrations redirects to /integrations", async ({ page }) => {
    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
    await expect(page.getByRole("heading", { name: /^integrations$/i })).toBeVisible();
  });

  test("/settings/danger destructive flow requires confirmation", async ({ page }) => {
    await page.goto("/settings/danger");
    await page.getByRole("button", { name: "Deactivate account" }).click();
    await expect(page.getByText(/Deactivate account now\?/i)).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText(/Deactivate account now\?/i)).toBeHidden();

    await page.getByRole("button", { name: "Deactivate account" }).click();
    await page
      .getByRole("button", { name: /^Deactivate account$/ })
      .nth(1)
      .click();
    await expect(page.getByText(/Success: Account deactivated/i)).toBeVisible();
  });

  test("auth-expiry redirects to /signed-out", async ({ page }) => {
    await page.route(API.watchRules, async (route) => {
      await fulfillJson(route, 401, { error: { type: "unauthorized", message: "expired" } });
    });

    await page.goto("/alerts");
    await page.waitForURL(/\/signed-out\?reason=reauth-required/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/signed-out\?reason=reauth-required/);
    await expect(page.getByRole("heading", { name: /^signed out$/i })).toBeVisible();
  });

  test("SSE simulation invalidates notification queries and sends cookie credentials", async ({
    page,
    context,
  }) => {
    let notificationListRequests = 0;
    let unreadCountRequests = 0;
    let sseRequestSeen = false;

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

    await page.route(API.notifications, async (route) => {
      notificationListRequests += 1;
      await fulfillJson(route, 200, [
        {
          id: "notification-1",
          user_id: "user-1",
          event_id: "event-1",
          event_type: "watch_match_found",
          channel: "realtime",
          status: "sent",
          is_read: false,
          delivered_at: "2026-01-20T12:00:04+00:00",
          failed_at: null,
          read_at: null,
          created_at: "2026-01-20T12:00:03+00:00",
        },
      ]);
    });

    await page.route(API.unreadCount, async (route) => {
      unreadCountRequests += 1;
      await fulfillJson(route, 200, { unread_count: 1 });
    });

    await page.route(API.sse, async (route) => {
      sseRequestSeen = true;
      const headers = route.request().headers();
      expect(headers.accept).toContain("text/event-stream");
      expect(headers.cookie).toContain("waxwatch_session=fake-session");

      await route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream; charset=utf-8" },
        body: 'event: notification\ndata: {"id":"event-2"}\n\n',
      });
    });

    await page.goto("/notifications");

    await expect.poll(() => sseRequestSeen, { timeout: 15_000 }).toBe(true);
    await expect.poll(() => notificationListRequests).toBeGreaterThan(1);
    await expect.poll(() => unreadCountRequests).toBeGreaterThan(1);
  });
});
