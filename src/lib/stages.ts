// Plain-English explainers for each legislative stage. Written by hand, not generated.

export type StageChamber = "house" | "senate" | "crown"

export interface StageInfo {
  label: string
  short: string
  explainer: string
}

const HOUSE: Record<string, StageInfo> = {
  "first-reading": {
    label: "First reading",
    short: "1st",
    explainer:
      "The bill is introduced in the House of Commons and printed so MPs can read it. There is no debate and no vote on what it says yet.",
  },
  "second-reading": {
    label: "Second reading",
    short: "2nd",
    explainer:
      "MPs debate the main idea of the bill. If a majority votes in favour, the bill moves on to a committee for a closer look.",
  },
  committee: {
    label: "Committee",
    short: "Cttee",
    explainer:
      "A small group of MPs studies the bill line by line. They can hear from experts and the public, and they can propose changes (amendments).",
  },
  report: {
    label: "Report stage",
    short: "Report",
    explainer:
      "The committee reports back to the whole House. All MPs can now debate and vote on changes to specific parts of the bill.",
  },
  "third-reading": {
    label: "Third reading",
    short: "3rd",
    explainer:
      "The final debate and vote in the House of Commons on the bill as a whole. If it passes, the bill goes to the Senate.",
  },
}

const SENATE: Record<string, StageInfo> = {
  "first-reading": {
    label: "First reading",
    short: "1st",
    explainer: "The bill is introduced in the Senate and printed. There is no debate yet.",
  },
  "second-reading": {
    label: "Second reading",
    short: "2nd",
    explainer:
      "Senators debate the main idea of the bill. If they agree with it in principle, it goes to a Senate committee.",
  },
  committee: {
    label: "Committee",
    short: "Cttee",
    explainer:
      "A Senate committee studies the bill in detail, hears from witnesses and can recommend amendments.",
  },
  report: {
    label: "Report stage",
    short: "Report",
    explainer: "The Senate considers the committee's report and any amendments it recommended.",
  },
  "third-reading": {
    label: "Third reading",
    short: "3rd",
    explainer:
      "The Senate's final vote on the bill. If senators changed it, the House must agree to the changes before it can become law.",
  },
}

const ROYAL_ASSENT: StageInfo = {
  label: "Royal assent",
  short: "Law",
  explainer:
    "The Governor General formally approves the bill on behalf of the King. It is now law, though some parts may only take effect on a later date.",
}

export const CHAMBER_LABEL: Record<StageChamber, string> = {
  house: "House of Commons",
  senate: "Senate",
  crown: "Royal assent",
}

export function stageInfo(stageKey: string): StageInfo & { chamber: StageChamber } {
  const [chamber, slug] = stageKey.split(":") as [StageChamber, string]
  if (chamber === "crown") return { ...ROYAL_ASSENT, chamber }
  const table = chamber === "senate" ? SENATE : HOUSE
  const info = table[slug] ?? {
    label: slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
    short: slug,
    explainer: "A stage recorded by LEGISinfo.",
  }
  return { ...info, chamber }
}

/** Human label for a bill's current_stage value, e.g. "Committee, House of Commons". */
export function currentStageLabel(currentStage: string): string {
  if (currentStage === "defeated") return "Defeated"
  if (currentStage === "introduced") return "Introduced"
  if (currentStage === "crown:royal-assent") return "Became law"
  const info = stageInfo(currentStage)
  return `${info.label}, ${info.chamber === "senate" ? "Senate" : "House"}`
}

export const BILL_TYPE_EXPLAINERS: Record<string, string> = {
  government:
    "Introduced by a cabinet minister on behalf of the government. Government bills get set time for debate, so they are the most likely to become law.",
  private_member:
    "Introduced by an MP who is not a minister. These bills compete in a lottery for debate time, and most do not become law.",
  senate_public:
    "Introduced by a senator. If the Senate passes it, it goes to the House of Commons, where an MP must agree to sponsor it.",
  senate_private:
    "Concerns a specific person or organization rather than the public at large, such as changing a company's charter. These start in the Senate.",
}

export const PRIVATE_VS_GOVERNMENT = `Government bills are introduced by ministers and carry out the government's agenda. They get reserved debate time and almost always pass when the government holds a majority of votes. Private members' bills are introduced by MPs who are not ministers. Their place in line is decided by a random draw, debate time is limited, and many never reach a vote. A bill marked "outside the order of precedence" has been introduced but has not yet been drawn for debate.`
