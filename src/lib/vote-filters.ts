import type { VoteListItem } from "./queries"

export interface VoteFilters {
  q: string
  result: string // "" | passed | failed | tied
  kind: string // "" | bill | other
  split: string // "" | "yes"
  month: string // "" | YYYY-MM
}

export const DEFAULT_VOTE_FILTERS: VoteFilters = { q: "", result: "", kind: "", split: "", month: "" }

export function readVoteFilters(p: Record<string, string>): VoteFilters {
  return {
    q: p.q ?? "",
    result: ["passed", "failed", "tied"].includes(p.result ?? "") ? p.result! : "",
    kind: ["bill", "other"].includes(p.kind ?? "") ? p.kind! : "",
    split: p.split === "yes" ? "yes" : "",
    month: /^\d{4}-\d{2}$/.test(p.month ?? "") ? p.month! : "",
  }
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

export function filterVotes(votes: VoteListItem[], f: VoteFilters): VoteListItem[] {
  const terms = normalize(f.q).split(/\s+/).filter(Boolean)
  const asNumber = /^\d+$/.test(f.q.trim()) ? Number(f.q.trim()) : null
  return votes.filter((v) => {
    if (asNumber !== null) {
      if (v.number !== asNumber) return false
    } else if (terms.length) {
      const hay = normalize(`${v.descriptionEn} ${v.billNumber ?? ""} ${v.billShortTitle ?? ""}`)
      if (!terms.every((t) => hay.includes(t))) return false
    }
    if (f.result && v.result !== f.result) return false
    if (f.kind === "bill" && !v.billId) return false
    if (f.kind === "other" && v.billId) return false
    if (f.split === "yes" && !v.hasPartySplit) return false
    if (f.month && !v.date.startsWith(f.month)) return false
    return true
  })
}

export function voteMonths(votes: VoteListItem[]): string[] {
  return [...new Set(votes.map((v) => v.date.slice(0, 7)))].sort().reverse()
}
