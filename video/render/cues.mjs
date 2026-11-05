// Writes data/cues.json from src/cues.js so the score (audio/score.py) sits on the picture's exact grid.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { C, BPM, DURATION, FPS } from "../src/cues.js"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const D = JSON.parse(fs.readFileSync(path.join(root, "data/film.json"), "utf8"))
const out = { bpm: BPM, duration: DURATION, fps: FPS, cues: C, ledgerRows: Math.min(10, D.recentVotes.length), partyRows: D.vote.partyStats.length }
fs.writeFileSync(path.join(root, "data/cues.json"), JSON.stringify(out, null, 1))
console.log("wrote data/cues.json")
