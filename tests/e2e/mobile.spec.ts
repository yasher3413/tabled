import { expect, test, type Page } from "@playwright/test"

// Phone-sized checks for tap targets. Runs in Chromium and, through the webkit-mobile project, in WebKit.
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

/** Older iOS WebKit does not let a table row contain absolutely positioned children; reproduce that here. */
async function simulateStaticRows(page: Page) {
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const s = document.createElement("style")
      s.textContent = "tbody tr { position: static !important }"
      document.head.append(s)
    })
  })
}

/** The list renders twice: a static fallback, then the interactive version. Wait for the second. */
async function gotoMps(page: Page) {
  await page.goto("/mps")
  await expect(page.locator("main [role=search]:not([inert])")).toBeVisible()
  await expect(page.locator("tbody tr")).toHaveCount(60)
}

async function tapCentre(page: Page, selector: ReturnType<Page["locator"]>) {
  // Scroll the window by hand: in WebKit, scrollIntoViewIfNeeded does not reach rows inside a
  // content-visibility: auto table (the vote page's ballot table), although a person scrolling does.
  const before = (await selector.boundingBox())!
  await page.evaluate((y) => window.scrollBy(0, y - innerHeight / 2), before.y)
  await page.waitForTimeout(300)
  const box = await selector.boundingBox()
  if (!box) throw new Error("no box")
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
}

test.describe("MPs list on a phone", () => {
  for (const simulate of [false, true]) {
    test(`tapping the page text does nothing${simulate ? " (rows without a containing block)" : ""}`, async ({ page }) => {
      if (simulate) await simulateStaticRows(page)
      await gotoMps(page)
      const lede = page.locator("main h1 + p").first()
      const box = (await lede.boundingBox())!
      const x = box.x + box.width / 2
      const y = box.y + box.height / 2
      expect(await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.closest("a")?.getAttribute("href") ?? null, [x, y])).toBeNull()
      // Catch a navigation even if it starts late: any non-prefetch request for an MP page counts.
      const opened: string[] = []
      page.on("request", (r) => {
        if (r.headers()["next-router-prefetch"]) return
        if (/\/mps\/[^/?]+/.test(new URL(r.url()).pathname)) opened.push(r.url())
      })
      await page.touchscreen.tap(x, y)
      await page.waitForTimeout(1500)
      await page.waitForLoadState("networkidle")
      expect(opened).toEqual([])
      await expect(page).toHaveURL(/\/mps$/)
    })
  }

  test("filters are reachable", async ({ page }) => {
    await simulateStaticRows(page)
    await gotoMps(page)
    const party = page.getByLabel("Party", { exact: true })
    const box = (await party.boundingBox())!
    const hitIsSelect = await page.evaluate(([px, py]) => document.elementFromPoint(px, py)?.tagName ?? null, [box.x + box.width / 2, box.y + box.height / 2])
    expect(hitIsSelect).toBe("SELECT")
    await party.selectOption("green")
    await expect(page).toHaveURL(/party=green/)
  })

  test("tapping a row opens that MP, including outside the name", async ({ page }) => {
    await gotoMps(page)
    const rows = page.locator("tbody tr")
    const row = rows.nth(2)
    const href = (await row.locator("a").first().getAttribute("href"))!
    await tapCentre(page, row.locator("td.tabular-nums").first())
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })

  test("the last row opens its own MP", async ({ page }) => {
    await simulateStaticRows(page)
    await gotoMps(page)
    const link = page.locator("tbody tr").nth(59).locator("a").first()
    const href = (await link.getAttribute("href"))!
    await tapCentre(page, link)
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })
})

test.describe("touch on interactive charts", () => {
  test("a name in the ballot table opens the MP on the first tap", async ({ page }) => {
    await page.goto("/votes/45-1/177")
    const link = page.locator("tbody tr").nth(21).locator("th a")
    const href = (await link.getAttribute("href"))!
    await page.waitForLoadState("networkidle")
    await tapCentre(page, link)
    await expect(page).toHaveURL(new RegExp(`${href}$`))
  })

  test("tapping a party in the seat legend pins its seats", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")
    const legend = page.locator("figcaption button").first()
    await tapCentre(page, legend)
    await expect(legend).toHaveAttribute("aria-pressed", "true")
    await tapCentre(page, legend)
    await expect(legend).toHaveAttribute("aria-pressed", "false")
  })
})
