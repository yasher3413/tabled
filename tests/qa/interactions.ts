// Route-specific interactions on top of the generic tap sweep. Each records findings instead of throwing,
// so one broken control does not hide the rest of the run.
import { sampleRoutes } from "../../scripts/lib/sample-routes"
import type { Qa } from "./qa"

const BILL_NUMBER = (sampleRoutes().find((r) => r.name === "bill-detail")?.path ?? "/bills/x/C-1").split("/").pop()!

function fr(qa: Qa) {
  return qa.route.path === "/fr" || qa.route.path.startsWith("/fr/")
}

async function step(qa: Qa, name: string, fn: () => Promise<void>) {
  try {
    await fn()
  } catch (err) {
    const screenshot = await qa.shot(name)
    qa.add("interaction", { selector: name, expected: `${name} works`, actual: (err as Error).message.split("\n")[0].slice(0, 300), screenshot })
    await qa.load().catch(() => {})
  }
}

function check(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

/** The language link must point at this page in the other language. */
export async function languageSwitch(qa: Qa, tap: boolean) {
  const { page } = qa
  await step(qa, "language-switch", async () => {
    const href = await page.locator("header a[hreflang]").first().getAttribute("href")
    const pathname = new URL(page.url()).pathname
    const unloc = pathname === "/fr" ? "/" : pathname.startsWith("/fr/") ? pathname.slice(3) : pathname
    const expected = fr(qa) ? unloc : unloc === "/" ? "/fr" : `/fr${unloc}`
    check(href === expected, `language link is ${href}, expected ${expected}`)
    if (!tap) return
    const lang = fr(qa) ? "en-CA" : "fr-CA"
    const res = page.waitForResponse((r) => new URL(r.url()).pathname === expected && r.request().resourceType() === "document", { timeout: 15_000 })
    if (qa.mobile) {
      await qa.tapLocator("header button[aria-haspopup=dialog]")
      await page.getByRole("dialog").waitFor({ timeout: 5000 })
      await qa.tapLocator("[role=dialog] a[hreflang]")
    } else {
      await qa.tapLocator("header a[hreflang]")
    }
    const r = await res
    check(r.status() === 200 || qa.route.kind === "not-found", `language page returned ${r.status()}`)
    await page.waitForFunction((l) => document.documentElement.lang === l, lang, { timeout: 10_000 })
    await qa.load()
  })
}

export async function themeToggle(qa: Qa) {
  const { page } = qa
  await step(qa, "theme-toggle", async () => {
    const btn = "header button[title]"
    await page.evaluate(() => localStorage.removeItem("tabled-theme"))
    await qa.load()
    const read = () =>
      page.evaluate((s) => ({
        label: document.querySelector(s)?.getAttribute("aria-label") ?? "",
        dark: document.documentElement.classList.contains("dark"),
        stored: localStorage.getItem("tabled-theme"),
        system: matchMedia("(prefers-color-scheme: dark)").matches,
      }), btn)
    let prev = await read()
    for (const want of ["light", "dark", "system"]) {
      await qa.tapLocator(btn)
      await page.waitForTimeout(250)
      const now = await read()
      check(now.stored === want, `theme stored as ${now.stored}, expected ${want}`)
      check(now.label !== prev.label, `theme label stayed "${now.label}"`)
      const dark = want === "dark" || (want === "system" && now.system)
      check(now.dark === dark, `html.dark is ${now.dark} for ${want}`)
      prev = now
    }
  })
}

export async function commandPalette(qa: Qa) {
  const { page } = qa
  await step(qa, "command-palette", async () => {
    const trigger = "header button:has(svg.lucide-search)"
    if (qa.mobile) await qa.tapLocator(trigger)
    else await page.keyboard.press("ControlOrMeta+k")
    const dialog = page.getByRole("dialog")
    await dialog.waitFor({ timeout: 5000 })
    await page.keyboard.type(BILL_NUMBER)
    await page.locator("[cmdk-item]").first().waitFor({ timeout: 10_000 })
    await page.keyboard.press("Enter")
    await page.waitForURL(/\/bills\//, { timeout: 10_000 })
    await qa.load()
    await qa.tapLocator(trigger)
    await dialog.waitFor({ timeout: 5000 })
    await page.keyboard.press("Escape")
    await dialog.waitFor({ state: "hidden", timeout: 5000 })
    // Safari does not focus a button on tap, so there is nothing to return focus to on WebKit.
    if (!/webkit/.test(qa.project)) {
      const focused = await page.evaluate((s) => document.activeElement === document.querySelector(s), trigger)
      check(focused, "focus did not return to the search button")
    }
  })
}

export async function mobileNav(qa: Qa) {
  const { page } = qa
  if (!qa.mobile) return
  await step(qa, "mobile-nav", async () => {
    const open = async () => {
      await qa.tapLocator("header button[aria-haspopup=dialog]")
      await page.getByRole("dialog").waitFor({ timeout: 5000 })
    }
    await open()
    const hrefs = await page.locator("[role=dialog] nav a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""))
    check(hrefs.length >= 4, `menu has ${hrefs.length} links`)
    await qa.tapLocator("[role=dialog] button[aria-label]")
    await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 5000 })
    for (const href of hrefs) {
      await open()
      await qa.tapLocator(`[role=dialog] nav a[href="${href}"]`)
      await page.waitForURL((u) => u.pathname === href, { timeout: 10_000, waitUntil: "commit" }).catch(() => {
        throw new Error(`menu link ${href} went to ${new URL(page.url()).pathname}`)
      })
      await page.getByRole("dialog").waitFor({ state: "hidden", timeout: 5000 })
      await page.waitForLoadState("networkidle")
    }
    await qa.load()
  })
}

/** Set a filter, then clear it with the "Clear filters" action. */
export async function filters(qa: Qa) {
  const { page } = qa
  await step(qa, "filters-clear", async () => {
    const select = page.locator("main [role=search] select").first()
    if (!(await select.count())) return
    const value = await select.evaluate((el) => {
      const s = el as HTMLSelectElement
      return Array.from(s.options).find((o) => o.value && o.value !== s.value)?.value ?? null
    })
    if (!value) return
    await select.selectOption(value)
    await page.waitForFunction(() => location.search.length > 1, null, { timeout: 5000 })
    const clear = page.locator("main p[aria-live] button")
    if (!(await clear.count())) return // the filter did not narrow the list, so there is nothing to clear
    await qa.tapLocator("main p[aria-live] button")
    await page.waitForFunction((p) => location.search === p, new URL(qa.route.path, "http://x").search, { timeout: 5000 }).catch(() => {
      throw new Error(`clearing filters left ${new URL(page.url()).search}`)
    })
    await qa.load()
  })
}

/** Hover (desktop) or tap (phone) a few seats: no errors, no navigation, and the highlight changes. */
export async function hemicycle(qa: Qa) {
  const { page } = qa
  await step(qa, "hemicycle", async () => {
    const svg = page.locator("main svg[role=img]:has(circle)").first()
    if (!(await svg.count())) return
    const seats = svg.locator("circle")
    const n = await seats.count()
    if (n < 5) return
    const before = page.url()
    let changed = false
    for (const i of [0, Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4), n - 1]) {
      const seat = seats.nth(i)
      await seat.scrollIntoViewIfNeeded()
      const html = await svg.innerHTML()
      if (qa.mobile) {
        const box = await seat.boundingBox()
        if (box) await qa.tapAt(box.x + box.width / 2, box.y + box.height / 2)
      } else {
        await seat.hover({ force: true })
      }
      await page.waitForTimeout(250)
      if ((await svg.innerHTML()) !== html) changed = true
      check(page.url() === before, `tapping a seat went to ${page.url()}`)
    }
    if (!changed && !qa.mobile) qa.add("no-op", { selector: "hemicycle seats", expected: "hover highlights a seat", actual: "the chart did not change" })
  })
}

