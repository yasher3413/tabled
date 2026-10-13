import { expect, test } from "@playwright/test"

test("home explains Tabled and shows this week", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { level: 1 })).toContainText("plain English")
  await expect(page.getByRole("heading", { name: "This week in Parliament" })).toBeVisible()
  await expect(page.getByRole("img", { name: /House of Commons seats/ })).toBeVisible()
})

test("command palette finds bills and MPs", async ({ page }) => {
  await page.goto("/")
  await page.keyboard.press("ControlOrMeta+k")
  const input = page.getByPlaceholder("Search bills, MPs, ridings or votes")
  await expect(input).toBeVisible()
  await input.fill("c-39")
  await expect(page.getByRole("option", { name: /C-39 Building Canada Strong Act/ })).toBeVisible()
  await input.fill("aboultaif")
  await page.getByRole("option", { name: /Ziad Aboultaif/ }).click()
  await expect(page).toHaveURL(/\/mps\/ziad-aboultaif/)
})

test("theme toggle switches to dark and persists", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/")
  const toggle = page.getByRole("button", { name: /^Theme/ })
  await toggle.click() // system -> light
  await toggle.click() // light -> dark
  await expect(page.locator("html")).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator("html")).toHaveClass(/dark/)
})

test("closing the command palette returns focus to the search button", async ({ page }) => {
  await page.goto("/")
  const button = page.locator("header").getByRole("button", { name: /search/i })
  await button.click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(button).toBeFocused()
})
