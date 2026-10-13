import { describe, expect, it } from "vitest"
import { sentences, validateSummary } from "./validator"

// A well-formed summary written for the test from C-4's official executive summary (tests/fixtures/legisinfo/bill-C-4.json).
const good = {
  tldr: "This bill lowers the lowest federal income tax rate, adds a GST rebate for first-time home buyers and ends the consumer fuel charge.",
  what_it_does: [
    "Cuts the tax rate on the lowest income bracket to 14.5% for 2025 and 14% from 2026.",
    "Creates a temporary GST rebate on new homes for first-time buyers.",
    "Repeals the part of the Greenhouse Gas Pollution Pricing Act that set the fuel charge.",
    "Changes the privacy policy rules political parties must follow under the Canada Elections Act.",
  ],
  who_it_affects: ["Income tax filers", "First-time home buyers", "Political parties"],
  background: "The government introduced the bill in June 2025.",
  source_basis: "legislative_summary",
}

describe("validateSummary", () => {
  it("accepts a neutral, well-formed summary", () => {
    const r = validateSummary(good)
    expect(r.errors).toEqual([])
    expect(r.ok).toBe(true)
  })
  it("rejects schema violations", () => {
    expect(validateSummary({ ...good, what_it_does: ["one"] }).ok).toBe(false)
    expect(validateSummary({ ...good, what_it_does: [] }).ok).toBe(false)
    expect(validateSummary({ ...good, source_basis: "vibes" }).ok).toBe(false)
    expect(validateSummary({ tldr: "x" }).ok).toBe(false)
  })
  it("allows a single bullet only for very short sources", () => {
    const one = { ...good, what_it_does: ["Repeals the Oil Tanker Moratorium Act."] }
    expect(validateSummary(one, { sourceChars: 229 }).ok).toBe(true)
    expect(validateSummary(one, { sourceChars: 20_000 }).ok).toBe(false)
  })
  it("enforces length limits", () => {
    const long = Array.from({ length: 31 }, () => "word").join(" ") + "."
    expect(validateSummary({ ...good, tldr: long }).errors.join()).toMatch(/31 words/)
    expect(validateSummary({ ...good, what_it_does: [...good.what_it_does, "a", "b", "c"] }).errors.join()).toMatch(/what_it_does/)
    expect(validateSummary({ ...good, background: "One. Two. Three." }).errors.join()).toMatch(/at most 2 sentences/)
    expect(validateSummary({ ...good, tldr: "It does this. It also does that." }).errors.join()).toMatch(/single sentence/)
  })
  it("catches loaded words on word boundaries only", () => {
    expect(validateSummary({ ...good, tldr: "A landmark bill that lowers taxes." }).errors.join()).toMatch(/landmark/)
    expect(validateSummary({ ...good, background: "Critics call it controversial." }).errors.join()).toMatch(/controversial/)
    expect(validateSummary({ ...good, what_it_does: [...good.what_it_does.slice(0, 3), "Adds common-sense rules."] }).ok).toBe(false)
    // "extremely" contains "extreme" but is a different word; "boldface" contains "bold".
    expect(validateSummary({ ...good, tldr: "Changes rules for extremely small boldface print on labels." }).ok).toBe(true)
    // "broad" is evaluative; "broadband" and "broader" are different words.
    expect(validateSummary({ ...good, tldr: "Makes broad changes to project reviews." }).errors.join()).toMatch(/broad/)
    expect(validateSummary({ ...good, tldr: "Funds broadband and broader access to rural internet." }).ok).toBe(true)
    // Statutory designations are allowed; the bare judgement is not.
    expect(validateSummary({ ...good, tldr: "Keeps dangerous offenders in maximum security prisons." }).ok).toBe(true)
    expect(validateSummary({ ...good, tldr: "Targets dangerous people in prisons." }).ok).toBe(false)
  })
  it("accepts topics from the taxonomy and rejects invented ones", () => {
    expect(validateSummary({ ...good, topics: ["budget-taxes", "housing"] }).ok).toBe(true)
    expect(validateSummary({ ...good, topics: ["vibes"] }).errors.join()).toMatch(/Unknown topic "vibes"/)
    expect(validateSummary({ ...good, topics: ["health", "housing", "education", "budget-taxes"] }).ok).toBe(false)
  })
  it("rejects em and en dashes", () => {
    expect(validateSummary({ ...good, tldr: "This bill cuts taxes — mostly for low earners." }).errors.join()).toMatch(/dash/)
    expect(validateSummary({ ...good, tldr: "This bill cuts taxes – mostly for low earners." }).ok).toBe(false)
    expect(validateSummary({ ...good, tldr: "This bill sets a first-time buyer rebate." }).ok).toBe(true)
  })
  it("does not split sentences at legal citations, initials or abbreviations", () => {
    expect(sentences("It amends the Indian Act, R.S.C. 1985, c. I-5. It also changes the St. Lawrence Seaway rules.")).toBe(2)
    expect(sentences("Sets Bill No. 2 aside and repeals S.C. 2019, c. 12, s. 4.")).toBe(1)
    expect(sentences("Raises a credit. Starts in 2027. Ends in 2030.")).toBe(3)
  })
})
