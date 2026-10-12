import { describe, expect, it } from "vitest"
import { fixture } from "../../../tests/helpers/fixtures"
import type { LIBill } from "../types"
import {
  billType,
  cleanLegisinfoSummary,
  currentStage,
  normalizeBill,
  normalizeStages,
  stageSlug,
  stripHtml,
} from "./bills"

const li = (n: string) => fixture<LIBill[]>(`legisinfo/bill-${n}.json`)[0]
const NOW = "2026-10-12T00:00:00Z"

describe("billType", () => {
  it("maps every LEGISinfo document type in the session list", () => {
    const list = fixture<LIBill[]>("legisinfo/bills-45-1.json")
    const types = new Set(list.map((b) => billType(b.BillDocumentTypeNameEn)))
    expect(types).toEqual(new Set(["government", "private_member", "senate_public", "senate_private"]))
  })
  it("treats Senate government bills as government bills", () => {
    expect(billType("Senate Government Bill")).toBe("government")
  })
  it("throws on unknown types instead of guessing", () => {
    expect(() => billType("Mystery Bill")).toThrow()
  })
})

describe("stageSlug", () => {
  it("normalizes LEGISinfo stage names", () => {
    expect(stageSlug("Consideration in committee")).toBe("committee")
    expect(stageSlug("Report stage")).toBe("report")
    expect(stageSlug("Something New")).toBe("something-new")
  })
})

describe("normalizeStages", () => {
  it("orders a House bill's stages House, then Senate, then royal assent", () => {
    const stages = normalizeStages(li("C-4"))
    expect(stages.map((s) => s.stageKey)).toEqual([
      "house:first-reading",
      "house:second-reading",
      "house:committee",
      "house:report",
      "house:third-reading",
      "senate:first-reading",
      "senate:second-reading",
      "senate:committee",
      "senate:third-reading",
      "crown:royal-assent",
    ])
    expect(stages.every((s) => s.state === "completed")).toBe(true)
    expect(stages.at(-1)?.date).toBe("2026-03-12")
  })

  it("orders a Senate bill's stages Senate first", () => {
    const stages = normalizeStages(li("S-228"))
    expect(stages[0].stageKey).toBe("senate:first-reading")
    expect(stages[0].date).toBe("2025-06-05")
    expect(stages[4].stageKey).toBe("house:first-reading")
  })

  it("marks exactly one in-progress stage for a live bill, filling missing Senate committee", () => {
    const stages = normalizeStages(li("C-39"))
    const current = stages.filter((s) => s.state === "in_progress")
    expect(current).toHaveLength(1)
    expect(current[0].stageKey).toBe("house:committee")
    expect(stages.some((s) => s.stageKey === "senate:committee")).toBe(true)
    expect(stages.filter((s) => s.state === "not_reached").every((s) => s.date === null)).toBe(true)
  })

  it("marks the failing stage of a defeated bill and nothing in progress", () => {
    const bill = li("C-218")
    const stages = normalizeStages(bill)
    expect(stages.find((s) => s.state === "defeated")?.stageKey).toBe("house:second-reading")
    expect(stages.some((s) => s.state === "in_progress")).toBe(false)
    expect(currentStage(stages, bill).key).toBe("defeated")
  })
})

describe("normalizeBill", () => {
  it("builds the bill row for a live government bill", () => {
    const { bill, sponsorParlId } = normalizeBill(li("C-39"), NOW)
    expect(bill).toMatchObject({
      id: "45-1/C-39",
      number: "C-39",
      numberInt: 39,
      chamber: "house",
      type: "government",
      shortTitleEn: "Building Canada Strong Act",
      introducedDate: "2026-09-21",
      currentStage: "house:committee",
      isLaw: false,
      legisinfoUrl: "https://www.parl.ca/legisinfo/en/bill/45-1/C-39",
      textUrl: "https://www.parl.ca/DocumentViewer/en/14226813",
      legislativeSummaryUrl: null,
    })
    expect(sponsorParlId).toBe(88468)
    expect(bill.lastActivityDate).toBe("2026-10-08")
  })

  it("records royal assent and the legislative summary link", () => {
    const { bill } = normalizeBill(li("C-4"), NOW)
    expect(bill.isLaw).toBe(true)
    expect(bill.royalAssentDate).toBe("2026-03-12")
    expect(bill.currentStage).toBe("crown:royal-assent")
    expect(bill.legislativeSummaryUrl).toMatch(/LegislativeSummaries\/451C4E$/)
    expect(bill.legisinfoSummaryText).toMatch(/^On 5 June 2025/)
  })

  it("handles a Senate private bill", () => {
    const { bill } = normalizeBill(li("S-1001"), NOW)
    expect(bill.type).toBe("senate_private")
    expect(bill.chamber).toBe("senate")
  })

  it("normalizes every bill in the session list without throwing", () => {
    const list = fixture<LIBill[]>("legisinfo/bills-45-1.json")
    for (const b of list) {
      const { bill } = normalizeBill(b, NOW)
      expect(bill.id).toMatch(/^45-1\/[CS]-\d+$/)
    }
  })
})

describe("summary text cleanup", () => {
  it("strips HTML and the placeholder sentence", () => {
    const text = cleanLegisinfoSummary(
      "<div>A legislative summary is currently being prepared for this bill by the Library. Meanwhile, the following executive summary is available.</div><p>Part 1 amends the Income Tax Act to reduce the lowest marginal rate for individuals in 2025.</p>",
    )
    expect(text).toBe("Part 1 amends the Income Tax Act to reduce the lowest marginal rate for individuals in 2025.")
  })
  it("returns null when only boilerplate is left", () => {
    expect(cleanLegisinfoSummary("<div>A legislative summary is currently being prepared for this bill.</div>")).toBeNull()
  })
  it("decodes common entities", () => {
    expect(stripHtml("a&nbsp;&amp;&nbsp;b")).toBe("a & b")
  })
})
