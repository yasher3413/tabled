// Captures every main route at 1440px and 390px in light and dark mode into docs/screenshots/.
//   pnpm screenshots                      (builds must exist; starts `next start` itself)
//   BASE_URL=http://localhost:3000 pnpm screenshots   (use an already running server)
//   ROUTES=/,/bills pnpm screenshots      (subset)
import { spawn, type ChildProcess } from "node:child_process"
import { mkdirSync } from "node:fs"
import path from "node:path"
import { chromium } from "@playwright/test"
import Database from "better-sqlite3"

const OUT = process.env.OUT_DIR ?? path.join(process.cwd(), "docs", "screenshots")
const PORT = 3200

function sampleRoutes(): Array<{ name: string; path: string }> {
  const db = new Database(path.join(process.cwd(), "data", "tabled.db"), { readonly: true })
  // Pick well-populated examples so screenshots show real, representative data.
  const bill = db
    .prepare("SELECT b.session_id s, b.number n FROM bills b JOIN votes v ON v.bill_id = b.id WHERE b.type = 'government' GROUP BY b.id ORDER BY b.last_activity_date DESC LIMIT 1")
    .get() as { s: string; n: string }
  const vote = db
    .prepare("SELECT session_id s, number n FROM votes WHERE has_party_split = 1 ORDER BY date DESC LIMIT 1")
    .get() as { s: string; n: number }
  const mp = db
    .prepare("SELECT m.id FROM members m JOIN member_stats s ON s.member_id = m.id WHERE m.active = 1 AND s.bills_sponsored > 0 ORDER BY s.dissent_count DESC, s.bills_sponsored DESC LIMIT 1")
    .get() as { id: string }
  db.close()
  return [
    { name: "home", path: "/" },
    { name: "bills", path: "/bills" },
    { name: "bill-detail", path: `/bills/${bill.s}/${bill.n}` },
    { name: "votes", path: "/votes" },
    { name: "vote-detail", path: `/votes/${vote.s}/${vote.n}` },
    { name: "mps", path: "/mps" },
    { name: "mp-detail", path: `/mps/${mp.id}` },
    { name: "find", path: "/find" },
    { name: "parties", path: "/parties" },
    { name: "about", path: "/about" },
    { name: "not-found", path: "/this-page-does-not-exist" },
  ]
}

async function waitFor(url: string, timeoutMs = 60_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.status < 500) return
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server at ${url} did not start`)
}

async function main() {
  let server: ChildProcess | null = null
  let base = process.env.BASE_URL
  if (!base) {
    base = `http://localhost:${PORT}`
    server = spawn("pnpm", ["exec", "next", "start", "-p", String(PORT)], { stdio: "ignore" })
    await waitFor(base)
  }
  mkdirSync(OUT, { recursive: true })
  const only = process.env.ROUTES?.split(",")
  const routes = sampleRoutes().filter((r) => !only || only.includes(r.path) || only.includes(r.name))
  const browser = await chromium.launch()
  try {
    for (const theme of ["light", "dark"] as const) {
      for (const width of [1440, 390]) {
        const context = await browser.newContext({
          viewport: { width, height: width > 800 ? 900 : 844 },
          deviceScaleFactor: width > 800 ? 1 : 2,
          colorScheme: theme,
          reducedMotion: "reduce",
        })
        await context.addInitScript((t) => {
          try {
            localStorage.setItem("tabled-theme", t)
          } catch {}
        }, theme)
        const page = await context.newPage()
        for (const r of routes) {
          await page.goto(`${base}${r.path}`, { waitUntil: "networkidle" })
          await page.evaluate(() => document.fonts.ready)
          const file = path.join(OUT, `${r.name}-${width}-${theme}.png`)
          await page.screenshot({ path: file, fullPage: true })
          console.log(`saved ${path.relative(process.cwd(), file)}`)
        }
        await context.close()
      }
    }
  } finally {
    await browser.close()
    server?.kill()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
