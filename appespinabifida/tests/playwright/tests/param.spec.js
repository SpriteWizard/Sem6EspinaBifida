const { test, expect } = require('@playwright/test');
const { qase } = require('playwright-qase-reporter');

test.describe('Parameterized Test for example.com', () => {
  const testData = [
    { urlPath: '/', expectedTitle: 'Example Domain' },
  ];

  testData.forEach(({ urlPath, expectedTitle }, idx) => {
    test(`Verify if https://example.com${urlPath} has the correct title (case ${idx + 1})`, async ({ page }) => {
      // Replace the id below with a real case ID from your Qase project
      qase.id(1);
      qase.title('Verify if the Website has a correct title');
      qase.fields({
        severity: 'blocker',
        priority: 'medium',
        layer: 'e2e',
        description: 'Add the test description, with rich text support',
        preconditions: 'Client is connected to the internet',
      });
      qase.parameters({
        'URL Path': urlPath,
        'Expected Title': expectedTitle,
      });

      await test.step(`Go to https://example.com${urlPath}`, async () => {
        await page.goto(`https://example.com${urlPath}`);
      });

      await test.step(`Check if the page's title is ${expectedTitle}`, async () => {
        const title = await page.title();
        expect(title).toBe(expectedTitle);
      });
    });
  });
});
