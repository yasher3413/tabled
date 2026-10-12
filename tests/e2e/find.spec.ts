import { expect, test } from "@playwright/test"

// The test server runs with REPRESENT_FIXTURES=1, so lookups read recorded Represent responses.
test.describe("find your MP", () => {
  test("a valid postal code shows the riding and links to the MP", async ({ page }) => {
    await page.goto("/find")
    await page.getByLabel("Your postal code").fill("k1a 0a6")
    await page.getByRole("button", { name: "Find" }).click()
    await expect(page.getByRole("heading", { name: "Your MP for K1A 0A6" })).toBeVisible()
    await expect(page.getByText("Ottawa Centre")).toBeVisible()
    await page.getByRole("link", { name: "Yasir Naqvi" }).click()
    await expect(page).toHaveURL(/\/mps\/yasir-naqvi/)
  })

  test("the home page form hands the postal code to /find", async ({ page }) => {
    await page.goto("/")
    await page.getByLabel("Postal code", { exact: true }).fill("K0A1L0")
    await page.getByRole("button", { name: "Find your MP" }).click()
    await expect(page).toHaveURL(/\/find\?postal=K0A1L0/)
    await expect(page.getByText("Carleton")).toBeVisible()
  })

  test("invalid and unknown codes explain what to do", async ({ page }) => {
    await page.goto("/find")
    await page.getByLabel("Your postal code").fill("D1A0A6")
    await page.getByRole("button", { name: "Find" }).click()
    await expect(page.getByText(/doesn't look like a Canadian postal code/)).toBeVisible()
    await page.getByLabel("Your postal code").fill("H0H0H0")
    await page.getByRole("button", { name: "Find" }).click()
    await expect(page.getByRole("alert").filter({ hasText: "H0H 0H0" })).toContainText("couldn't find H0H 0H0")
  })
})
