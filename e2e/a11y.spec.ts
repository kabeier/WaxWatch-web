import { expect, test, type Locator, type Page } from "@playwright/test";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };

async function mockJson(
  page: Page,
  pathname: string,
  payload: JsonValue,
  status = 200,
  method?: "GET" | "POST" | "PATCH" | "DELETE",
) {
  await page.route(`**${pathname}`, async (route) => {
    if (method && route.request().method() !== method) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(payload),
    });
  });
}

async function tabToTarget(page: Page, target: Locator, maxTabs = 80) {
  for (let attempt = 0; attempt < maxTabs; attempt += 1) {
    if (await target.evaluate((element) => element === document.activeElement)) {
      return;
    }

    await page.keyboard.press("Tab");
  }

  throw new Error(`Failed to focus target after ${maxTabs} Tab presses.`);
}
test.describe("accessibility regression audit", () => {
  test("/search: keyboard traversal, visible focus, and async status/error announcements", async ({
    page,
  }) => {
    await mockJson(
      page,
      "/api/search",
      {
        items: [
          {
            id: "listing-1",
            title: "Kind of Blue",
            provider: "discogs",
            price: 19.99,
            currency: "USD",
            condition: "VG+",
            seller: "wax-town",
            location: "US",
            public_url: "https://example.com/listing-1",
          },
        ],
        providers_searched: ["discogs"],
        pagination: {
          returned: 1,
          total: 1,
        },
      },
      200,
      "POST",
    );
    await mockJson(
      page,
      "/api/search/save-alert",
      { error: { message: "Save failed" } },
      500,
      "POST",
    );

    await page.goto("/search");
    await page.locator("main").click({ position: { x: 1, y: 1 } });

    await tabToTarget(page, page.locator("#search-keywords"));
    await expect(page.locator("#search-keywords")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#search-providers")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#search-page")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#search-page-size")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Run search" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("status", { name: /status: loaded 1 search results\./i }),
    ).toBeVisible();

    await page.locator("#save-alert-name").fill("Price watch");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");

    await expect(
      page.getByRole("alert").filter({ hasText: "Could not save alert." }),
    ).toBeVisible();
  });

  test("/settings/profile: keyboard traversal, visible focus, and async error announcement", async ({
    page,
  }) => {
    await mockJson(
      page,
      "/api/me",
      {
        id: "user-1",
        email: "collector@example.com",
        display_name: "Collector",
        preferences: { timezone: "UTC", currency: "USD" },
      },
      200,
      "GET",
    );
    await mockJson(page, "/api/me", { error: { message: "Update failed" } }, 500, "PATCH");

    await page.goto("/settings/profile");
    await page.locator("main").click({ position: { x: 1, y: 1 } });

    await expect(page.locator("#profile-display-name")).toBeVisible();
    await tabToTarget(page, page.locator("#profile-display-name"));
    await expect(page.locator("#profile-display-name")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#profile-timezone")).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(page.locator("#profile-currency")).toBeFocused();

    await page.keyboard.press("Tab");
    const saveButton = page.getByRole("button", { name: "Save profile changes" });
    await expect(saveButton).toBeFocused();
    await saveButton.press("Enter");

    await expect(
      page.getByRole("alert").filter({ hasText: "Could not save profile settings." }),
    ).toBeVisible();
  });

  test("/watchlist/[id]: dialog focus trap + focus return and async error announcement", async ({
    page,
  }) => {
    await mockJson(
      page,
      "/api/watch-releases/release-1",
      {
        id: "release-1",
        user_id: "user-1",
        discogs_release_id: 1,
        discogs_master_id: null,
        match_mode: "exact_release",
        title: "Kind of Blue",
        artist: "Miles Davis",
        year: 1959,
        target_price: 25,
        currency: "USD",
        min_condition: "VG+",
        is_active: true,
        created_at: "2026-03-21T08:00:00.000Z",
        updated_at: "2026-03-22T10:00:00.000Z",
      },
      200,
      "GET",
    );
    await mockJson(
      page,
      "/api/watch-releases/release-1",
      { error: { message: "Disable failed" } },
      500,
      "DELETE",
    );

    await page.goto("/watchlist/release-1");

    const disableTrigger = page.getByRole("button", { name: "Disable watchlist item" });
    await expect(disableTrigger).toBeVisible();
    await disableTrigger.click();

    const dialog = page.getByRole("alertdialog", { name: "Disable watchlist item?" });
    await expect(dialog).toBeVisible();
    const cancelButton = dialog.getByRole("button", { name: "Cancel" });
    const confirmButton = dialog.getByRole("button", { name: "Disable watchlist item" });

    await expect(cancelButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(disableTrigger).toBeFocused();

    await disableTrigger.click();
    await dialog.getByRole("button", { name: "Disable watchlist item" }).click();
    await expect(
      page.getByRole("alert").filter({ hasText: "Could not disable watchlist item." }),
    ).toBeVisible();
  });

  test("/settings/danger: dialog focus trap + return and async status/error announcements", async ({
    page,
  }) => {
    await mockJson(page, "/api/me", { id: "user-1" }, 200, "GET");
    await mockJson(
      page,
      "/api/me/hard-delete",
      { error: { message: "Delete failed" } },
      500,
      "DELETE",
    );

    await page.goto("/settings/danger");

    const deleteTrigger = page.getByRole("button", { name: "Permanently delete account" });
    await deleteTrigger.click();

    const dialog = page.getByRole("alertdialog", { name: "Delete account permanently?" });
    await expect(dialog).toBeVisible();
    const cancelButton = dialog.getByRole("button", { name: "Cancel" });
    const confirmButton = dialog.getByRole("button", { name: "Permanently delete account" });

    await expect(cancelButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(confirmButton).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(deleteTrigger).toBeFocused();

    await deleteTrigger.click();
    await confirmButton.click();

    await expect(dialog.getByRole("alert").filter({ hasText: "Delete failed" })).toBeVisible();
  });
});
