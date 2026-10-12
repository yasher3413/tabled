import { describe, expect, it } from "vitest"
import { fixture } from "../../tests/helpers/fixtures"
import { formatPostal, isValidPostal, normalizePostal, postalError } from "./postal"
import { federalRidings, type RepresentPostcode } from "./represent"

describe("postal codes", () => {
  it("accepts real formats with or without spaces and case", () => {
    expect(isValidPostal("K1A 0A6")).toBe(true)
    expect(isValidPostal("k1a0a6")).toBe(true)
    expect(isValidPostal("T0L-0K0")).toBe(true)
    expect(normalizePostal(" k1a 0a6 ")).toBe("K1A0A6")
    expect(formatPostal("k1a0a6")).toBe("K1A 0A6")
  })
  it("rejects letters Canada Post never uses", () => {
    expect(isValidPostal("D1A 0A6")).toBe(false) // D never used
    expect(isValidPostal("W1A 0A6")).toBe(false) // W never first
    expect(isValidPostal("K1O 0A6")).toBe(false) // O never used
    expect(isValidPostal("12345")).toBe(false)
  })
  it("explains what is wrong", () => {
    expect(postalError("")).toMatch(/Enter/)
    expect(postalError("K1A")).toMatch(/six characters/)
    expect(postalError("D1A0A6")).toMatch(/doesn't look like/)
    expect(postalError("K1A 0A6")).toBeNull()
  })
})

describe("federalRidings", () => {
  it("maps a downtown Ottawa code to Ottawa Centre and its MP", () => {
    const r = federalRidings(fixture<RepresentPostcode>("represent/postcode-K1A0A6.json"))
    expect(r).toHaveLength(1)
    expect(r[0].ridingName).toBe("Ottawa Centre")
    expect(r[0].representativeName).toBe("Yasir Naqvi")
    expect(r[0].parlMpId).toBeGreaterThan(0)
  })
  it("uses the 2023 map, not Represent's default (2013) federal set", () => {
    const r = federalRidings(fixture<RepresentPostcode>("represent/postcode-K0A1L0.json"))
    expect(r.map((x) => x.ridingName)).toEqual(["Carleton"])
    expect(r[0].parlMpId).toBe(122850)
  })
  it("lists every riding when a code spans more than one", () => {
    const base = fixture<RepresentPostcode>("represent/postcode-K0A1L0.json")
    // Represent reports extra ridings for split codes in the concordance lists.
    const split: RepresentPostcode = {
      ...base,
      boundaries_concordance: [{ name: "Kanata", related: { boundary_set_url: "/boundary-sets/federal-electoral-districts-2023-representation-order/" } }],
    }
    expect(federalRidings(split).map((x) => x.ridingName).sort()).toEqual(["Carleton", "Kanata"])
  })
})
