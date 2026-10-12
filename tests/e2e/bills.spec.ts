import { expect, test } from "@playwright/test"

test.describe("bills", () => {
  test("index lists real bills and search narrows them", async ({ page }) => {
    await page.goto("/bills")
    await expect(page.getByRole("heading", { level: 1, name: "Bills" })).toBeVisible()
    const rows = page.locator("article")
    await expect(rows).toHaveCount(25)
    await page.getByRole("button", { name: /Show more/ }).click()
    await expect(rows).toHaveCount(75)
    await page.getByRole("searchbox", { name: "Search" }).fill("C-39")
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toContainText("Building Canada Strong Act")
    await expect(page).toHaveURL(/q=C-39/)
  })

  test("filters update the URL and survive a reload", async ({ page }) => {
    await page.goto("/bills")
    await page.getByLabel("Stage", { exact: true }).selectOption("law")
    await expect(page).toHaveURL(/stage=law/)
    const lawCount = await page.locator("article").count()
    expect(lawCount).toBeGreaterThan(0)
    await page.getByLabel("Type", { exact: true }).selectOption("government")
    await expect(page).toHaveURL(/type=government/)
    await page.reload()
    await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("law")
    await expect(page.getByLabel("Type", { exact: true })).toHaveValue("government")
    for (const text of await page.locator("article").allInnerTexts()) expect(text).toContain("Became law")
  })

  test("empty results show a recovery action", async ({ page }) => {
    await page.goto("/bills?q=zzzz-no-such-bill")
    await expect(page.getByText("No bills match")).toBeVisible()
    await page.getByRole("button", { name: "Clear all filters" }).click()
    await expect(page.locator("article")).toHaveCount(25)
    await expect(page.getByText(/^\d+ bills$/)).toBeVisible()
  })

  test("bill detail shows the stage timeline, votes and sources", async ({ page }) => {
    await page.goto("/bills/45-1/C-39")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/C-39\s*Building Canada Strong Act/)
    const timeline = page.getByRole("region", { name: "House of Commons" })
    await expect(timeline.getByText("Now here")).toBeVisible()
    await page.getByRole("button", { name: /What is committee in the House of Commons/ }).click()
    await expect(page.getByText(/studies the bill line by line/)).toBeVisible()
    await expect(page.getByRole("link", { name: /2nd reading of Bill C-39/ })).toBeVisible()
    await expect(page.getByRole("link", { name: "LEGISinfo record" })).toHaveAttribute("href", /legisinfo\/en\/bill\/45-1\/C-39/)
  })

  test("a bill that became law shows royal assent", async ({ page }) => {
    await page.goto("/bills/45-1/C-4")
    await expect(page.getByText(/Became law on March 12, 2026/)).toBeVisible()
  })
})
