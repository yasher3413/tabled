import { expect, test } from "@playwright/test"

test.describe("votes", () => {
  test("index lists recorded votes and filters by result", async ({ page }) => {
    await page.goto("/votes")
    await expect(page.getByRole("heading", { level: 1, name: "Votes" })).toBeVisible()
    expect(await page.locator("article").count()).toBeGreaterThan(20)
    await page.getByLabel("Result", { exact: true }).selectOption("failed")
    await expect(page).toHaveURL(/result=failed/)
    for (const t of await page.locator("article").allInnerTexts()) expect(t).toContain("Failed")
  })

  test("vote detail shows the hemicycle, dissenters and a sortable ballot table", async ({ page }) => {
    await page.goto("/votes/45-1/177")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("C-218")
    await expect(page.getByRole("img", { name: /Seat chart of \d+ sitting MPs/ })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Broke with their party" })).toBeVisible()
    const rows = page.locator("table").last().locator("tbody tr")
    expect(await rows.count()).toBeGreaterThan(300)
    await page.getByRole("checkbox", { name: "Broke ranks only" }).check()
    const dissent = await rows.count()
    expect(dissent).toBeGreaterThan(0)
    expect(dissent).toBeLessThan(20)
    await page.getByRole("checkbox", { name: "Broke ranks only" }).uncheck()
    await page.getByRole("button", { name: "Vote", exact: true }).click()
    await expect(page.locator("th[aria-sort='ascending']")).toContainText("Vote")
    await page.getByRole("button", { name: "By party" }).click()
    await expect(page.getByRole("button", { name: "By party" })).toHaveAttribute("aria-pressed", "true")
  })

  test("vote totals on the page match the source", async ({ page }) => {
    await page.goto("/votes/45-1/178")
    await expect(page.getByLabel(/^296 yeas, 26 nays, 10 paired/)).toBeVisible()
  })
})
