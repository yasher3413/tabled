import { describe, expect, it } from "vitest"
import { sessionLabel } from "./sessions"

describe("sessionLabel", () => {
  it("names sessions in both languages", () => {
    expect(sessionLabel({ parliament: 45, session: 1 }, "en")).toBe("45th Parliament, 1st session")
    expect(sessionLabel({ parliament: 44, session: 2 }, "en")).toBe("44th Parliament, 2nd session")
    expect(sessionLabel({ parliament: 41, session: 3 }, "en")).toBe("41st Parliament, 3rd session")
    expect(sessionLabel({ parliament: 45, session: 1 }, "fr")).toBe("1re session de la 45e législature")
  })
})
