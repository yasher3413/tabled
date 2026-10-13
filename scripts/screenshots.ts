// Captures every main route at 1440px and 390px in light and dark mode into docs/screenshots/.
//   pnpm screenshots                      (builds must exist; starts `next start` itself)
//   BASE_URL=http://localhost:3000 pnpm screenshots   (use an already running server)
//   ROUTES=/,/bills pnpm screenshots      (subset)
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { mkdirSync } from "node:fs"
import path from "node:path"
import { chromium } from "@playwright/test"
import { sampleRoutes } from "./lib/sample-routes"

const OUT = process.env.OUT_DIR ?? path.join(process.cwd(), "docs", "screenshots")
const PORT = 3200
const MAX_HEIGHT = 4500

/** Flat UI quantizes to 256 colours with no visible loss and a third of the bytes. Skipped without ImageMagick. */
function shrink(file: string) {
  const r = spawnSync("magick", [file, "-strip", "-dither", "None", "-colors", "256", `PNG8:${file}`], { stdio: "ignore" })
  if (r.error) return
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
          // Full page, capped so very long tables (every MP's ballot) stay a reasonable size in git.
          const height = await page.evaluate(() => document.documentElement.scrollHeight)
          await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width, height: Math.min(height, MAX_HEIGHT) } })
          shrink(file)
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
