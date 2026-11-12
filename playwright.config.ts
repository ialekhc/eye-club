import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "on-first-retry", ...devices["Desktop Chrome"] },
  webServer: { command: "cd client && ../node_modules/.bin/next dev --hostname 127.0.0.1 --port 3100", url: "http://127.0.0.1:3100/try-on", reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
