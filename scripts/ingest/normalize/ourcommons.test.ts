import { describe, expect, it } from "vitest"
import { fixtureText } from "../../../tests/helpers/fixtures"
import { parseOCParticipants, parseOCVotes, totalsDiffer } from "./ourcommons"

describe("House of Commons XML", () => {
  it("parses the session vote list", () => {
    const votes = parseOCVotes(fixtureText("ourcommons/votes.xml"))
    const v = votes.find((x) => x.number === 178)!
    expect(v).toMatchObject({ id: "45-1/178", date: "2026-10-08", yeas: 296, nays: 26, paired: 10, billNumber: "C-39" })
    expect(votes.length).toBeGreaterThan(100)
  })

  it("parses per-member ballots with caucus", () => {
    const ps = parseOCParticipants(fixtureText("ourcommons/vote-178.xml"))
    expect(ps).toHaveLength(332)
    expect(ps.filter((p) => p.ballot === "yea")).toHaveLength(296)
    expect(ps.filter((p) => p.ballot === "paired")).toHaveLength(10)
    expect(ps.find((p) => p.personId === 89156)).toEqual({ personId: 89156, ballot: "yea", partyId: "conservative" })
    expect(new Set(ps.map((p) => p.partyId))).toEqual(new Set(["liberal", "conservative", "bloc", "ndp", "green"]))
  })

  it("detects disagreements in totals or date", () => {
    const a = { yeas: 1, nays: 2, paired: 0, date: "2026-01-01" }
    expect(totalsDiffer(a, { ...a })).toBe(false)
    expect(totalsDiffer(a, { ...a, date: "2026-01-02" })).toBe(true)
  })
})
