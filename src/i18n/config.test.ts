import { describe, expect, it } from "vitest"
import { isLocale, localePath, unlocalizedPath } from "./config"

describe("locale paths", () => {
  it("keeps English at the root and prefixes French", () => {
    expect(localePath("en", "/bills")).toBe("/bills")
    expect(localePath("fr", "/bills")).toBe("/fr/bills")
    expect(localePath("fr", "/")).toBe("/fr")
  })
  it("strips prefixes", () => {
    expect(unlocalizedPath("/fr/bills/45-1/C-4")).toBe("/bills/45-1/C-4")
    expect(unlocalizedPath("/fr")).toBe("/")
    expect(unlocalizedPath("/en/mps")).toBe("/mps")
    expect(unlocalizedPath("/france")).toBe("/france")
  })
  it("validates locales", () => {
    expect(isLocale("fr")).toBe(true)
    expect(isLocale("de")).toBe(false)
  })
})
