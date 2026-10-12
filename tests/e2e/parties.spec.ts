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

test("about page explains methodology and credits sources", async ({ page }) => {
  await page.goto("/about")
  await expect(page.getByRole("heading", { name: "How numbers are calculated" })).toBeVisible()
  await expect(page.getByRole("link", { name: "openparliament.ca" }).first()).toHaveAttribute("href", "https://openparliament.ca")
  await expect(page.getByText(/AI-generated/).first()).toBeVisible()
})
