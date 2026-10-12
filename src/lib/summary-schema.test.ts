import { describe, expect, it } from "vitest"
import { parseSummary } from "./summary-schema"

describe("parseSummary", () => {
  it("returns null for missing, malformed or off-schema payloads so the UI falls back to 'coming soon'", () => {
    expect(parseSummary(null)).toBeNull()
    expect(parseSummary("not json")).toBeNull()
    expect(parseSummary(JSON.stringify({ tldr: "x" }))).toBeNull()
  })
  it("parses a valid payload", () => {
    const s = parseSummary(
      JSON.stringify({
        tldr: "Repeals the Oil Tanker Moratorium Act.",
        what_it_does: ["Repeals the Oil Tanker Moratorium Act."],
        who_it_affects: ["Oil tanker operators"],
        background: null,
        source_basis: "full_text",
      }),
    )
    expect(s?.what_it_does).toHaveLength(1)
  })
})
