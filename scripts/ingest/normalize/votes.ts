import type { OPBallot, OPVoteListItem } from "../types"

export type BallotValue = "yea" | "nay" | "paired" | "absent"
export type VoteResult = "passed" | "failed" | "tied"

export function voteResult(raw: string): VoteResult {
  const r = raw.toLowerCase()
  if (r.includes("tie")) return "tied"
  if (r.startsWith("pass") || r.includes("agreed")) return "passed"
  if (r.startsWith("fail") || r.includes("negativ") || r.includes("defeat")) return "failed"
  throw new Error(`Unknown vote result: ${raw}`)
}

export function ballotValue(raw: string): BallotValue {
  switch (raw.toLowerCase()) {
    case "yes":
    case "yea":
      return "yea"
    case "no":
    case "nay":
      return "nay"
    case "paired":
      return "paired"
    case "didn't vote":
    case "didn’t vote":
      return "absent"
    default:
      throw new Error(`Unknown ballot: ${raw}`)
  }
}

/** "/bills/45-1/C-39/" -> "45-1/C-39" */
export function billIdFromUrl(url: string | null): string | null {
  const m = url ? /\/bills\/([^/]+)\/([^/]+)\/?$/.exec(url) : null
  return m ? `${m[1]}/${m[2]}` : null
}

export function normalizeVote(v: OPVoteListItem) {
  return {
    id: `${v.session}/${v.number}`,
    sessionId: v.session,
    number: v.number,
    date: v.date,
    descriptionEn: v.description.en,
    descriptionFr: v.description.fr ?? null,
    billId: billIdFromUrl(v.bill_url),
    result: voteResult(v.result),
    yeas: v.yea_total,
    nays: v.nay_total,
    paired: v.paired_total,
    sourceUrl: `https://openparliament.ca${v.url}`,
  }
}

export function normalizeBallot(b: OPBallot) {
  const m = /\/votes\/([^/]+)\/(\d+)\/?$/.exec(b.vote_url)
  if (!m) throw new Error(`Bad vote url ${b.vote_url}`)
  const parts = b.politician_url.split("/").filter(Boolean)
  return {
    voteId: `${m[1]}/${m[2]}`,
    memberId: parts[parts.length - 1],
    membershipUrl: b.politician_membership_url,
    ballot: ballotValue(b.ballot),
  }
}
