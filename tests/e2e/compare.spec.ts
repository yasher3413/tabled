import { expect, test } from "@playwright/test"

test("compare shows agreement between two MPs and where they split", async ({ page }) => {
  await page.goto("/compare?a=ziad-aboultaif&b=yasir-naqvi")
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toContainText(/voted the same way \d+(\.\d)?% of the time/)
  await expect(page.getByText(/Votes where they split \(\d+\)/)).toBeVisible()
  await page.getByLabel("Second MP").selectOption("scott-aitchison")
  await expect(page).toHaveURL(/b=scott-aitchison/)
  await expect(page.locator("main").getByRole("heading", { level: 2 })).toContainText("Scott Aitchison")
})

test("MP pages link to compare", async ({ page }) => {
  await page.goto("/mps/ziad-aboultaif")
  await page.getByRole("link", { name: "Compare with another MP" }).click()
  await expect(page).toHaveURL(/\/compare\?a=ziad-aboultaif/)
})
