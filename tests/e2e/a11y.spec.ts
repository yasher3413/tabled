import { test } from "@playwright/test"
import { expectAccessible, setTheme } from "./helpers"

const ROUTES = ["/", "/bills", "/bills/45-1/C-39", "/bills/45-1/C-4", "/votes", "/votes/45-1/177", "/mps", "/mps/ziad-aboultaif", "/find", "/find?postal=K1A0A6", "/parties", "/about", "/this-page-does-not-exist", "/fr", "/fr/bills", "/fr/bills/45-1/C-39", "/fr/votes/45-1/177", "/fr/mps/ziad-aboultaif", "/fr/find?postal=K1A0A6", "/fr/about", "/this-week", "/fr/this-week/2026-W41", "/compare?a=ziad-aboultaif&b=yasir-naqvi"]

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
