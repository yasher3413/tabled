import { describe, expect, it } from "vitest"
import { isWeekKey, weekKey, weekRange } from "./weeks"

describe("ISO weeks", () => {
  it("keys dates by ISO week", () => {
    expect(weekKey("2026-10-08")).toBe("2026-W41") // Thursday
    expect(weekKey("2026-10-05")).toBe("2026-W41") // Monday
    expect(weekKey("2026-10-11")).toBe("2026-W41") // Sunday
    expect(weekKey("2026-10-12")).toBe("2026-W42")
    expect(weekKey("2027-01-01")).toBe("2026-W53") // Friday belongs to the last week of 2026
    expect(weekKey("2025-12-29")).toBe("2026-W01")
  })
  it("returns Monday to Sunday ranges that round-trip", () => {
    expect(weekRange("2026-W41")).toEqual({ start: "2026-10-05", end: "2026-10-11" })
    for (const d of ["2025-06-02", "2026-01-01", "2026-06-17", "2026-12-31"]) {
      const { start, end } = weekRange(weekKey(d))
      expect(start <= d && d <= end).toBe(true)
    }
  })
  it("validates keys", () => {
    expect(isWeekKey("2026-W41")).toBe(true)
    expect(isWeekKey("2026-W60")).toBe(false)
    expect(isWeekKey("../etc")).toBe(false)
  })
})
