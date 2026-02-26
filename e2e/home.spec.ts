import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /projectsparks/i })).toBeVisible();
});

test("nav links work", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: /about/i }).click();
  await expect(page.getByRole("heading", { name: /about/i })).toBeVisible();

  await page.getByRole("link", { name: /projects/i }).click();
  await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();

  await page.getByRole("link", { name: /home/i }).click();
  await expect(page.getByRole("heading", { name: /projectsparks/i })).toBeVisible();
});

test("unknown route shows 404", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: /404/i })).toBeVisible();
});
