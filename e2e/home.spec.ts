import { test, expect } from "@playwright/test";

test("root redirects to search", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/search$/);
  await expect(page.getByRole("heading", { name: /^search$/i })).toBeVisible();
});

test("app nav links work", async ({ page }) => {
  await page.goto("/search");

  await page.getByRole("link", { name: /alerts/i }).click();
  await expect(page.getByRole("heading", { name: /^alerts$/i })).toBeVisible();

  await page.getByRole("link", { name: /notifications/i }).click();
  await expect(page.getByRole("heading", { name: /^notifications$/i })).toBeVisible();

  await page.getByRole("link", { name: /search/i }).click();
  await expect(page.getByRole("heading", { name: /^search$/i })).toBeVisible();
});

test("unknown route shows 404", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: /404/i })).toBeVisible();
});
