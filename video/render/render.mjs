// Full render: node render/render.mjs [--workers 4] [--sub 4] [--from 0] [--to 3600]
// The film is encoded in half-second chunks (30 frames). Each chunk is written under a temporary name and renamed
// when complete, so a stopped render resumes by re-running this command: finished chunks are skipped.
// Then the chunks are concatenated, the soundtrack is muxed, and a post-ready copy and poster are made.
import { createRequire } from "node:module"
import fs from "node:fs"
import path from "node:path"
import { spawn, execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { serve } from "./server.mjs"
import { DURATION, FPS, C } from "../src/cues.js"

const require = createRequire(import.meta.url)
const { chromium } = require("playwright")
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const OUT = path.join(ROOT, "out")
const CH = path.join(OUT, "chunks")
fs.mkdirSync(CH, { recursive: true })

const arg = (k, d) => {
  const i = process.argv.indexOf(k)
  return i > 0 ? Number(process.argv[i + 1]) : d
}
const WORKERS = arg("--workers", 4)
const SUB = arg("--sub", 4)
const TOTAL = Math.round(DURATION * FPS)
const CHUNK = 30
const nChunks = Math.ceil(TOTAL / CHUNK)
const name = (k) => path.join(CH, `c${String(k).padStart(4, "0")}.mp4`)
const todo = []
for (let k = Math.floor(arg("--from", 0) / CHUNK); k < Math.min(nChunks, Math.ceil(arg("--to", TOTAL) / CHUNK)); k++) if (!fs.existsSync(name(k))) todo.push(k)
console.log(`${nChunks} chunks, ${todo.length} to render, ${WORKERS} workers, ${SUB} subframes`)

const { server, port } = await serve()
const t0 = Date.now()
let done = 0

async function worker(w) {
  const browser = await chromium.launch({ args: ["--disable-gpu"] })
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
  page.on("pageerror", (e) => console.error(`[w${w}] pageerror`, e.message))
  await page.goto(`http://127.0.0.1:${port}/`)
  await page.waitForFunction(() => window.ready === true, null, { timeout: 60000 })
  while (todo.length) {
    const k = todo.shift()
    const tmp = name(k).replace(".mp4", ".tmp.mp4")
    const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", "1920x1080", "-r", String(FPS), "-i", "-",
      "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
      "-x264-params", "keyint=30:min-keyint=30:scenecut=0", "-f", "mp4", tmp], { stdio: ["pipe", "inherit", "inherit"] })
    const closed = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c} on chunk ${k}`)))))
    for (let f = k * CHUNK; f < Math.min(TOTAL, (k + 1) * CHUNK); f++) {
      await page.evaluate(([f, n]) => window.renderFrame(f, n), [f, SUB])
      const b64 = await page.evaluate(() => window.grab())
      if (!ff.stdin.write(Buffer.from(b64, "base64"))) await new Promise((r) => ff.stdin.once("drain", r))
    }
    ff.stdin.end()
    await closed
    fs.renameSync(tmp, name(k))
    done++
    const el = (Date.now() - t0) / 1000
    if (done % 4 === 0 || !todo.length) console.log(`chunk ${k} done · ${done} this run · ${el.toFixed(0)} s · ~${((el / done) * todo.length / 60).toFixed(1)} min left`)
  }
  await browser.close()
}
await Promise.all(Array.from({ length: Math.min(WORKERS, todo.length) }, (_, w) => worker(w)))
server.close()

const all = Array.from({ length: nChunks }, (_, k) => name(k))
if (all.every((f) => fs.existsSync(f))) {
  fs.writeFileSync(path.join(OUT, "chunks.txt"), all.map((f) => `file '${f}'`).join("\n") + "\n")
  const audio = path.join(OUT, "audio.wav")
  if (!fs.existsSync(audio)) throw new Error("out/audio.wav missing: run python3 audio/score.py")
  const master = path.join(OUT, "tabled-film-master.mp4")
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", path.join(OUT, "chunks.txt"), "-i", audio,
    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", master], { stdio: "inherit" })
  const post = path.join(OUT, "tabled-film.mp4")
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", master, "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-pix_fmt", "yuv420p",
    "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", post], { stdio: "inherit" })
  // Poster: the still end card, decoded from the post copy.
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(C.still + 1.5), "-i", post, "-frames:v", "1", path.join(OUT, "tabled-film-poster.png")], { stdio: "inherit" })
  for (const f of [master, post]) console.log(path.basename(f), (fs.statSync(f).size / 1e6).toFixed(1), "MB")
} else console.log("some chunks missing; re-run to resume")
