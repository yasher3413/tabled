import { describe, expect, it } from "vitest"
import { fixture } from "../../tests/helpers/fixtures"
import type { OPBallot, OPPage, OPPoliticianListItem, OPVoteListItem } from "./types"
import { normalizeBallot, normalizeVote, ballotValue, billIdFromUrl, voteResult } from "./normalize/votes"
import { partyIdFromShortName } from "./normalize/members"
import {
  computeMemberStats,
  computePartyStats,
  isDissent,
  partyCohesion,
  splitVotes,
  type BallotInput,
} from "./metrics"

// Party per MP from the real current-MP list; matches party at time for these recent votes.
const pols = fixture<OPPage<OPPoliticianListItem>>("openparliament/politicians-list.json").objects
const partyOf = new Map(
  pols.map((p) => [p.url.split("/").filter(Boolean).pop()!, p.current_party ? partyIdFromShortName(p.current_party.short_name.en) : null]),
)

function realBallots(n: number): BallotInput[] {
  return fixture<OPPage<OPBallot>>(`openparliament/ballots-${n}.json`).objects.map((b) => {
    const nb = normalizeBallot(b)
    return { voteId: nb.voteId, memberId: nb.memberId, ballot: nb.ballot, partyId: partyOf.get(nb.memberId) ?? null }
  })
}

describe("dedupeBallots", () => {
  it("keeps the first ballot when an MP appears twice on a vote", async () => {
    const { dedupeBallots } = await import("./normalize/votes")
    const real = realBallots(178)
    const doubled = [...real, real[0]]
    const r = dedupeBallots(doubled)
    expect(r.ballots).toHaveLength(real.length)
    expect(r.dropped).toEqual([real[0]])
  })
})

describe("vote normalization", () => {
  it("normalizes a real vote", () => {
    const v = fixture<OPVoteListItem>("openparliament/vote-178.json")
    expect(normalizeVote(v)).toMatchObject({
      id: "45-1/178",
      billId: "45-1/C-39",
      result: "passed",
      yeas: 296,
      nays: 26,
      paired: 10,
      date: "2026-10-08",
    })
  })
  it("maps results and ballots, rejecting unknown values", () => {
    expect(voteResult("Failed")).toBe("failed")
    expect(voteResult("Agreed To")).toBe("passed")
    expect(ballotValue("Didn't vote")).toBe("absent")
    expect(() => ballotValue("Maybe")).toThrow()
    expect(billIdFromUrl(null)).toBeNull()
  })
  it("ballot totals match the vote totals", () => {
    const b = realBallots(178)
    expect(b.filter((x) => x.ballot === "yea")).toHaveLength(296)
    expect(b.filter((x) => x.ballot === "nay")).toHaveLength(26)
    expect(b.filter((x) => x.ballot === "paired")).toHaveLength(10)
  })
})

describe("party stats on real votes", () => {
  it("reproduces openparliament party positions for vote 178 (no dissent)", () => {
    const stats = computePartyStats(realBallots(178))
    const get = (p: string) => stats.get(`45-1/178\u0000${p}`)!
    expect(get("conservative").majority).toBe("yea")
    expect(get("liberal").majority).toBe("yea")
    expect(get("bloc").majority).toBe("nay")
    expect(get("ndp").majority).toBe("nay")
    expect([...stats.values()].every((s) => s.dissentCount === 0)).toBe(true)
    expect(splitVotes(stats).size).toBe(0)
  })

  it("matches House of Commons caucus totals for vote 178", () => {
    const stats = computePartyStats(realBallots(178))
    // From tests/fixtures/ourcommons/vote-178.xml: Liberal 172 recorded, Conservative 134.
    const lib = stats.get("45-1/178\u0000liberal")!
    const con = stats.get("45-1/178\u0000conservative")!
    expect(lib.yeas + lib.nays + lib.paired).toBe(172)
    expect(con.yeas + con.nays + con.paired).toBe(134)
  })

  it("finds the Liberal split on vote 177 and flags dissenters", () => {
    const ballots = realBallots(177)
    const stats = computePartyStats(ballots)
    const lib = stats.get("45-1/177\u0000liberal")!
    expect(lib.majority).toBe("nay") // openparliament: Liberal "No", disagreement 1.2%
    expect(lib.isSplit).toBe(true)
    expect(lib.dissentCount).toBe(lib.yeas)
    expect(lib.dissentCount / (lib.yeas + lib.nays)).toBeCloseTo(0.0119, 3)
    expect(splitVotes(stats).has("45-1/177")).toBe(true)
    const dissenters = ballots.filter((b) => isDissent(b, stats))
    expect(dissenters).toHaveLength(lib.dissentCount)
    expect(dissenters.every((d) => d.partyId === "liberal" && d.ballot === "yea")).toBe(true)
  })
})

describe("member stats", () => {
  it("excludes paired and absent ballots from party-line math but counts them as held", () => {
    const ballots = [...realBallots(177), ...realBallots(178)]
    const stats = computeMemberStats(ballots, computePartyStats(ballots))
    for (const m of stats.values()) {
      expect(m.votesHeld).toBe(2)
      expect(m.partyLineEligible).toBeLessThanOrEqual(m.votesCast)
      expect(m.partyLineVotes + m.dissentCount).toBe(m.partyLineEligible)
    }
    const absentees = ballots.filter((b) => b.ballot === "absent").map((b) => b.memberId)
    for (const id of absentees) expect(stats.get(id)!.votesCast).toBeLessThan(2)
  })

  it("gives the sole Green MP no party-line rate (a party of one cannot dissent)", () => {
    const ballots = [...realBallots(177), ...realBallots(178)]
    const stats = computeMemberStats(ballots, computePartyStats(ballots))
    const green = [...partyOf].filter(([, p]) => p === "green").map(([id]) => id)
    expect(green).toHaveLength(1)
    expect(stats.get(green[0])!.partyLineRate).toBeNull()
  })

  it("handles ties and independents (edge cases not present in recorded votes)", () => {
    const ballots: BallotInput[] = [
      { voteId: "v", memberId: "a", ballot: "yea", partyId: "x" },
      { voteId: "v", memberId: "b", ballot: "nay", partyId: "x" },
      { voteId: "v", memberId: "c", ballot: "nay", partyId: "independent" },
      { voteId: "v", memberId: "d", ballot: "yea", partyId: "independent" },
    ]
    const ps = computePartyStats(ballots)
    expect(ps.get("v\u0000x")!.majority).toBe("tie")
    expect(ballots.some((b) => isDissent(b, ps))).toBe(false)
    expect(splitVotes(ps).size).toBe(1)
    const ms = computeMemberStats(ballots, ps)
    expect(ms.get("a")!.partyLineRate).toBeNull()
    expect(ms.get("c")!.partyLineRate).toBeNull()
    expect(ms.get("c")!.attendanceRate).toBe(1)
  })

  it("averages cohesion over members with a rate", () => {
    expect(partyCohesion([1, 0.5, null])).toBe(0.75)
    expect(partyCohesion([null])).toBeNull()
  })
})
