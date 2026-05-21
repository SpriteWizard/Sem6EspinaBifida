const { test, expect } = require('@playwright/test');

test('Qase - Playwright Integration', async ({ page }) => {
  await page.goto('https://qase.io/');
  const title = await page.title();
  expect(title).toBe('Qase | Test management software for quality assurance');
});
