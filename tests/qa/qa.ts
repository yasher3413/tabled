import path from "node:path"
import type { APIRequestContext, BrowserContext, Page, TestInfo } from "@playwright/test"
import { allowReason, severityOf, type Finding, type FindingKind } from "./findings"
import { blankPoints, enumerateTargets, fingerprint, hitTestAll, overflow, smallTargets, type Fingerprint, type Target } from "./probe"
import type { QaRoute } from "./routes"

const SHOTS = path.join(process.cwd(), "qa-report", "shots")
const MAX_TAPS = Number(process.env.QA_MAX_TAPS ?? 8)
const IGNORED_CONSOLE = [/React DevTools/i, /Failed to load resource/i, /net::ERR_ABORTED/i]
const IGNORED_FAILURE = /ERR_ABORTED|cancel|aborted|NS_BINDING_ABORTED|interrupted/i

function samePlace(a: URL, b: URL) {
  const strip = (p: string) => (p.length > 1 ? p.replace(/\/$/, "") : p)
  return strip(a.pathname) === strip(b.pathname) && new URLSearchParams(a.search).toString() === new URLSearchParams(b.search).toString()
}

/** Evenly spaced, deterministic sample. */
export function spread<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items
  const out: T[] = []
  for (let i = 0; i < n; i++) out.push(items[Math.floor((i * items.length) / n)])
  return out
}

/** One route in one project: collects findings and knows how to tap like a person. */
export class Qa {
  findings: Finding[] = []
  allowStatus = new Set<number>()
  readonly mobile: boolean
  readonly local: boolean
  private shotCount = 0

  constructor(
    readonly page: Page,
    readonly context: BrowserContext,
    readonly request: APIRequestContext,
    readonly route: QaRoute,
    readonly project: string,
    readonly info: TestInfo,
  ) {
    this.mobile = /mobile/.test(project)
    this.local = /localhost|127\.0\.0\.1/.test(String(info.project.use.baseURL))
    for (const s of route.expectStatus ?? []) this.allowStatus.add(s)
    if (route.kind === "not-found") this.allowStatus.add(404)
  }

  add(kind: FindingKind, f: { selector?: string; name?: string; expected: string; actual: string; screenshot?: string }) {
    const finding: Finding = { kind, severity: severityOf(kind), project: this.project, route: this.route.name, path: this.route.path, selector: f.selector ?? "", name: f.name ?? "", expected: f.expected, actual: f.actual, screenshot: f.screenshot }
    const reason = allowReason(finding)
    if (reason) finding.allowlisted = reason
    this.findings.push(finding)
  }

  async shot(label: string) {
    const file = path.join(SHOTS, `${this.project}-${this.route.name}-${label}-${++this.shotCount}.png`.replace(/[^\w.-]+/g, "_"))
    try {
      await this.page.screenshot({ path: file })
      return path.relative(process.cwd(), file)
    } catch {
      return undefined
    }
  }

  listen() {
    const origin = new URL(String(this.info.project.use.baseURL)).origin
    this.page.on("console", (msg) => {
      if (msg.type() !== "error") return
      const text = msg.text()
      if (IGNORED_CONSOLE.some((r) => r.test(text))) return
      this.add("console-error", { expected: "no console errors", actual: text.slice(0, 300) })
    })
    this.page.on("pageerror", (err) => this.add("page-error", { expected: "no uncaught errors", actual: err.message.slice(0, 300) }))
    this.page.on("response", (res) => {
      const url = new URL(res.url())
      if (url.origin !== origin || res.status() < 400) return
      if (this.allowStatus.has(res.status())) return
      this.add("http-error", { selector: url.pathname, expected: "status below 400", actual: `${res.status()} ${url.pathname}${url.search}`.slice(0, 200) })
    })
    this.page.on("requestfailed", (req) => {
      const url = new URL(req.url())
      if (url.origin !== origin) return
      const failure = req.failure()?.errorText ?? ""
      if (IGNORED_FAILURE.test(failure) || url.searchParams.has("_rsc")) return
      this.add("request-failed", { selector: url.pathname, expected: "request succeeds", actual: `${failure} ${url.pathname}` })
    })
    this.page.on("dialog", (d) => {
      this.add("unexpected-dialog", { expected: "no alert/confirm dialogs", actual: `${d.type()}: ${d.message().slice(0, 100)}` })
      void d.dismiss().catch(() => {})
    })
    const css = process.env.QA_INJECT_CSS
    if (css) {
      // Debug knob: simulate an engine quirk, e.g. QA_INJECT_CSS="tbody tr{position:static!important}".
      void this.page.addInitScript((c) => {
        document.addEventListener("DOMContentLoaded", () => {
          const s = document.createElement("style")
          s.textContent = c
          document.head.append(s)
        })
      }, css)
    }
  }

