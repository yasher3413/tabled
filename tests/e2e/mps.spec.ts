import { expect, test } from "@playwright/test"

test.describe("MPs", () => {
  test("directory lists current MPs and filters by party and province", async ({ page }) => {
    await page.goto("/mps")
    const rows = page.locator("tbody tr")
    await expect(rows).toHaveCount(60)
    await expect(page.getByText("337 MPs")).toBeVisible()
    await page.getByLabel("Party", { exact: true }).selectOption("green")
    await expect(rows).toHaveCount(1)
    await expect(page).toHaveURL(/party=green/)
    await page.getByLabel("Party", { exact: true }).selectOption("")
    await page.getByLabel("Province or territory").selectOption("PE")
    await expect(page).toHaveURL(/province=PE/)
    for (const t of await rows.allInnerTexts()) expect(t).toContain("PE")
  })

  test("search finds an MP by riding", async ({ page }) => {
    await page.goto("/mps?q=edmonton+manning")
    await expect(page.locator("tbody tr")).toHaveCount(1)
    await expect(page.locator("tbody tr")).toContainText("Ziad Aboultaif")
  })

  test("MP detail shows metrics, sponsored bills and voting record", async ({ page }) => {
    await page.goto("/mps/ziad-aboultaif")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ziad Aboultaif")
    await expect(page.getByText("Voted with party").first()).toBeVisible()
    await expect(page.getByText("Edmonton Manning, Alberta")).toBeVisible()
    await expect(page.getByRole("heading", { name: "Bills sponsored" })).toBeVisible()
    await page.getByLabel(/Only votes against their party/).check()
    const items = page.locator("ol li")
    expect(await items.count()).toBeGreaterThan(0)
    for (const t of await items.allInnerTexts()) expect(t).toContain("Against party")
  })
})
