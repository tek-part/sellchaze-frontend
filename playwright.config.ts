import { defineConfig } from 'playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  // Visual baselines are written on first run for a theme/locale/platform that has none (instead
  // of failing), so a new theme or a fresh runner image seeds its own snapshots; an existing
  // baseline is still compared strictly.
  updateSnapshots: 'missing',
  use: {
    baseURL: 'http://127.0.0.1:4183',
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    // Browser gates must measure the optimized production artifact, not Vite's
    // first-request development transforms.
    command: 'npm run preview -- --host 127.0.0.1 --port 4183',
    port: 4183,
    reuseExistingServer: !process.env.CI,
  },
});
