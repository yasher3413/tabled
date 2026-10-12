import { expect, test } from "@playwright/test"

test("bill pages quote each party from the debate, with attribution and a source link", async ({ page }) => {
  await page.goto("/bills/45-1/C-4")
  const section = page.getByRole("region", { name: "What MPs said" })
  await expect(section).toBeVisible()
  const items = section.locator("li")
  expect(await items.count()).toBeGreaterThanOrEqual(3)
  await expect(items.first().getByRole("link", { name: /Read the full speech on openparliament.ca/ })).toHaveAttribute("href", /openparliament\.ca\/debates\//)
})

test("the embeddable vote card renders on its own, without site chrome", async ({ page }) => {
  await page.goto("/embed/votes/45-1/178")
  await expect(page.locator("header")).toHaveCount(0)
  await expect(page.getByRole("heading", { level: 1 })).toContainText("C-39")
  await expect(page.getByRole("link", { name: "See how every MP voted" })).toHaveAttribute("href", /\/votes\/45-1\/178$/)
})

test("vote pages offer the embed code", async ({ page }) => {
  await page.goto("/votes/45-1/178")
  await page.getByText("Embed this vote on your site").click()
  await expect(page.getByLabel("Copy this code into your page:")).toHaveValue(/<iframe src="[^"]+\/embed\/votes\/45-1\/178"/)
})