  async load() {
    await this.page.goto(this.route.path, { waitUntil: "networkidle", timeout: 60_000 })
    await this.page.evaluate(() => document.fonts.ready.then(() => undefined))
    await this.page.waitForTimeout(250)
  }

  enumerate(): Promise<Target[]> {
    return this.page.evaluate(enumerateTargets)
  }

  fp(): Promise<Fingerprint> {
    return this.page.evaluate(fingerprint)
  }

  async tapAt(x: number, y: number) {
    if (this.mobile) await this.page.touchscreen.tap(x, y)
    else await this.page.mouse.click(x, y)
  }

  /** Scroll a locator into view and tap its centre with raw coordinates, so overlays are not bypassed. */
  async tapLocator(selector: string) {
    const loc = this.page.locator(selector).first()
    if (!(await loc.count())) return false
    // Scroll the way a person does, a screenful at a time, until the element sits on screen. Jumping straight
    // there misses in WebKit: rows inside content-visibility: auto (the ballot table) report estimated
    // positions until they render, so one big scroll overshoots.
    const measure = () =>
      loc.evaluate((el) => {
        const b = Array.from(el.getClientRects()).find((x) => x.width > 0 && x.height > 0) ?? el.getBoundingClientRect()
        return { x: b.left + b.width / 2, y: b.top + b.height / 2, w: b.width, h: b.height }
      })
    let r = await measure()
    if (!r.w) return false
    const vh = this.viewportHeight()
    for (let i = 0; i < 80 && (r.y < 0 || r.y > vh); i++) {
      await this.page.evaluate((d) => window.scrollBy(0, Math.sign(d) * Math.min(Math.abs(d), innerHeight * 0.7)), r.y - vh / 2)
      await this.page.waitForTimeout(60)
      r = await measure()
    }
    await this.page.waitForTimeout(120) // let the scroll settle: a tap during a scroll only stops the scroll
    r = await measure()
    if (!r.w) return false
    await this.tapAt(r.x, r.y)
    return true
  }

  viewportHeight() {
    return this.page.viewportSize()?.height ?? 800
  }

  async staticChecks() {
    const targets = await this.enumerate()
    const width = this.page.viewportSize()?.width ?? 1440
    if (width <= 400) {
      for (const o of await this.page.evaluate(overflow)) this.add("overflow", { selector: o.split(" ")[0], expected: "no sideways scroll at 390px", actual: o })
    }
    const byQa = new Map(targets.map((t) => [t.qa, t]))
    for (const s of await this.page.evaluate(smallTargets)) {
      const t = byQa.get(s.qa)
      this.add("small-target", { selector: t?.selector, name: s.name, expected: "at least 24x24", actual: s.size })
    }
    for (const h of await this.page.evaluate(hitTestAll)) {
      this.add("obscured", { selector: h.selector, name: h.name, expected: "its centre receives the tap", actual: `covered by ${h.hit}` })
    }
    for (const t of targets) {
      if (t.role !== "link" || !t.href) continue
      const url = this.safeUrl(t.href)
      if (!url) {
        this.add("external-url", { selector: t.selector, name: t.name, expected: "a parseable URL", actual: t.href })
        continue
      }
      if (url.origin === new URL(this.page.url()).origin) continue
      if (!["https:", "mailto:"].includes(url.protocol)) this.add("external-url", { selector: t.selector, name: t.name, expected: "https: or mailto:", actual: t.href })
      if (t.blank) {
        const rel = await this.page.getAttribute(`[data-qa="${t.qa}"]`, "rel")
        if (!/noopener|noreferrer/.test(rel ?? "")) this.add("external-rel", { selector: t.selector, name: t.name, expected: 'rel="noopener"', actual: rel ?? "no rel" })
      }
    }
    return targets
  }

