import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PORT ?? 3100)

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // iOS Safari's engine, for tap behaviour that only WebKit gets wrong.
    { name: "webkit-mobile", use: { ...devices["iPhone 13"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    command: `pnpm start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { REPRESENT_FIXTURES: "1" },
  },
})
