import { expect, test } from '@playwright/test';

test('a11y smoke: main landmark and heading are present', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  const imageMissingAltCount = await page.locator('img:not([alt])').count();
  expect(imageMissingAltCount).toBe(0);
});
