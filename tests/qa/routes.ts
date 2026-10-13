import path from "node:path"
import Database from "better-sqlite3"
import { sampleRoutes } from "../../scripts/lib/sample-routes"
import { weekKey } from "../../src/lib/weeks"

/** Selects which special interactions run on a route, on top of the generic checks. */
export type RouteKind = "home" | "filters" | "detail" | "hemicycle" | "find" | "report" | "embed" | "not-found" | "plain"

export interface QaRoute {
  name: string
  path: string
  kind: RouteKind
  /** Same-origin responses with these statuses are expected here (not-found pages, the unknown postal code). */
  expectStatus?: number[]
}

function earlierWeek(): string {
  const db = new Database(path.join(process.cwd(), "data", "tabled.db"), { readonly: true })
  const dates = db.prepare("SELECT DISTINCT date d FROM votes WHERE session_id = (SELECT id FROM sessions WHERE is_current = 1) ORDER BY date DESC").all() as Array<{ d: string }>
  db.close()
  const weeks = [...new Set(dates.map((r) => weekKey(r.d)))]
  return weeks[1] ?? weeks[0]
}

function previousSession(): string | null {
  const db = new Database(path.join(process.cwd(), "data", "tabled.db"), { readonly: true })
  const row = db.prepare("SELECT id FROM sessions WHERE is_current = 0 ORDER BY id DESC LIMIT 1").get() as { id: string } | undefined
  db.close()
  return row?.id ?? null
}

const KIND: Record<string, RouteKind> = {
  home: "home",
  bills: "filters",
  votes: "filters",
  mps: "filters",
  "vote-detail": "hemicycle",
  "bill-detail": "detail",
  "mp-detail": "detail",
  find: "find",
  "embed-vote": "embed",
  "not-found": "not-found",
}

export function qaRoutes(): QaRoute[] {
  const seed = sampleRoutes().filter((r) => !r.name.startsWith("fr-"))
  const prev = previousSession()
  const en: QaRoute[] = seed.map((r) => ({ name: r.name, path: r.path, kind: KIND[r.name] ?? "plain", ...(r.name === "not-found" ? { expectStatus: [404] } : {}) }))
  const vote = seed.find((r) => r.name === "vote-detail")!.path
  en.push(
    ...(prev
      ? [
          { name: "bills-session", path: `/bills/${prev}`, kind: "filters" as const },
          { name: "votes-session", path: `/votes/${prev}`, kind: "filters" as const },
        ]
      : []),
    { name: "this-week-earlier", path: `/this-week/${earlierWeek()}`, kind: "plain" },
    { name: "mps-party", path: "/mps?party=conservative", kind: "filters" },
    { name: "find-postal", path: "/find?postal=K1A0A6", kind: "plain" },
    { name: "unknown-bill", path: "/bills/x/y", kind: "not-found" },
    { name: "unknown-mp", path: "/mps/nobody", kind: "not-found" },
  )
  const fr: QaRoute[] = en
    .filter((r) => r.kind !== "embed")
    .map((r) => ({ ...r, name: `fr-${r.name}`, path: r.path === "/" ? "/fr" : `/fr${r.path}` }))
  fr.push({ name: "fr-embed-vote", path: `/fr${vote.replace("/votes/", "/embed/votes/")}`, kind: "embed" })
  return [...en, ...fr]
}
