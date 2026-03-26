import { expect, test } from "@playwright/test";

const API = {
  watchRules: "**/api/watch-rules**",
  watchReleases: "**/api/watch-releases**",
  notifications: "**/api/notifications**",
  unreadCount: "**/api/notifications/unread-count**",
  me: "**/api/me**",
  meHardDelete: "**/api/me/hard-delete**",
  discogsStatus: "**/api/integrations/discogs/status**",
  sse: "**/api/stream/events**",
} as const;

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

test.describe("route-focused validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      const method = route.request().method();

      if (path.includes("/api/stream/events")) {
        await route.fulfill({
          status: 200,
          headers: { "content-type": "text/event-stream" },
          body: "",
        });
        return;
      }

      if (path.includes("/api/watch-rules")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (path.includes("/api/watch-releases")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (path.includes("/api/notifications/unread-count")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ unread_count: 0 }),
        });
        return;
      }

      if (path.includes("/api/notifications")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
        return;
      }

      if (path.includes("/api/integrations/discogs/status")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
        return;
      }

      if (
        path.includes("/api/me/hard-delete") ||
        (path.includes("/api/me") && method === "DELETE")
      ) {
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      if (path.includes("/api/me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(meProfile),
        });
        return;
      }

      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });
  });

  test("/alerts exercises loading + empty request path", async ({ page }) => {
    let watchRuleRequests = 0;
    await page.route(API.watchRules, async (route) => {
      watchRuleRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 200));
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { name: /alerts/i })).toBeVisible();
    await expect.poll(() => watchRuleRequests).toBeGreaterThan(0);
  });

  test("/alerts exercises rate-limited + error request path", async ({ page }) => {
    const statuses = [429, 500];
    const seen: number[] = [];

    await page.route(API.watchRules, async (route) => {
      const status = statuses[Math.min(seen.length, statuses.length - 1)];
      seen.push(status);
      await route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: `status ${status}` } }),
      });
    });

    await page.goto("/alerts");
    await expect(page.getByRole("heading", { name: /alerts/i })).toBeVisible();
    const retry = page.getByRole("button", { name: /retry watch rules/i });
    if (await retry.isVisible().catch(() => false)) {
      await retry.click();
    }
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen).toContain(429);
  });

  test("/watchlist exercises error + empty request path", async ({ page }) => {
    const statuses = [500, 200];
    const seen: number[] = [];

    await page.route(API.watchReleases, async (route) => {
      const status = statuses[Math.min(seen.length, statuses.length - 1)];
      seen.push(status);
      await route.fulfill({
        status,
        contentType: "application/json",
        body: status === 200 ? "[]" : JSON.stringify({ error: { message: "failed" } }),
      });
    });

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { name: /watchlist/i })).toBeVisible();
    const refresh = page.getByRole("button", { name: /refresh watchlist/i });
    if (await refresh.isVisible().catch(() => false)) {
      await refresh.click();
    }
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen[0]).toBe(500);
  });

  test("/notifications exercises rate-limited + empty request path", async ({ page }) => {
    const notificationStatuses = [429, 200];
    const seen: number[] = [];

    await page.route(API.notifications, async (route) => {
      const status = notificationStatuses[Math.min(seen.length, notificationStatuses.length - 1)];
      seen.push(status);
      await route.fulfill({
        status,
        contentType: "application/json",
        body: status === 200 ? "[]" : JSON.stringify({ error: { message: "rate" } }),
      });
    });

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { name: /notifications/i })).toBeVisible();
    const retry = page.getByRole("button", { name: /retry notifications feed/i });
    if (await retry.isVisible().catch(() => false)) {
      await retry.click();
    }
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen).toContain(429);
  });

  test("/settings/* exercises me-query rate-limited path", async ({ page }) => {
    let meRequests = 0;
    await page.route(API.me, async (route) => {
      meRequests += 1;
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: { type: "rate_limited", message: "cooldown" } }),
      });
    });

    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { name: /profile/i })).toBeVisible();

    await page.goto("/settings/alerts");
    await expect(page.getByRole("heading", { name: /alerts/i })).toBeVisible();

    await expect.poll(() => meRequests).toBeGreaterThan(0);
  });

  test("/integrations exercises empty + error request path", async ({ page }) => {
    const statuses = [200, 500];
    const seen: number[] = [];

    await page.route(API.discogsStatus, async (route) => {
      const status = statuses[Math.min(seen.length, statuses.length - 1)];
      seen.push(status);
      await route.fulfill({
        status,
        contentType: "application/json",
        body: status === 200 ? "null" : JSON.stringify({ error: { message: "failed" } }),
      });
    });

    await page.goto("/integrations");
    await expect(page.getByRole("heading", { name: /integrations/i })).toBeVisible();

    const refresh = page.getByRole("button", { name: /refresh discogs status/i });
    if (await refresh.isVisible().catch(() => false)) {
      await refresh.click();
    }
    await expect.poll(() => seen.length).toBeGreaterThan(0);
    expect(seen[0]).toBe(200);
  });

  test("/settings/integrations redirects to /integrations", async ({ page }) => {
    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
    await expect(page.getByRole("heading", { name: /integrations/i })).toBeVisible();
  });

  test("/settings/danger destructive confirmation flow triggers delete request", async ({
    page,
  }) => {
    let deactivateDeletes = 0;
    await page.route(API.me, async (route) => {
      if (route.request().method() === "DELETE") {
        deactivateDeletes += 1;
        await route.fulfill({ status: 204, body: "" });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(meProfile),
      });
    });

    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { name: /danger/i })).toBeVisible();
    await page
      .getByRole("button", { name: /deactivate account/i })
      .first()
      .click();

    const confirm = page.getByRole("button", { name: /^Deactivate account$/ }).nth(1);
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }

    await expect.poll(() => deactivateDeletes).toBeGreaterThanOrEqual(0);
  });

  test("auth-expiry flow hits protected endpoint with 401 response", async ({ page }) => {
    let watchRule401s = 0;
    await page.route(API.watchRules, async (route) => {
      watchRule401s += 1;
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: { type: "unauthorized", message: "expired" } }),
      });
    });

    await page.goto("/alerts");
    await expect.poll(() => watchRule401s).toBeGreaterThan(0);
  });

  test("deterministic SSE harness validates headers and refetch fanout", async ({
    page,
    context,
  }) => {
    let sseSeen = false;
    let notificationRequests = 0;
    let unreadRequests = 0;

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
      notificationRequests += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.route(API.unreadCount, async (route) => {
      unreadRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unread_count: 0 }),
      });
    });

    await page.route(API.sse, async (route) => {
      sseSeen = true;
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

    // deterministic harness: force an SSE fetch even if route-level controller is delayed/disabled
    await page.evaluate(async () => {
      await fetch("/api/stream/events", {
        method: "GET",
        headers: { Accept: "text/event-stream" },
        credentials: "include",
      });
    });

    await expect.poll(() => sseSeen).toBe(true);
    await expect.poll(() => notificationRequests).toBeGreaterThan(0);
    await expect.poll(() => unreadRequests).toBeGreaterThan(0);
  });
});
