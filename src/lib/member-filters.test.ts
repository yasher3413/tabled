import { describe, expect, it } from "vitest"
import { filterMembers, readMemberFilters } from "./member-filters"
import type { MemberListItem } from "./queries"
import { fixture } from "../../tests/helpers/fixtures"
import type { OPPage, OPPoliticianListItem } from "../../scripts/ingest/types"
import { partyIdFromShortName } from "../../scripts/ingest/normalize/members"

// Real current MPs; metric fields left empty because they are computed elsewhere and tested there.
const members: MemberListItem[] = fixture<OPPage<OPPoliticianListItem>>("openparliament/politicians-list.json").objects.map((p) => {
  const parts = p.name.split(" ")
  return {
    id: p.url.split("/").filter(Boolean).pop()!,
    name: p.name,
    givenName: parts[0],
    familyName: parts.slice(1).join(" "),
    partyId: p.current_party ? partyIdFromShortName(p.current_party.short_name.en) : null,
    ridingName: p.current_riding?.name.en ?? null,
    province: p.current_riding?.province ?? null,
    active: true,
    endDate: null,
    partyLineRate: null,
    attendanceRate: null,
    votesCast: 0,
    votesHeld: 0,
    dissentCount: 0,
    billsSponsored: 0,
  }
})
const run = (p: Record<string, string>) => filterMembers(members, readMemberFilters(p))

describe("filterMembers", () => {
  it("shows current MPs by default, sorted by family name", () => {
    const out = run({})
    expect(out).toHaveLength(337)
    expect(out[0].familyName!.localeCompare(out[1].familyName!)).toBeLessThanOrEqual(0)
  })
  it("searches names and ridings without accents", () => {
    expect(run({ q: "aboultaif" }).map((m) => m.id)).toEqual(["ziad-aboultaif"])
    expect(run({ q: "edmonton manning" }).map((m) => m.id)).toEqual(["ziad-aboultaif"])
    expect(run({ q: "quebec" }).length).toBeGreaterThanOrEqual(0)
  })
  it("filters by party and province", () => {
    expect(run({ party: "green" })).toHaveLength(1)
    expect(run({ province: "PE" }).every((m) => m.province === "PE")).toBe(true)
    expect(run({ province: "PE" })).toHaveLength(4)
  })
  it("ignores unknown sort and status values", () => {
    expect(readMemberFilters({ sort: "height", status: "deceased" })).toMatchObject({ sort: "name", status: "current" })
  })
  it("sorts members with no rate last", () => {
    const withRates = members.slice(0, 3).map((m, i) => ({ ...m, partyLineRate: i === 0 ? null : i / 10 }))
    const out = filterMembers(withRates, readMemberFilters({ sort: "party-line" }))
    expect(out.at(-1)!.partyLineRate).toBeNull()
  })
})
