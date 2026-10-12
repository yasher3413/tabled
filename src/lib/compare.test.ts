import { describe, expect, it } from "vitest"
import { fixture } from "../../tests/helpers/fixtures"
import { normalizeBallot } from "../../scripts/ingest/normalize/votes"
import type { OPBallot, OPPage } from "../../scripts/ingest/types"
import { compactBallot, compareBallots, type CompactBallot } from "./compare"

// Real ballots from votes 177 and 178, keyed by MP.
const byMp: Record<string, Record<string, CompactBallot>> = {}
for (const n of [178, 177]) {
  for (const raw of fixture<OPPage<OPBallot>>(`openparliament/ballots-${n}.json`).objects) {
    const b = normalizeBallot(raw)
    ;(byMp[b.memberId] ??= {})[b.voteId] = compactBallot(b.ballot)
  }
}
const order = ["45-1/178", "45-1/177"]

describe("compareBallots", () => {
  it("counts agreement only where both cast a yea or nay", () => {
    const r = compareBallots(byMp["ziad-aboultaif"], byMp["scott-aitchison"], order)
    expect(r.bothSitting).toBe(2)
    expect(r.agreement).toBe(r.bothVoted ? r.agreed / r.bothVoted : null)
    expect(r.agreed + r.disagreements.length).toBe(r.bothVoted)
  })
  it("finds real disagreement across parties on vote 177", () => {
    // Vote 177 split Conservatives (yea) from most Liberals (nay).
    const con = byMp["ziad-aboultaif"]
    const lib = Object.entries(byMp).find(([, v]) => v["45-1/177"] === "n" && v["45-1/178"] === "y")!
    const r = compareBallots(con, lib[1], order)
    expect(r.disagreements).toContain("45-1/177")
  })
  it("returns no rate when the two never both voted", () => {
    expect(compareBallots({ x: "a" }, { x: "y" }, ["x"]).agreement).toBeNull()
    expect(compareBallots({}, {}, []).bothSitting).toBe(0)
  })
})
