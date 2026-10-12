import type { MemberListItem } from "./queries"

export interface MemberFilters {
  q: string
  party: string
  province: string
  status: string // "current" (default) | "former" | "all"
  sort: string // "name" | "party-line" | "attendance" | "dissent" | "bills"
}

export const DEFAULT_MEMBER_FILTERS: MemberFilters = { q: "", party: "", province: "", status: "current", sort: "name" }

export function readMemberFilters(p: Record<string, string>): MemberFilters {
  return {
    q: p.q ?? "",
    party: p.party ?? "",
    province: p.province ?? "",
    status: ["current", "former", "all"].includes(p.status ?? "") ? p.status! : "current",
    sort: ["name", "party-line", "attendance", "dissent", "bills"].includes(p.sort ?? "") ? p.sort! : "name",
  }
}

function normalize(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
}

const nameKey = (m: MemberListItem) => normalize(`${m.familyName ?? m.name} ${m.givenName ?? ""}`)

export function filterMembers(members: MemberListItem[], f: MemberFilters): MemberListItem[] {
  const terms = normalize(f.q).split(/\s+/).filter(Boolean)
  const out = members.filter((m) => {
    if (f.status === "current" && !m.active) return false
    if (f.status === "former" && m.active) return false
    if (f.party && m.partyId !== f.party) return false
    if (f.province && m.province !== f.province) return false
    if (terms.length) {
      const hay = normalize(`${m.name} ${m.ridingName ?? ""}`)
      if (!terms.every((t) => hay.includes(t))) return false
    }
    return true
  })
  // Members without a figure always sort last, whichever direction.
  const num = (v: number | null) => (v === null ? -Infinity : v)
  return out.sort((a, b) => {
    switch (f.sort) {
      case "party-line":
        return num(b.partyLineRate) - num(a.partyLineRate) || nameKey(a).localeCompare(nameKey(b))
      case "attendance":
        return num(b.attendanceRate) - num(a.attendanceRate) || nameKey(a).localeCompare(nameKey(b))
      case "dissent":
        return b.dissentCount - a.dissentCount || nameKey(a).localeCompare(nameKey(b))
      case "bills":
        return b.billsSponsored - a.billsSponsored || nameKey(a).localeCompare(nameKey(b))
      default:
        return nameKey(a).localeCompare(nameKey(b))
    }
  })
}
