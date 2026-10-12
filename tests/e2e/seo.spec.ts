import { expect, test } from "@playwright/test"

test("bill pages carry title, description and a generated OG image", async ({ page, request }) => {
  await page.goto("/bills/45-1/C-39")
  await expect(page).toHaveTitle(/C-39: Building Canada Strong Act · Tabled/)
  const og = await page.locator('meta[property="og:image"]').getAttribute("content")
  expect(og).toMatch(/\/bills\/45-1\/C-39\/opengraph-image/)
  const img = await request.get(new URL(og!).pathname)
  expect(img.status()).toBe(200)
  expect(img.headers()["content-type"]).toBe("image/png")
})

test("sitemap and robots are published", async ({ request }) => {
  const sitemap = await request.get("/sitemap.xml")
  expect(sitemap.status()).toBe(200)
  const xml = await sitemap.text()
  expect(xml).toContain("/bills/45-1/C-39")
  expect(xml).toContain("/mps/ziad-aboultaif")
  const robots = await (await request.get("/robots.txt")).text()
  expect(robots).toContain("Sitemap:")
})

test("unknown pages show the custom 404", async ({ page }) => {
  const res = await page.goto("/this-page-does-not-exist")
  expect(res?.status()).toBe(404)
  await expect(page.getByRole("heading", { name: "We can’t find that page." })).toBeVisible()
})
