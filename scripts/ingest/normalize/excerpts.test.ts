import { describe, expect, it } from "vitest"
import { fixture } from "../../../tests/helpers/fixtures"
import type { OPPage, OPSpeech } from "../types"
import { excerptText, selectExcerpts } from "./excerpts"

const speeches = fixture<OPPage<OPSpeech>>("openparliament/speeches-C-4.json").objects

// Party for each membership, from the speeches' own MPs: assign by alternating real parties for the test map.
// We use real membership URLs and a fixed party per URL so the selection logic is exercised on real speech data.
const parties = ["liberal", "conservative", "bloc", "ndp"]
const membershipParty = new Map<string, string | null>()
let i = 0
for (const s of speeches) {
  if (s.politician_membership_url && !membershipParty.has(s.politician_membership_url)) {
    membershipParty.set(s.politician_membership_url, parties[i++ % parties.length])
  }
}

describe("selectExcerpts", () => {
  const ex = selectExcerpts(speeches, membershipParty, ["liberal", "conservative", "bloc", "ndp", "green"])

  it("gives each party at most one excerpt, in seat order", () => {
    expect(ex.map((e) => e.partyId)).toEqual(["liberal", "conservative", "bloc", "ndp"])
  })
  it("never quotes a presiding officer or a procedural line", () => {
    for (const e of ex) {
      const s = speeches.find((x) => `https://openparliament.ca${x.url}` === e.url)!
      expect(s.procedural).toBe(false)
      expect(s.attribution.en).not.toMatch(/speaker|chair/i)
    }
  })
  it("keeps excerpts short and links to the source speech", () => {
    for (const e of ex) {
      expect(e.textEn.length).toBeLessThanOrEqual(382)
      expect(e.textEn).not.toMatch(/<[a-z]/i)
      expect(e.url).toMatch(/^https:\/\/openparliament\.ca\/debates\//)
      expect(e.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe("excerptText", () => {
  it("takes two substantive sentences, skipping the address and procedural openers", () => {
    const s = excerptText(
      "<p>Madam Speaker, I would like to thank my colleagues for their work on this file. This bill lowers the lowest income tax rate for millions of people across the country. It also ends the consumer fuel charge in every province. Third sentence.</p>",
    )
    expect(s).toBe("This bill lowers the lowest income tax rate for millions of people across the country. It also ends the consumer fuel charge in every province.")
  })
  it("prefers the first sentences about the bill itself", () => {
    const s = excerptText(
      "<p>Madam Speaker, it is a true honour to rise today for my first speech in this Parliament. I thank the people of my riding for their trust in me. Bill C-4 cuts the lowest income tax rate to 14%. That change reaches about 22 million people. We support the measure.</p>",
      "C-4",
    )
    expect(s).toBe("Bill C-4 cuts the lowest income tax rate to 14%. That change reaches about 22 million people.")
  })
  it("does not split on abbreviations like hon.", () => {
    const s = excerptText("<p>Mr. Speaker, I listened closely to the hon. member for Saanich and her concerns about this bill and its effects on housing.</p>")
    expect(s).toContain("the hon. member for Saanich")
  })
  it("skips the motion text that opens a second-reading debate", () => {
    const s = excerptText("<p>moved that Bill C-4, An Act respecting certain affordability measures, be read the second time and referred to a committee. Canadians are facing higher costs for groceries, rent and fuel than at any time in decades.</p>")
    expect(s.startsWith("Canadians are facing")).toBe(true)
  })
})
