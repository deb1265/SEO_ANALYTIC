import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', use: { baseURL: 'http://127.0.0.1:4173', launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--no-sandbox', '--disable-dev-shm-usage'] } : {} },
  webServer: { command: 'PORT=4173 npm run dev', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
});
