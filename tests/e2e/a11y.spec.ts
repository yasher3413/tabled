import { test } from "@playwright/test"
import { expectAccessible, setTheme } from "./helpers"

const ROUTES = ["/", "/bills", "/bills/45-1/C-39", "/bills/45-1/C-4", "/votes", "/votes/45-1/177", "/mps", "/mps/ziad-aboultaif", "/find", "/find?postal=K1A0A6"]

for (const theme of ["light", "dark"] as const) {
  test.describe(`accessibility (${theme})`, () => {
    for (const route of ROUTES) {
      test(`${route} has no serious violations`, async ({ page }) => {
        await setTheme(page, theme)
        await page.goto(route)
        await expectAccessible(page)
      })
    }
  })
}