export async function findMp(qa: Qa) {
  const { page } = qa
  await step(qa, "find-postal", async () => {
    await page.locator("#postal").fill("K1A0A6")
    await qa.tapLocator("main form button[type=submit]")
    const heading = page.locator("main section h2").first()
    await heading.waitFor({ timeout: 15_000 })
    check(/K1A 0A6/.test(await heading.innerText()), `result heading is "${await heading.innerText()}"`)
    // Tap the result card body, not the name: the stretched link must still open the MP.
    const card = page.locator("main section li").first()
    const href = await card.locator("a").first().getAttribute("href")
    const box = await card.boundingBox()
    check(box && href, "no result card")
    await qa.tapAt(box!.x + box!.width - 12, box!.y + 12)
    await page.waitForURL((u) => u.pathname === href, { timeout: 10_000, waitUntil: "commit" }).catch(() => {
      throw new Error(`card tap went to ${new URL(page.url()).pathname}, expected ${href}`)
    })
    await qa.load()
  })
  if (!qa.local) return // one live lookup per run is enough against production
  await step(qa, "find-invalid", async () => {
    await page.locator("#postal").fill("D1A0A6")
    await qa.tapLocator("main form button[type=submit]")
    await page.locator("#postal-help.text-danger-ink").waitFor({ timeout: 5000 })
    qa.allowStatus.add(404)
    await page.locator("#postal").fill("H0H0H0")
    await qa.tapLocator("main form button[type=submit]")
    await page.getByRole("alert").waitFor({ timeout: 15_000 })
    await qa.load()
  })
}

export async function runSpecial(qa: Qa) {
  const kind = qa.route.kind
  if (kind !== "embed") await languageSwitch(qa, kind === "home" || qa.route.name === "bill-detail" || qa.route.name === "fr-bill-detail")
  if (kind === "home") {
    await themeToggle(qa)
    await commandPalette(qa)
    await mobileNav(qa)
  }
  if (kind === "filters") await filters(qa)
  if (kind === "hemicycle") await hemicycle(qa)
  if (kind === "find") await findMp(qa)
}
