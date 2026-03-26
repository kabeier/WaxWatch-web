import { expect, test } from "@playwright/test";

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

async function mockSseIdle(page: Parameters<typeof test>[0]["page"]) {
  await page.route("**/api/stream/events", async (route) => {
    await route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: "",
    });
  });
}

test.describe("route-focused validation", () => {
  test("/alerts covers loading and empty states", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/watch-rules**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: "[]",
      });
    });

    await page.goto("/alerts");

    await expect(page.getByText("Loading watch rules…")).toBeVisible();
    await expect(
      page.getByText("No watch rules yet. Create one to start matching releases."),
    ).toBeVisible();
  });

  test("/alerts covers error and rate-limited states", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/watch-rules**", async (route) => {
      await route.fulfill({
        status: 429,
        headers: { "retry-after": "60" },
        contentType: "application/json",
        body: JSON.stringify({ error: { type: "rate_limited", message: "Calm down." } }),
      });
    });

    await page.goto("/alerts");
    await expect(page.getByText("Watch-rule requests are temporarily rate limited.")).toBeVisible();

    await page.unroute("**/api/watch-rules**");
    await page.route("**/api/watch-rules**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Exploded" } }),
      });
    });

    await page.getByRole("button", { name: "Retry watch rules" }).click();
    await expect(page.getByText("Could not load watch rules.")).toBeVisible();
  });

  test("/watchlist covers error and empty states", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/watch-releases**", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Nope" } }),
      });
    });

    await page.goto("/watchlist");
    await expect(page.getByText("Could not load watchlist.")).toBeVisible();

    await page.unroute("**/api/watch-releases**");
    await page.route("**/api/watch-releases**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.getByRole("button", { name: "Refresh watchlist" }).click();
    await expect(
      page.getByText("No watchlist releases yet. Add alerts to populate this feed."),
    ).toBeVisible();
  });

  test("/notifications covers rate-limited and empty states", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/notifications/unread-count", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unread_count: 0 }),
      });
    });
    await page.route("**/api/notifications**", async (route) => {
      await route.fulfill({
        status: 429,
        headers: { "retry-after": "30" },
        contentType: "application/json",
        body: JSON.stringify({ error: { type: "rate_limited", message: "Cooling down" } }),
      });
    });

    await page.goto("/notifications");
    await expect(page.getByText("Notifications are temporarily rate limited")).toBeVisible();

    await page.unroute("**/api/notifications**");
    await page.route("**/api/notifications**", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "[]" });
    });

    await page.getByRole("button", { name: "Retry notifications feed" }).click();
    await expect(page.getByText("No notifications yet.")).toBeVisible();
  });

  test("/settings/profile and /settings/alerts load and rate-limit states", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/me", async (route) => {
      await route.fulfill({
        status: 429,
        headers: { "retry-after": "45" },
        contentType: "application/json",
        body: JSON.stringify({ error: { type: "rate_limited", message: "Profile cooldown" } }),
      });
    });

    await page.goto("/settings/profile");
    await expect(page.getByText("Profile requests are temporarily rate limited.")).toBeVisible();

    await page.goto("/settings/alerts");
    await expect(page.getByText("Settings are temporarily rate limited.")).toBeVisible();
  });

  test("/integrations covers empty and error states", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/integrations/discogs/status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/integrations");
    await expect(page.getByText("No integration status found.")).toBeVisible();

    await page.unroute("**/api/integrations/discogs/status");
    await page.route("**/api/integrations/discogs/status", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: { message: "Discogs down" } }),
      });
    });

    await page.getByRole("button", { name: "Refresh Discogs status" }).click();
    await expect(page.getByText("Could not load Discogs integration status.")).toBeVisible();
  });

  test("/settings/integrations redirects to /integrations", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/integrations/discogs/status", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
    });

    await page.goto("/settings/integrations");
    await expect(page).toHaveURL(/\/integrations$/);
    await expect(page.getByRole("heading", { name: /^integrations$/i })).toBeVisible();
  });

  test("/settings/danger destructive flow requires confirmation", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/me/hard-delete", async (route) => {
      await route.fulfill({ status: 204, body: "" });
    });
    await page.route("**/api/me", async (route) => {
      if (route.request().method() === "DELETE") {
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
    await page.getByRole("button", { name: "Deactivate account" }).click();
    await expect(page.getByRole("dialog")).toContainText("Deactivate account now?");
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.getByRole("button", { name: "Deactivate account" }).click();
    await page
      .getByRole("button", { name: /^Deactivate account$/ })
      .nth(1)
      .click();
    await expect(page.getByText("Success: Account deactivated.")).toBeVisible();
  });

  test("auth-expiry redirects to /signed-out", async ({ page }) => {
    await mockSseIdle(page);
    await page.route("**/api/watch-rules**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: { type: "unauthorized", message: "expired" } }),
      });
    });

    await page.goto("/alerts");
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

    await page.route("**/api/notifications/unread-count", async (route) => {
      unreadCountRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ unread_count: 1 }),
      });
    });

    await page.route("**/api/notifications**", async (route) => {
      notificationListRequests += 1;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
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
        ]),
      });
    });

    await page.route("**/api/stream/events", async (route) => {
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

    await expect.poll(() => sseRequestSeen).toBe(true);
    await expect.poll(() => notificationListRequests).toBeGreaterThan(1);
    await expect.poll(() => unreadCountRequests).toBeGreaterThan(1);
  });
});
