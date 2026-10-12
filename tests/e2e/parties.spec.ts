import { expect, test } from "@playwright/test"

test("parties page lists parties by seats with cohesion", async ({ page }) => {
  await page.goto("/parties")
  const rows = page.locator("tbody tr")
  expect(await rows.count()).toBeGreaterThanOrEqual(4)
  const seats = await rows.locator("td:nth-of-type(1)").allInnerTexts()
  const nums = seats.map(Number)
  expect([...nums].sort((a, b) => b - a)).toEqual(nums)
  await expect(rows.first()).toContainText("%")
})
