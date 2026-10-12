import { expect, test } from "@playwright/test"

test.describe("previous session", () => {
  test("bills index switches to the previous session", async ({ page }) => {
    await page.goto("/bills")
    await page.getByRole("link", { name: /44th Parliament, 1st session/ }).click()
    await expect(page).toHaveURL(/\/bills\/44-1$/)
    await expect(page.getByText(/44th Parliament, 1st session/).first()).toBeVisible()
    await expect(page.locator("article").first()).toBeVisible()
    await expect(page.locator("article a").first()).toHaveAttribute("href", /\/bills\/44-1\//)
  })

  test("votes index lists previous-session votes", async ({ page }) => {
    await page.goto("/votes/44-1")
    await expect(page.locator("article a").first()).toHaveAttribute("href", /\/votes\/44-1\//)
  })

  test("a previous-session vote page renders with its seat chart", async ({ page }) => {
    await page.goto("/votes/44-1/1")
    await expect(page.getByRole("img", { name: /Seat chart of \d+ sitting MPs/ })).toBeVisible()
  })

  test("MP directory filters by session", async ({ page }) => {
    await page.goto("/mps")
    await page.getByLabel("Session", { exact: true }).selectOption("44-1")
    await expect(page).toHaveURL(/session=44-1/)
    expect(await page.locator("tbody tr").count()).toBeGreaterThan(50)
  })

  test("an MP who sat in both sessions shows a record for each", async ({ page }) => {
    await page.goto("/mps/ziad-aboultaif")
    await expect(page.getByRole("region", { name: "45th Parliament, 1st session" })).toBeVisible()
    await expect(page.getByRole("region", { name: "44th Parliament, 1st session" })).toBeVisible()
    await page.getByRole("button", { name: "44th Parliament, 1st session" }).click()
    await expect(page.locator("ol li a").first()).toHaveAttribute("href", /\/votes\/44-1\//)
  })
})
