import { expect, test } from "@playwright/test"

test.describe("French", () => {
  test("home is in French with the right lang and links", async ({ page }) => {
    await page.goto("/fr")
    await expect(page.locator("html")).toHaveAttribute("lang", "fr-CA")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ce que fait le Parlement, en langage clair.")
    await expect(page.getByRole("link", { name: "Projets de loi" }).first()).toHaveAttribute("href", "/fr/bills")
  })

  test("bill page uses French titles, status and Parliament's French summary", async ({ page }) => {
    await page.goto("/fr/bills/45-1/C-4")
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Loi visant à rendre la vie plus abordable")
    await expect(page.getByText(/^Devenu loi le 12 mars 2026/)).toBeVisible()
    await expect(page.getByText("Résumé officiel du Parlement")).toBeVisible()
    await expect(page.getByText(/^Le 5 juin 2025/)).toBeVisible()
    await expect(page.getByRole("link", { name: "Fiche LEGISinfo" })).toHaveAttribute("href", /legisinfo\/fr\/bill\/45-1\/C-4/)
  })

  test("language switch keeps the same page", async ({ page }) => {
    await page.goto("/votes/45-1/177")
    await page.getByRole("link", { name: "Lire cette page en français" }).first().click()
    await expect(page).toHaveURL(/\/fr\/votes\/45-1\/177$/)
    await expect(page.getByRole("heading", { level: 1 })).toContainText("aide médicale à mourir")
    await page.getByRole("link", { name: "Read this page in English" }).first().click()
    await expect(page).toHaveURL(/\/votes\/45-1\/177$/)
  })

  test("French filters and search work", async ({ page }) => {
    await page.goto("/fr/bills")
    await page.getByLabel("Étape", { exact: true }).selectOption("law")
    await expect(page).toHaveURL(/stage=law/)
    for (const t of await page.locator("article").allInnerTexts()) expect(t).toContain("Devenu loi")
    await page.keyboard.press("ControlOrMeta+k")
    await page.getByPlaceholder("Projets de loi, députés, circonscriptions ou votes").fill("abordable")
    await expect(page.getByRole("option", { name: /C-4/ })).toBeVisible()
  })

  test("pages declare hreflang alternates", async ({ page }) => {
    await page.goto("/bills/45-1/C-39")
    await expect(page.locator('link[rel="alternate"][hreflang="fr-CA"]')).toHaveAttribute("href", /\/fr\/bills\/45-1\/C-39$/)
  })
})
