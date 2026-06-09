// Playwright config (CommonJS). Uses the official playwright-qase-reporter.
const path = require('path');
const fs = require('fs');

const shouldLoadDotEnv = !process.env.GITHUB_ACTIONS && !process.env.CI;
if (shouldLoadDotEnv) {
  const dotenvPath = path.join(__dirname, '..', '..', '.env.local');
  if (fs.existsSync(dotenvPath)) {
    require('dotenv').config({ path: dotenvPath });
  }
}

const config = {
  testDir: './tests',
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