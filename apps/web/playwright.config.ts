import { defineConfig } from '@playwright/test';

const apiPort = process.env.API_PORT || '3003';
const webPort = process.env.WEB_PORT || '3002';
const baseURL = `http://127.0.0.1:${webPort}`;

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node ../api/dist/main.js',
      url: `http://127.0.0.1:${apiPort}/health`,
      env: { API_PORT: apiPort, PAYMENT_MODE: 'mock' },
    },
    {
      command: 'npm run start',
      url: baseURL + '/menu',
      env: { WEB_PORT: webPort },
    },
  ],
});
