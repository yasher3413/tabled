// In-page probes, run through page.evaluate. Each function must be self-contained: Playwright serialises it
// to a string, so it cannot reach anything else in this module.

export interface Target {
  qa: string
  selector: string
  name: string
  tag: string
  role: "link" | "button" | "summary" | "select" | "checkbox" | "other"
  href: string | null
  blank: boolean
  download: boolean
  submit: boolean
  disabled: boolean
  chrome: boolean
  inline: boolean
  rect: { x: number; y: number; w: number; h: number }
}

export interface HitFailure {
  selector: string
  name: string
  hit: string
}

export interface BlankPoint {
  selector: string
  text: string
  x: number
  y: number
  /** Set when the element's own centre is covered by something else, typically a link overlay. */
  coveredBy: string | null
  coveredHref: string | null
}

export interface Fingerprint {
  url: string
  htmlClass: string
  dialogs: number
  aria: string
  open: number
  checked: number
  selects: string
  textLength: number
  mainHash: number
  storage: string
}

/** Tags every visible interactive element with data-qa and describes it. */
export function enumerateTargets(): Target[] {
  const SEL = 'a[href], button, summary, select, input[type=checkbox], input[type=radio], [role=button], [role=tab], [tabindex="0"]'
  function cssPath(el: Element): string {
    const parts: string[] = []
    let node: Element | null = el
    while (node && node !== document.body) {
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id) && !/^(radix|_r_|:r)/.test(node.id)) {
        parts.unshift(`#${node.id}`)
        break
      }
      const tag: string = node.tagName.toLowerCase()
      const parent: Element | null = node.parentElement
      if (!parent) break
      const same = Array.from(parent.children).filter((c) => c.tagName === node!.tagName)
      parts.unshift(same.length > 1 ? `${tag}:nth-of-type(${same.indexOf(node) + 1})` : tag)
      node = parent
    }
    return parts.join(" > ")
  }
  function visible(el: Element) {
    const r = el.getBoundingClientRect()
    if (r.width <= 1 || r.height <= 1) return false
    if (el.closest("[inert], [aria-hidden=true], .sr-only")) return false
    const s = getComputedStyle(el)
    return s.visibility !== "hidden" && s.display !== "none" && Number(s.opacity) > 0.05
  }
  function accName(el: Element) {
    const label = el.getAttribute("aria-label")
    if (label) return label.trim()
    if (el instanceof HTMLSelectElement || el instanceof HTMLInputElement) {
      const lab = el.labels?.[0]
      if (lab) return (lab.textContent ?? "").trim()
    }
    return (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 80) || (el.getAttribute("title") ?? "")
  }
  function inlineInText(el: Element) {
    if (el.tagName !== "A") return false
    if (getComputedStyle(el).display !== "inline") return false
    const parent = el.parentElement
    if (!parent) return false
    const own = (el.textContent ?? "").trim().length
    return (parent.textContent ?? "").trim().length > own + 3
  }
  const out: Target[] = []
  let i = 0
  for (const el of Array.from(document.querySelectorAll(SEL))) {
    if (!visible(el)) continue
    const tag = el.tagName.toLowerCase()
    const input = el as HTMLInputElement
    const role: Target["role"] =
      tag === "a" ? "link" : tag === "button" || el.getAttribute("role") === "button" || el.getAttribute("role") === "tab" ? "button" : tag === "summary" ? "summary" : tag === "select" ? "select" : tag === "input" ? "checkbox" : "other"
    const r = el.getBoundingClientRect()
    const qa = String(i++)
    const selector = cssPath(el)
    const inline = inlineInText(el)
    el.setAttribute("data-qa", qa)
    el.setAttribute("data-qa-sel", selector)
    if (inline) el.setAttribute("data-qa-inline", "1")
    out.push({
      qa,
      selector,
      name: accName(el),
      tag,
      role,
      href: tag === "a" ? el.getAttribute("href") : null,
      blank: el.getAttribute("target") === "_blank",
      download: el.hasAttribute("download"),
      submit: tag === "button" && ((el as HTMLButtonElement).type === "submit") && !!el.closest("form"),
      disabled: (el as HTMLButtonElement).disabled === true || el.getAttribute("aria-disabled") === "true" || (tag === "input" && input.disabled),
      chrome: !!el.closest("header, footer, [role=dialog]"),
      inline,
      rect: { x: r.x, y: r.y + window.scrollY, w: r.width, h: r.height },
    })
  }
  return out
}

/** For each tagged target: scroll it into view and check that its centre is not covered by something else. */
export function hitTestAll(): HitFailure[] {
  function describe(el: Element | null) {
    if (!el) return "nothing"
    const a = el.closest("a")
    const base = `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.split(/\s+/).slice(0, 3).join(".") : ""}`
    return a ? `${base} in link ${a.getAttribute("href")}` : base
  }
  const fails: HitFailure[] = []
  const prev = window.scrollY
  for (const el of Array.from(document.querySelectorAll("[data-qa]"))) {
    el.scrollIntoView({ block: "center", inline: "center", behavior: "instant" as ScrollBehavior })
    // A link that wraps onto two lines has its box centre between the lines; aim at its first line instead.
    const r = el.getClientRects()[0] ?? el.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue
    const hit = document.elementFromPoint(x, y)
    if (!hit) continue
    if (hit === el || el.contains(hit)) continue
    const link = hit.closest("a")
    if (link && el.tagName === "A" && link.getAttribute("href") === el.getAttribute("href")) continue
    const label = hit.closest("label")
    if (label && (label.control === el || label.contains(el))) continue
    const sel = el.getAttribute("data-qa-sel") ?? ""
    fails.push({ selector: sel, name: (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60), hit: describe(hit) })
  }
  window.scrollTo(0, prev)
  return fails
}

