import { describe, expect, it } from "vitest"
import { formatDate, formatPercent, formatShortDate, initials, plural, provinceName } from "./format"

describe("format", () => {
  it("formats dates without timezone drift", () => {
    expect(formatDate("2026-10-08")).toBe("October 8, 2026")
    expect(formatDate("2026-10-08T23:59:00")).toBe("October 8, 2026")
    expect(formatDate(null)).toBe("Date unavailable")
    expect(formatShortDate("2026-10-08", 2026)).toBe("Oct 8")
    expect(formatShortDate("2025-06-05", 2026)).toBe("Jun 5, 2025")
  })
  it("never rounds a non-perfect rate up to 100%", () => {
    expect(formatPercent(0.9996)).toBe("99.9%")
    expect(formatPercent(1)).toBe("100.0%")
    expect(formatPercent(0.5)).toBe("50.0%")
    expect(formatPercent(null)).toBe("n/a")
  })
  it("builds initials and plurals", () => {
    expect(initials("Ziad Aboultaif")).toBe("ZA")
    expect(initials("Simon-Pierre Savard-Tremblay")).toBe("SS")
    expect(plural(1, "vote")).toBe("1 vote")
    expect(plural(1200, "ballot")).toBe("1,200 ballots")
    expect(provinceName("QC")).toBe("Quebec")
  })
})
