// Click-through QA harness: visits every route at phone and desktop sizes, taps what a person would tap and
// writes qa-report/report.md. Separate from the e2e suite (tests/e2e) so `pnpm test:e2e` never runs it.
//   pkill -f "next start"; pnpm build; pnpm qa
//   pnpm qa --project=mobile-webkit                      (one project)
//   BASE_URL=https://tabled-ca.vercel.app pnpm qa        (read-only pass against a deployment)
import { defineConfig, devices } from "@playwright/test"

const PORT = 3300
const external = process.env.BASE_URL

export default defineConfig({
  testDir: "tests/qa",
  testMatch: /\.spec\.ts$/,
  outputDir: "qa-report/test-results",
  fullyParallel: true,
  workers: Number(process.env.QA_WORKERS ?? 5),
  timeout: 240_000,
  retries: 0,
  reporter: [["list"], ["./tests/qa/reporter.ts"]],
  use: {
    baseURL: external ?? `http://localhost:${PORT}`,
    reducedMotion: "reduce",
    trace: "off",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile-chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 } },
    { name: "mobile-webkit", use: { ...devices["iPhone 13"] } },
  ],
  webServer: external
    ? undefined
    : {
        command: `pnpm start -p ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: false,
        timeout: 120_000,
        env: { REPRESENT_FIXTURES: "1", REPORT_FIXTURES: "1" },
      },
})
