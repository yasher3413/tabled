import { describe, expect, it } from "vitest"
import { fixture } from "../../../tests/helpers/fixtures"
import type { OPPolitician } from "../types"
import { normalizePolitician, overlaps, partyIdFromShortName, partyRow, slugFromUrl } from "./members"

describe("party ids", () => {
  it("maps openparliament short names to stable ids", () => {
    expect(partyIdFromShortName("Conservative")).toBe("conservative")
    expect(partyIdFromShortName("Bloc")).toBe("bloc")
    expect(partyIdFromShortName("Bloc Québécois")).toBe("bloc")
    expect(partyIdFromShortName("NDP")).toBe("ndp")
    expect(partyIdFromShortName("Green")).toBe("green")
    expect(partyIdFromShortName("Independent")).toBe("independent")
  })
  it("fills French names for known parties and falls back for unknown ones", () => {
    expect(partyRow("Liberal").nameFr).toBe("Parti libéral du Canada")
    expect(partyRow("Rhinoceros", "Rhinoceros Party")).toMatchObject({
      id: "rhinoceros",
      nameEn: "Rhinoceros Party",
      colorToken: "party-other",
    })
  })
})

describe("normalizePolitician", () => {
  it("builds a member from a real openparliament record", () => {
    const p = fixture<OPPolitician>("openparliament/politician-ziad-aboultaif.json")
    const n = normalizePolitician(p, "2025-05-26", "2026-10-12")
    expect(slugFromUrl(p.url)).toBe("ziad-aboultaif")
    expect(n.member).toMatchObject({
      id: "ziad-aboultaif",
      parlMpId: 89156,
      partyId: "conservative",
      ridingId: "48018",
      province: "AB",
      active: true,
      photoUrl: null,
    })
    expect(n.ridings[0].nameEn).toBe("Edmonton Manning")
    expect(n.memberships.map((m) => m.url)).toContain("/politicians/memberships/4208/")
  })
})

describe("overlaps", () => {
  it("treats open-ended memberships as current", () => {
    expect(overlaps({ start_date: "2015-10-19", end_date: null }, "2025-05-26", "2026-10-12")).toBe(true)
    expect(overlaps({ start_date: "2011-05-02", end_date: "2015-08-02" }, "2025-05-26", "2026-10-12")).toBe(false)
  })
})
