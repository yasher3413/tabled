import type { BillListItem } from "./queries"

export interface BillFilters {
  q: string
  stage: string // "" | stage key | "law" | "defeated" | "house" | "senate"
  chamber: string // "" | "house" | "senate"  (chamber of origin)
  type: string // "" | bill type
  party: string // "" | sponsor party id
  law: string // "" | "yes" | "no"
  sort: string // "activity" | "introduced" | "number"
}

export const DEFAULT_BILL_FILTERS: BillFilters = { q: "", stage: "", chamber: "", type: "", party: "", law: "", sort: "activity" }

export function readBillFilters(p: Record<string, string>): BillFilters {
  return {
    q: p.q ?? "",
    stage: p.stage ?? "",
    chamber: p.chamber ?? "",
    type: p.type ?? "",
    party: p.party ?? "",
    law: p.law ?? "",
    sort: ["activity", "introduced", "number"].includes(p.sort ?? "") ? p.sort! : "activity",
  }
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

/** "c5", "C 5", "c-05" all mean C-5. */
function billNumberQuery(q: string): string | null {
  const m = /^\s*([cs])\s*-?\s*0*(\d+)\s*$/i.exec(q)
  return m ? `${m[1].toUpperCase()}-${m[2]}` : null
}

export function matchesStage(b: BillListItem, stage: string): boolean {
  if (!stage) return true
  if (stage === "law") return b.isLaw
  if (stage === "defeated") return b.isDefeated
  const live = !b.isLaw && !b.isDefeated
  if (stage === "house" || stage === "senate") return live && b.currentStage.startsWith(`${stage}:`)
  return b.currentStage === stage
}

export function filterBills(bills: BillListItem[], f: BillFilters): BillListItem[] {
  const num = billNumberQuery(f.q)
  const terms = normalize(f.q).split(/\s+/).filter(Boolean)
  const out = bills.filter((b) => {
    if (num) {
      if (b.number !== num) return false
    } else if (terms.length) {
      const hay = normalize([b.number, b.shortTitle ?? "", b.title, b.tldr ?? "", b.sponsorName ?? ""].join(" "))
      if (!terms.every((t) => hay.includes(t))) return false
    }
    if (!matchesStage(b, f.stage)) return false
    if (f.chamber && b.chamber !== f.chamber) return false
    if (f.type && b.type !== f.type) return false
    if (f.party && b.sponsorPartyId !== f.party) return false
    if (f.law === "yes" && !b.isLaw) return false
    if (f.law === "no" && b.isLaw) return false
    return true
  })
  const byNumber = (a: BillListItem, b: BillListItem) =>
    a.numberPrefix.localeCompare(b.numberPrefix) || a.numberInt - b.numberInt
  return out.sort((a, b) => {
    if (f.sort === "number") return byNumber(a, b)
    const key = f.sort === "introduced" ? "introducedDate" : "lastActivityDate"
    return (b[key] ?? "").localeCompare(a[key] ?? "") || byNumber(a, b)
  })
}