  safeUrl(href: string) {
    try {
      return new URL(href, this.page.url())
    } catch {
      return null
    }
  }

  async blankTaps() {
    const points = await this.page.evaluate(blankPoints, 5)
    for (const p of points) {
      if (p.coveredBy) this.add("blank-covered", { selector: p.selector, name: p.text, expected: "plain text receives the tap", actual: `covered by ${p.coveredBy}${p.coveredHref ? ` ${p.coveredHref}` : ""}` })
      await this.page.evaluate((y) => window.scrollTo(0, Math.max(0, y - innerHeight / 2)), p.y)
      const sy = await this.page.evaluate(() => window.scrollY)
      const before = this.page.url()
      await this.tapAt(p.x, p.y - sy)
      await this.page.waitForTimeout(800)
      if (this.page.url() !== before) {
        const screenshot = await this.shot("blank-tap")
        this.add("blank-tap-navigates", { selector: p.selector, name: p.text, expected: `stay on ${new URL(before).pathname}`, actual: `went to ${new URL(this.page.url()).pathname}`, screenshot })
        await this.load()
      }
    }
  }

  /** Taps a deterministic sample of controls and checks each did what it says. */
  async tapSample() {
    const targets = await this.enumerate()
    const pool = targets.filter((t) => !t.disabled && !t.submit && t.role !== "select" && (this.route.kind === "home" || !t.chrome))
    const seen = new Set<string>()
    const unique = pool.filter((t) => {
      const key = `${t.role}|${t.href ?? t.selector}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    for (const t of spread(unique, MAX_TAPS)) await this.tapTarget(t)
    const selects = targets.filter((t) => t.role === "select" && !t.chrome).slice(0, 4)
    for (const s of selects) await this.trySelect(s)
  }

  async tapTarget(t: Target) {
    await this.enumerate() // re-tag after any reset
    const sel = `[data-qa-sel="${t.selector}"]`
    if (!(await this.page.locator(sel).count())) return
    const before = this.page.url()
    const fp = await this.fp()
    if (t.role === "link" && t.href) {
      const url = this.safeUrl(t.href)
      if (!url) return
      const cur = new URL(before)
      if (url.origin !== cur.origin) return this.externalCheck(url)
      if (/\.xml$/.test(url.pathname) || t.download || url.pathname.startsWith("/data/")) {
        const res = await this.request.get(url.href)
        const type = res.headers()["content-type"] ?? ""
        if (res.status() !== 200) this.add("dead-link", { selector: t.selector, name: t.name, expected: "200", actual: `${res.status()} ${url.pathname}` })
        else if (/\.xml$/.test(url.pathname) && !/xml/.test(type)) this.add("dead-link", { selector: t.selector, name: t.name, expected: "an XML content type", actual: type })
        return
      }
      if (t.blank) {
        const popup = this.context.waitForEvent("page", { timeout: 5000 }).catch(() => null)
        await this.tapLocator(sel)
        const p = await popup
        if (!p) this.add("dead-link", { selector: t.selector, name: t.name, expected: `new tab at ${url.pathname}`, actual: "no new tab" })
        else await p.close()
        return this.reset(before, fp)
      }
      await this.tapLocator(sel)
      if (samePlace(url, cur)) {
        await this.page.waitForTimeout(500)
        if (url.hash && new URL(this.page.url()).hash !== url.hash) {
          this.add("tap-target-mismatch", { selector: t.selector, name: t.name, expected: url.hash, actual: this.page.url() })
        }
      } else {
        const waitMove = () =>
          this.page.waitForURL((u) => u.href !== before, { timeout: 8000, waitUntil: "commit" }).then(
            () => true,
            () => false,
          )
        let moved = await waitMove()
        if (!moved) {
          // Tap once more to tell "needs two taps" (iOS treating the first tap as a hover) from a dead link.
          // Both are errors: people tap once.
          await this.tapLocator(sel)
          moved = await waitMove()
          if (moved) {
            const screenshot = await this.shot("second-tap")
            this.add("dead-link", { selector: t.selector, name: t.name, expected: `first tap navigates to ${url.pathname}`, actual: "only the second tap navigated", screenshot })
          }
        }
        if (!moved) {
          const screenshot = await this.shot("dead-link")
          this.add("dead-link", { selector: t.selector, name: t.name, expected: `navigate to ${url.pathname}${url.search}`, actual: "stayed put", screenshot })
        } else {
          const now = new URL(this.page.url())
          if (!samePlace(now, url) || (url.hash && now.hash !== url.hash)) {
            const screenshot = await this.shot("mismatch")
            this.add("tap-target-mismatch", { selector: t.selector, name: t.name, expected: `${url.pathname}${url.search}${url.hash}`, actual: `${now.pathname}${now.search}${now.hash}`, screenshot })
          }
        }
      }
      return this.reset(before, fp)
    }
    await this.tapLocator(sel)
    await this.page.waitForTimeout(600)
    const after = await this.fp()
    if (JSON.stringify(after) === JSON.stringify(fp)) {
      this.add("no-op", { selector: t.selector, name: t.name, expected: "visible change", actual: "nothing changed" })
    }
    return this.reset(before, fp)
  }

  async trySelect(t: Target) {
    await this.enumerate()
    const sel = `[data-qa-sel="${t.selector}"]`
    const loc = this.page.locator(sel).first()
    if (!(await loc.count())) return
    const before = this.page.url()
    const fp = await this.fp()
    const value = await loc.evaluate((el) => {
      const s = el as HTMLSelectElement
      return Array.from(s.options).find((o) => o.value !== s.value && !o.disabled)?.value ?? null
    })
    if (value === null) return
    const picked = await loc.selectOption(value, { timeout: 5000 }).then(
      () => true,
      () => false,
    )
    if (!picked) return this.reset(before, fp) // could not operate it; not evidence that it does nothing
    await this.page.waitForTimeout(700)
    const after = await this.fp()
    if (after.url === fp.url && after.textLength === fp.textLength && after.aria === fp.aria) {
      this.add("no-op", { selector: t.selector, name: t.name, expected: "URL or content changes", actual: `selected ${value}, nothing changed` })
    }
    await this.reset(before, fp)
  }

  externalCheck(url: URL) {
    if (process.env.QA_EXTERNAL !== "1") return
    externalQueue.add(url.href)
  }

  async reset(before: string, fp: Fingerprint) {
    const now = await this.fp().catch(() => null)
    if (!now || now.url !== before || JSON.stringify(now) !== JSON.stringify(fp) || now.dialogs > 0) {
      await this.load()
    } else {
      await this.page.keyboard.press("Escape")
    }
  }

  attach() {
    return this.info.attach("findings", { body: JSON.stringify(this.findings), contentType: "application/json" })
  }

  errors() {
    return this.findings.filter((f) => f.severity === "error" && !f.allowlisted).map((f) => `${f.kind}: ${f.selector} ${f.actual}`)
  }
}

/** External URLs seen while tapping; HEAD-checked once each, sequentially, only with QA_EXTERNAL=1. */
export const externalQueue = new Set<string>()
