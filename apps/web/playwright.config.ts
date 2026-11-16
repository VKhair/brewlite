import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  reporter: 'list',
  use: {
    ...devices['Pixel 7'],
    baseURL: process.env.BREWLITE_E2E_URL ?? 'http://127.0.0.1:3002',
    channel: process.env.BREWLITE_E2E_CHANNEL,
    trace: 'retain-on-failure',
  },
});
