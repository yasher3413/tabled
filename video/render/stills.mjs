// Stills for review: node render/stills.mjs <outDir> <t1> <t2> ... [--sub 4] [--sheet name --cols 4]
// Times may be ranges a:b:step. Writes PNGs named by time; with --sheet, also a contact sheet via ffmpeg.
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { serve } from "./server.mjs"

const require = createRequire(import.meta.url)
const { chromium } = require("playwright")

const args = process.argv.slice(2)
const out = args.shift()
let sub = 1, sheet = null, cols = 4, scale = 1
const times = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--sub") sub = +args[++i]
  else if (args[i] === "--sheet") sheet = args[++i]
  else if (args[i] === "--cols") cols = +args[++i]
  else if (args[i] === "--scale") scale = +args[++i]
  else if (args[i].includes(":")) {
    const [a, b, s] = args[i].split(":").map(Number)
    for (let t = a; t <= b + 1e-9; t += s) times.push(+t.toFixed(3))
  } else times.push(+args[i])
}
fs.mkdirSync(out, { recursive: true })
const { server, port } = await serve()
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
page.on("console", (m) => m.type() === "error" && console.error("page:", m.text()))
page.on("pageerror", (e) => console.error("pageerror:", e.message))
await page.goto(`http://127.0.0.1:${port}/`)
await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 })
const files = []
for (const t of times) {
  await page.evaluate(([f, n]) => window.renderFrame(f, n), [Math.round(t * 60), sub])
  const b64 = await page.evaluate(() => document.getElementById("c").toDataURL("image/png").split(",")[1])
  const f = path.join(out, `t${t.toFixed(2).padStart(6, "0")}.png`)
  fs.writeFileSync(f, Buffer.from(b64, "base64"))
  files.push(f)
}
await browser.close()
server.close()
if (sheet) {
  const rows = Math.ceil(files.length / cols)
  const w = Math.round(1920 * scale / 2) * 2, h = Math.round(1080 * scale / 2) * 2
  const inputs = files.flatMap((f) => ["-i", f])
  const filters = files.map((_, i) => `[${i}:v]scale=${w}:${h},drawtext=text='${times[i].toFixed(2)}':x=10:y=10:fontsize=${Math.round(28 * scale * 2)}:fontcolor=white:box=1:boxcolor=black@0.6[v${i}]`).join(";")
  const layout = files.map((_, i) => `${(i % cols) * w}_${Math.floor(i / cols) * h}`).join("|")
  const pad = files.length
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...inputs, "-filter_complex", `${filters};${files.map((_, i) => `[v${i}]`).join("")}xstack=inputs=${pad}:layout=${layout}:fill=black`, path.join(out, sheet)])
  console.log("sheet", path.join(out, sheet), `${cols}x${rows}`)
}
console.log("wrote", files.length, "frames to", out)
