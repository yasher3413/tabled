import { describe, expect, it } from "vitest"
import { hemicycleLayout } from "./hemicycle"

describe("hemicycleLayout", () => {
  it("places exactly the requested number of seats", () => {
    for (const n of [1, 5, 100, 337, 343]) expect(hemicycleLayout(n).seats).toHaveLength(n)
  })
  it("orders seats left to right by angle and keeps them inside the unit half-disc", () => {
    const { seats, radius } = hemicycleLayout(343)
    for (let i = 1; i < seats.length; i++) expect(seats[i].angle).toBeGreaterThanOrEqual(seats[i - 1].angle)
    for (const s of seats) {
      expect(Math.hypot(s.x, s.y)).toBeLessThanOrEqual(1 + 1e-9)
      expect(s.y).toBeGreaterThanOrEqual(-1e-9)
    }
    expect(radius).toBeGreaterThan(0)
  })
  it("does not overlap seats", () => {
    const { seats, radius } = hemicycleLayout(343)
    let min = Infinity
    for (let i = 0; i < seats.length; i++)
      for (let j = i + 1; j < seats.length; j++) min = Math.min(min, Math.hypot(seats[i].x - seats[j].x, seats[i].y - seats[j].y))
    expect(min).toBeGreaterThan(radius * 2)
  })
  it("handles an empty chamber", () => {
    expect(hemicycleLayout(0).seats).toEqual([])
  })
})
