import type { BallotValue } from "./normalize/votes"

export interface BallotInput {
  voteId: string
  memberId: string
  ballot: BallotValue
  partyId: string | null
}

export type Majority = "yea" | "nay" | "tie" | "none"

export interface PartyVoteStat {
  voteId: string
  partyId: string
  yeas: number
  nays: number
  paired: number
  absent: number
  majority: Majority
  isSplit: boolean
  dissentCount: number
}

/** Parties whose members do not vote as a bloc; excluded from party-line math. */
const NON_PARTIES = new Set(["independent"])

/** A party position needs at least this many yea/nay votes to count; a lone MP cannot break with themselves. */
export const MIN_PARTY_VOTERS = 2

const key = (voteId: string, partyId: string) => `${voteId}\u0000${partyId}`

export function computePartyStats(ballots: BallotInput[]): Map<string, PartyVoteStat> {
  const stats = new Map<string, PartyVoteStat>()
  for (const b of ballots) {
    if (!b.partyId) continue
    const k = key(b.voteId, b.partyId)
    let s = stats.get(k)
    if (!s) {
      s = { voteId: b.voteId, partyId: b.partyId, yeas: 0, nays: 0, paired: 0, absent: 0, majority: "none", isSplit: false, dissentCount: 0 }
      stats.set(k, s)
    }
    if (b.ballot === "yea") s.yeas++
    else if (b.ballot === "nay") s.nays++
    else if (b.ballot === "paired") s.paired++
    else s.absent++
  }
  for (const s of stats.values()) {
    s.majority = s.yeas === 0 && s.nays === 0 ? "none" : s.yeas > s.nays ? "yea" : s.nays > s.yeas ? "nay" : "tie"
    s.isSplit = s.yeas > 0 && s.nays > 0
    s.dissentCount = s.majority === "yea" ? s.nays : s.majority === "nay" ? s.yeas : 0
  }
  return stats
}

function hasPartyPosition(s: PartyVoteStat | undefined): s is PartyVoteStat & { majority: "yea" | "nay" } {
  return (
    !!s &&
    !NON_PARTIES.has(s.partyId) &&
    (s.majority === "yea" || s.majority === "nay") &&
    s.yeas + s.nays >= MIN_PARTY_VOTERS
  )
}

/** True when a yea/nay ballot went against the MP's party majority on that vote. */
export function isDissent(b: BallotInput, stats: Map<string, PartyVoteStat>): boolean {
  if (!b.partyId || (b.ballot !== "yea" && b.ballot !== "nay")) return false
  const s = stats.get(key(b.voteId, b.partyId))
  return hasPartyPosition(s) && b.ballot !== s.majority
}

/** Vote ids where at least one real party split (members voted both ways): possible free votes. */
export function splitVotes(stats: Map<string, PartyVoteStat>): Set<string> {
  const out = new Set<string>()
  for (const s of stats.values()) {
    if (!NON_PARTIES.has(s.partyId) && s.isSplit) out.add(s.voteId)
  }
  return out
}

export interface MemberVoteStats {
  memberId: string
  votesHeld: number
  votesCast: number
  votesPaired: number
  partyLineEligible: number
  partyLineVotes: number
  dissentCount: number
  partyLineRate: number | null
  attendanceRate: number | null
}

/**
 * Per-MP metrics. `votesHeld` counts recorded votes while the MP was sitting (openparliament lists
 * every sitting MP on each vote, including those who did not vote). Paired and absent ballots are
 * excluded from party-line math.
 */
export function computeMemberStats(
  ballots: BallotInput[],
  stats: Map<string, PartyVoteStat>,
): Map<string, MemberVoteStats> {
  const out = new Map<string, MemberVoteStats>()
  for (const b of ballots) {
    let m = out.get(b.memberId)
    if (!m) {
      m = { memberId: b.memberId, votesHeld: 0, votesCast: 0, votesPaired: 0, partyLineEligible: 0, partyLineVotes: 0, dissentCount: 0, partyLineRate: null, attendanceRate: null }
      out.set(b.memberId, m)
    }
    m.votesHeld++
    if (b.ballot === "paired") m.votesPaired++
    if (b.ballot !== "yea" && b.ballot !== "nay") continue
    m.votesCast++
    const s = b.partyId ? stats.get(key(b.voteId, b.partyId)) : undefined
    if (!hasPartyPosition(s)) continue
    m.partyLineEligible++
    if (b.ballot === s.majority) m.partyLineVotes++
    else m.dissentCount++
  }
  for (const m of out.values()) {
    m.partyLineRate = m.partyLineEligible ? m.partyLineVotes / m.partyLineEligible : null
    m.attendanceRate = m.votesHeld ? m.votesCast / m.votesHeld : null
  }
  return out
}

/** Average party-line rate of a party's members who have a rate. */
export function partyCohesion(rates: Array<number | null>): number | null {
  const valid = rates.filter((r): r is number => r !== null)
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null
}
