import { expect, test } from "@playwright/test"

test("weekly digest lists bills that moved and votes, with week navigation", async ({ page }) => {
  await page.goto("/this-week/2026-W41")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Week of October 5, 2026")
  await expect(page.getByRole("link", { name: "Building Canada Strong Act", exact: true })).toBeVisible()
  await expect(page.getByRole("link", { name: /2nd reading of Bill C-39/ })).toBeVisible()
  await page.getByRole("link", { name: "Previous week" }).click()
  await expect(page).toHaveURL(/\/this-week\/2026-W40$/)
})

test("this week never opens on an empty page when earlier weeks exist", async ({ page }) => {
  await page.goto("/this-week")
  await expect(page.locator("main li").first()).toBeVisible()
})

test("RSS feeds are served as RSS", async ({ request }) => {
  for (const path of ["/this-week/rss.xml", "/fr/this-week/rss.xml", "/bills/45-1/C-39/rss.xml", "/mps/ziad-aboultaif/rss.xml"]) {
    const res = await request.get(path)
    expect(res.status(), path).toBe(200)
    expect(res.headers()["content-type"]).toContain("application/rss+xml")
    expect(await res.text()).toContain("<rss version=\"2.0\"")
  }
})

test("bill pages advertise their feed", async ({ page }) => {
  await page.goto("/bills/45-1/C-39")
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", /\/bills\/45-1\/C-39\/rss\.xml$/)
})
