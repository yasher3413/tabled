import { readFileSync } from "node:fs"
import path from "node:path"

const ROOT = path.join(process.cwd(), "tests", "fixtures")

export function fixture<T = unknown>(rel: string): T {
  return JSON.parse(readFileSync(path.join(ROOT, rel), "utf8")) as T
}

export function fixtureText(rel: string): string {
  return readFileSync(path.join(ROOT, rel), "utf8")
}
