// Runs before `next build`: ingests live data when the SQLite database is missing.
import { existsSync } from "node:fs"
import { spawnSync } from "node:child_process"
import path from "node:path"

const dbPath = path.join(process.cwd(), "data", "tabled.db")
const ingestEntry = path.join(process.cwd(), "scripts", "ingest", "index.ts")

if (existsSync(dbPath)) {
  console.log(`[ensure-db] Using existing ${path.relative(process.cwd(), dbPath)}`)
} else if (!existsSync(ingestEntry)) {
  console.log("[ensure-db] No database and no ingest script yet, skipping")
} else {
  console.log("[ensure-db] No database found, running full ingest")
  const result = spawnSync("pnpm", ["ingest"], { stdio: "inherit" })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
