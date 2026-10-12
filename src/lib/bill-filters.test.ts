import { describe, expect, it } from "vitest"
import type { LIBill } from "../../scripts/ingest/types"
import { normalizeBill } from "../../scripts/ingest/normalize/bills"
import { fixture } from "../../tests/helpers/fixtures"
import { DEFAULT_BILL_FILTERS, filterBills, readBillFilters } from "./bill-filters"
import type { BillListItem } from "./queries"

// Build list items from the real LEGISinfo detail fixtures.
const items: BillListItem[] = ["C-4", "C-39", "C-218", "S-228", "S-1001"].map((n) => {
  const { bill, stages } = normalizeBill(fixture<LIBill[]>(`legisinfo/bill-${n}.json`)[0], "2026-10-12")
  return {
    ...bill,
    title: bill.titleEn,
    titleFr: bill.titleFr,
    shortTitle: bill.shortTitleEn,
    shortTitleFr: bill.shortTitleFr,
    sponsorMemberId: null,
    sponsorPartyId: n === "C-218" ? "conservative" : n.startsWith("C") ? "liberal" : null,
    tldr: null,
    stages: stages.map((s) => ({ chamber: s.chamber, state: s.state, key: s.stageKey })),
  }
})
const run = (p: Record<string, string>) => filterBills(items, readBillFilters(p)).map((b) => b.number)

describe("filterBills", () => {
  it("sorts by last activity by default", () => {
    const dates = filterBills(items, DEFAULT_BILL_FILTERS).map((b) => b.lastActivityDate ?? "")
    expect([...dates].sort().reverse()).toEqual(dates)
  })
  it("finds bills by number in any common spelling", () => {
    expect(run({ q: "c39" })).toEqual(["C-39"])
    expect(run({ q: "C 4" })).toEqual(["C-4"])
    expect(run({ q: "s-1001" })).toEqual(["S-1001"])
  })
  it("searches title words, ignoring accents and case", () => {
    expect(run({ q: "affordable canadians" })).toEqual(["C-4"])
    expect(run({ q: "nothing-matches-this" })).toEqual([])
  })
  it("filters by stage, chamber, type, party and law", () => {
    expect(run({ stage: "law" }).sort()).toEqual(["C-4", "S-1001", "S-228"])
    expect(run({ stage: "defeated" })).toEqual(["C-218"])
    expect(run({ stage: "house:committee" })).toEqual(["C-39"])
    expect(run({ stage: "house" })).toEqual(["C-39"])
    expect(run({ chamber: "senate" }).sort()).toEqual(["S-1001", "S-228"])
    expect(run({ type: "private_member" })).toEqual(["C-218"])
    expect(run({ party: "liberal" }).sort()).toEqual(["C-39", "C-4"])
    expect(run({ law: "no" }).sort()).toEqual(["C-218", "C-39"])
  })
  it("sorts by number with C before S and numeric order", () => {
    expect(run({ sort: "number" })).toEqual(["C-4", "C-39", "C-218", "S-228", "S-1001"])
  })
  it("ignores an unknown sort value", () => {
    expect(readBillFilters({ sort: "bogus" }).sort).toBe("activity")
  })
})
