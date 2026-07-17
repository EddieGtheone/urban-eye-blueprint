import { defineConfig, devices } from "@playwright/test";

// End-to-end interaction tests for the Blueprint experience.
// Requires a production build first: `npm run build`, then `npm run test:e2e`.
// The webServer is reused if one is already running on the port.
const PORT = Number(process.env.PORT || 3000);
const baseURL = `http://localhost:${PORT}`;

// Allow pointing at a pre-installed Chromium (e.g. sandboxed CI images) instead
// of downloading one. In standard CI, run `npx playwright install chromium`.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], launchOptions } },
    { name: "mobile", use: { ...devices["Pixel 5"], launchOptions } }
  ],
  webServer: {
    command: "npm run start",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: true
  }
});