/** Up to `max` text blocks in <main> that are not controls. Tapping them must do nothing. */
export function blankPoints(max: number): BlankPoint[] {
  const INTERACTIVE = "a, button, summary, select, input, textarea, label, [role=button], [role=tab], [tabindex]"
  const ROW = "li, article, tr, th, td"
  const out: BlankPoint[] = []
  const candidates = Array.from(document.querySelectorAll("main p, main h1, main h2, main h3")).filter((el) => {
    if (el.closest(INTERACTIVE)) return false
    if (el.closest("[inert], [aria-hidden=true]")) return false
    const r = el.getBoundingClientRect()
    return r.width > 40 && r.height > 10
  })
  for (const el of candidates) {
    if (out.length >= max) break
    el.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior })
    const r = el.getBoundingClientRect()
    // Aim at the element's first line, away from any inline link where possible.
    const x = r.left + Math.min(r.width / 2, 24)
    const y = r.top + Math.min(r.height / 2, 10)
    const hit = document.elementFromPoint(x, y)
    if (!hit) continue
    const control = hit.closest(INTERACTIVE)
    let coveredBy: string | null = null
    let coveredHref: string | null = null
    if (control) {
      if (el.contains(control)) continue // an inline link inside the text, fine
      // A stretched link that belongs to the same row (bill row, ballot row) is intended.
      const a = control.closest("a")
      const row = el.closest(ROW)
      if (row && row.contains(control)) continue
      coveredBy = `${control.tagName.toLowerCase()}`
      coveredHref = a?.getAttribute("href") ?? null
    } else if (!(hit === el || el.contains(hit) || hit.contains(el))) {
      continue // covered by a non-interactive layer; tapping it does nothing either way
    }
    out.push({
      selector: el.tagName.toLowerCase() + ":" + (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 30),
      text: (el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      x,
      y: r.top + Math.min(r.height / 2, 10) + window.scrollY,
      coveredBy,
      coveredHref,
    })
  }
  window.scrollTo(0, 0)
  return out
}

/** Elements that stick out past the right edge when the page scrolls sideways. */
export function overflow(): string[] {
  if (document.documentElement.scrollWidth <= innerWidth + 1) return []
  const out: string[] = []
  for (const el of Array.from(document.querySelectorAll("body *"))) {
    const r = el.getBoundingClientRect()
    if (r.right <= innerWidth + 1 || r.width === 0) continue
    let scroller = false
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX
      if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") {
        scroller = true
        break
      }
    }
    if (scroller) continue
    out.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""} right=${Math.round(r.right)}`)
    if (out.length >= 5) break
  }
  return out.length ? out : [`document scrollWidth ${document.documentElement.scrollWidth} > ${innerWidth}`]
}

/**
 * Interactive elements smaller than 24 by 24 CSS pixels that also fail the WCAG 2.5.8 spacing exception (a 24px
 * circle on the target's centre must not touch another target or another small target's circle). Links inside
 * running text are exempt.
 */
export function smallTargets(): Array<{ qa: string; name: string; size: string }> {
  const els = Array.from(document.querySelectorAll("[data-qa]"))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((x) => x.r.width > 1 && x.r.height > 1)
  const small = (r: DOMRect) => r.width < 24 || r.height < 24
  const centre = (r: DOMRect) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
  const distToRect = (p: { x: number; y: number }, r: DOMRect) => Math.hypot(Math.max(r.left - p.x, 0, p.x - r.right), Math.max(r.top - p.y, 0, p.y - r.bottom))
  const out: Array<{ qa: string; name: string; size: string }> = []
  for (const a of els) {
    if (a.el.getAttribute("data-qa-inline") === "1" || !small(a.r)) continue
    const c = centre(a.r)
    const crowded = els.some((b) => {
      if (b === a || a.el.contains(b.el) || b.el.contains(a.el)) return false
      if (small(b.r)) {
        const d = centre(b.r)
        return Math.hypot(c.x - d.x, c.y - d.y) < 24
      }
      return distToRect(c, b.r) < 12
    })
    if (!crowded) continue
    out.push({ qa: a.el.getAttribute("data-qa")!, name: (a.el.getAttribute("aria-label") ?? a.el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60), size: `${Math.round(a.r.width)}x${Math.round(a.r.height)}` })
  }
  return out
}

/** Enough state to tell whether a tap did something. */
export function fingerprint(): Fingerprint {
  const aria = Array.from(document.querySelectorAll("[aria-expanded], [aria-pressed], [aria-selected], [aria-checked]"))
    .map((el) => ["aria-expanded", "aria-pressed", "aria-selected", "aria-checked"].map((a) => el.getAttribute(a) ?? "").join(""))
    .join("|")
  let storage = ""
  try {
    storage = `${localStorage.length}:${localStorage.getItem("tabled-theme") ?? ""}`
  } catch {}
  return {
    url: location.href,
    htmlClass: document.documentElement.className,
    dialogs: document.querySelectorAll("[role=dialog]").length,
    aria,
    open: document.querySelectorAll("details[open]").length,
    checked: document.querySelectorAll("input:checked").length,
    selects: Array.from(document.querySelectorAll("select")).map((s) => s.value).join("|"),
    textLength: document.body.innerText.length,
    // Catches class and attribute changes (a highlighted seat, a dimmed legend entry).
    mainHash: Array.from(document.querySelector("main")?.innerHTML ?? "").reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0),
    storage,
  }
}
