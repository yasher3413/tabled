import { describe, expect, it } from "vitest"
import { fixture } from "../../tests/helpers/fixtures"
import { normalizeVote } from "../../scripts/ingest/normalize/votes"
import type { OPPage, OPVoteListItem } from "../../scripts/ingest/types"
import { filterVotes, readVoteFilters, voteMonths } from "./vote-filters"
import type { VoteListItem } from "./queries"

const votes: VoteListItem[] = fixture<OPPage<OPVoteListItem>>("openparliament/votes-list.json").objects.map((o) => {
  const v = normalizeVote(o)
  return { ...v, hasPartySplit: v.number === 177, billNumber: v.billId?.split("/")[1] ?? null, billShortTitle: null, billSession: v.billId ? "45-1" : null }
})
const run = (p: Record<string, string>) => filterVotes(votes, readVoteFilters(p)).map((v) => v.number)

describe("filterVotes", () => {
  it("finds a vote by number or bill", () => {
    expect(run({ q: "178" })).toEqual([178])
    expect(run({ q: "C-39" })).toContain(178)
  })
  it("filters by result, kind, split and month", () => {
    expect(votes.filter((v) => v.result === "failed").length).toBe(run({ result: "failed" }).length)
    expect(run({ kind: "bill" }).every((n) => votes.find((v) => v.number === n)!.billId)).toBe(true)
    expect(run({ kind: "other" }).every((n) => !votes.find((v) => v.number === n)!.billId)).toBe(true)
    expect(run({ split: "yes" })).toEqual([177])
    expect(run({ month: "2026-10" }).length).toBeGreaterThan(0)
  })
  it("rejects malformed params", () => {
    expect(readVoteFilters({ result: "maybe", month: "October" })).toMatchObject({ result: "", month: "" })
  })
  it("lists months newest first", () => {
    const m = voteMonths(votes)
    expect([...m].sort().reverse()).toEqual(m)
  })
})
