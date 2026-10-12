import { describe, expect, it } from "vitest"
import { describeStage, describeStageEvent, stageInfo } from "./stages"

describe("stage vocabulary", () => {
  it("describes a bill's position the same way in compact and long form", () => {
    expect(describeStage("house:committee")).toBe("In committee (House)")
    expect(describeStage("house:committee", "status")).toBe("In committee in the House of Commons")
    expect(describeStage("senate:second-reading", "status")).toBe("At second reading in the Senate")
    expect(describeStage("crown:royal-assent")).toBe("Became law")
    expect(describeStage("defeated")).toBe("Defeated")
  })
  it("describes stage events for activity feeds", () => {
    expect(describeStageEvent("house:first-reading", "completed")).toBe("Introduced (House)")
    expect(describeStageEvent("senate:second-reading", "completed")).toBe("Passed second reading (Senate)")
    expect(describeStageEvent("house:committee", "in_progress")).toBe("Now in committee (House)")
    expect(describeStageEvent("house:second-reading", "defeated")).toBe("Defeated at second reading (House)")
    expect(describeStageEvent("crown:royal-assent", "completed")).toBe("Became law")
  })
  it("has a plain-language explainer for every canonical stage", () => {
    for (const key of ["house:first-reading", "house:report", "senate:committee", "crown:royal-assent"]) {
      expect(stageInfo(key).explainer.length).toBeGreaterThan(40)
    }
    expect(stageInfo("senate:mystery-stage").label).toBe("Mystery stage")
  })
})
