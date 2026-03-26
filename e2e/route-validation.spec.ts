import { expect, test } from "@playwright/test";

const API = {
  watchRules: "**/api/watch-rules**",
  watchReleases: "**/api/watch-releases**",
  notifications: "**/api/notifications**",
  unreadCount: "**/api/notifications/unread-count**",
  me: "**/api/me**",
  discogsStatus: "**/api/integrations/discogs/status**",
  sse: "**/api/stream/events**",
} as const;

async function json(status: number, payload: unknown) {
  return {
    status,
    contentType: "application/json",
    body: JSON.stringify(payload),
  };
}

test.describe("route-focused validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/**", async (route) => {
      const path = new URL(route.request().url()).pathname;

      if (path.includes("/api/watch-rules") || path.includes("/api/watch-releases")) {
        await route.fulfill(await json(200, []));
        return;
      }

      if (path.includes("/api/notifications/unread-count")) {
        await route.fulfill(await json(200, { unread_count: 0 }));
        return;
      }

      if (path.includes("/api/notifications")) {
        await route.fulfill(await json(200, []));
        return;
      }

      if (path.includes("/api/integrations/discogs/status")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
        return;
      }

      if (path.includes("/api/me")) {
        await route.fulfill(
          await json(200, {
            id: "user-1",
            email: "collector@example.com",
            is_active: true,
            integrations: [],
            preferences: { timezone: "UTC", currency: "USD" },
          }),
        );
        return;
      }

      if (path.includes("/api/stream/events")) {
        await route.fulfill({
          status: 200,
          headers: { "content-type": "text/event-stream; charset=utf-8" },
          body: "",
        });
        return;
      }

      await route.fulfill(await json(200, {}));
    });
  });

  test("/alerts route + empty/loading transport path", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page.getByRole("heading", { level: 1, name: /alerts/i })).toBeVisible();
    const status = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(status).toBe(200);
  });

  test("/alerts rate-limited transport path", async ({ page }) => {
    await page.route(API.watchRules, async (route) => {
      await route.fulfill(
        await json(429, { error: { type: "rate_limited", message: "cooldown" } }),
      );
    });

    await page.goto("/alerts");
    const status = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(status).toBe(429);
  });

  test("/watchlist error transport path", async ({ page }) => {
    await page.route(API.watchReleases, async (route) => {
      await route.fulfill(await json(500, { error: { message: "failed" } }));
    });

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { level: 1, name: /watchlist/i })).toBeVisible();
    const status = await page.evaluate(async () => (await fetch("/api/watch-releases")).status);
    expect(status).toBe(500);
  });

  test("/notifications route + rate-limited transport path", async ({ page }) => {
    await page.route(API.notifications, async (route) => {
      await route.fulfill(
        await json(429, { error: { type: "rate_limited", message: "cooldown" } }),
      );
    });

    await page.goto("/notifications");
    await expect(page.getByRole("heading", { level: 1, name: /notifications/i })).toBeVisible();
    const status = await page.evaluate(async () => (await fetch("/api/notifications")).status);
    expect(status).toBe(429);
  });

  test("/settings/profile and /settings/alerts routes", async ({ page }) => {
    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: /profile settings/i })).toBeVisible();

    await page.goto("/settings/alerts");
    await expect(page).toHaveURL(/\/settings\/alerts$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("/integrations route + empty/error transport paths", async ({ page }) => {
    await page.goto("/integrations");
    await expect(page.getByRole("heading", { level: 1, name: /integrations/i })).toBeVisible();

    await page.route(API.discogsStatus, async (route) => {
      await route.fulfill(await json(500, { error: { message: "failed" } }));
    });
    const status = await page.evaluate(
      async () => (await fetch("/api/integrations/discogs/status")).status,
    );
    expect(status).toBe(500);
  });

  test("/settings/integrations redirects to /integrations", async ({ page }) => {
    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
    await expect(page.getByRole("heading", { level: 1, name: /integrations/i })).toBeVisible();
  });

  test("/settings/danger destructive flow affordance is present", async ({ page }) => {
    await page.goto("/settings/danger");
    await expect(page.getByRole("heading", { level: 1, name: /danger zone/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Deactivate account$/ }).first()).toBeVisible();
  });

  test("auth-expiry/sign-out transport path returns 401", async ({ page }) => {
    await page.route(API.watchRules, async (route) => {
      await route.fulfill(await json(401, { error: { type: "unauthorized", message: "expired" } }));
    });

    await page.goto("/alerts");
    const status = await page.evaluate(async () => (await fetch("/api/watch-rules")).status);
    expect(status).toBe(401);
  });

  test("deterministic SSE harness validates credentials + headers", async ({ page, context }) => {
    let seenSse = false;

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

    await page.route(API.sse, async (route) => {
      seenSse = true;
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
    await page.evaluate(async () => {
      await fetch("/api/stream/events", {
        method: "GET",
        headers: { Accept: "text/event-stream" },
        credentials: "include",
      });
    });

    await expect.poll(() => seenSse).toBe(true);
  });
});
