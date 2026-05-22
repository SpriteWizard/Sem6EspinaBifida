// Playwright config (CommonJS). Uses the official playwright-qase-reporter.
require('dotenv').config({ path: '../.env.local' });

const config = {
  testDir: './appespinabifida/tests/playwright/tests',
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  reporter: [
    ['list'],
    [
      'playwright-qase-reporter',
      {
        mode: 'testops',
        debug: false,
        testops: {
          api: {
            // the reporter reads the token from env; do NOT hard-code tokens in the repo
            token: process.env.QASE_API_TOKEN,
          },
          // either set your project code as an env var or hard-code a project code
          project: process.env.QASE_PROJECT || 'DEMO',
          uploadAttachments: true,
          run: {
            complete: true,
          },
        },
      },
    ],
  ],
};

module.exports = config;