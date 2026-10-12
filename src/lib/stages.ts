// Plain-English explainers for each legislative stage. Written by hand, not generated.
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { BILL_TYPE_EXPLAINERS_FR, HOUSE_FR, PRIVATE_VS_GOVERNMENT_FR, ROYAL_ASSENT_FR, SENATE_FR } from "@/i18n/stages-fr"

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

const CHAMBER_LABEL_FR: Record<StageChamber, string> = {
  house: "Chambre des communes",
  senate: "Sénat",
  crown: "Sanction royale",
}

export function chamberLabel(chamber: StageChamber, locale: Locale = "en"): string {
  return (locale === "fr" ? CHAMBER_LABEL_FR : CHAMBER_LABEL)[chamber]
}

export function stageInfo(stageKey: string, locale: Locale = "en"): StageInfo & { chamber: StageChamber } {
  const [chamber, slug] = stageKey.split(":") as [StageChamber, string]
  if (chamber === "crown") return { ...(locale === "fr" ? ROYAL_ASSENT_FR : ROYAL_ASSENT), chamber }
  const table = locale === "fr" ? (chamber === "senate" ? SENATE_FR : HOUSE_FR) : chamber === "senate" ? SENATE : HOUSE
  const info = table[slug] ?? {
    label: slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()),
    short: slug,
    explainer: locale === "fr" ? "Une étape consignée dans LEGISinfo." : "A stage recorded by LEGISinfo.",
  }
  return { ...info, chamber }
}

/**
 * One vocabulary for a bill's position, used everywhere:
 *   compact  "In committee (House)"                      bill rows, search
 *   status   "In committee in the House of Commons"      bill page header
 */
export function describeStage(currentStage: string, form: "compact" | "status" = "compact", locale: Locale = "en"): string {
  const m = getMessages(locale).stage
  if (currentStage === "crown:royal-assent") return m.becameLaw
  if (currentStage === "introduced") return m.introduced
  if (currentStage === "defeated") return m.defeated
  const [chamber, slug] = currentStage.split(":")
  const phrase = m.at[slug] ?? stageInfo(currentStage, locale).label
  return form === "status" ? `${phrase} ${m.inChamber[chamber]}` : `${phrase} (${m.shortChamber[chamber]})`
}

/** Back-compat name for the compact form. */
export function currentStageLabel(currentStage: string, locale: Locale = "en"): string {
  return describeStage(currentStage, "compact", locale)
}

/** A stage event for activity feeds: "Introduced (House)", "Passed second reading (Senate)", "Now in committee (House)". */
export function describeStageEvent(stageKey: string, state: string, locale: Locale = "en"): string {
  const m = getMessages(locale).stage
  if (stageKey === "crown:royal-assent") return m.becameLaw
  const [chamber, slug] = stageKey.split(":")
  const where = m.shortChamber[chamber]
  const label = stageInfo(stageKey, locale).label
  if (state === "defeated") return `${m.eventDefeated(label)} (${where})`
  if (state === "in_progress") {
    const now = m.now[slug] ?? label.toLowerCase()
    return `${now.charAt(0).toUpperCase()}${now.slice(1)} (${where})`
  }
  if (slug === "first-reading") return `${m.eventIntroduced} (${where})`
  if (slug === "committee") return `${m.eventCommittee} (${where})`
  return `${m.eventPassed(label)} (${where})`
}

export function billTypeExplainer(type: string, locale: Locale = "en"): string {
  return (locale === "fr" ? BILL_TYPE_EXPLAINERS_FR : BILL_TYPE_EXPLAINERS)[type] ?? ""
}

export function privateVsGovernment(locale: Locale = "en"): string {
  return locale === "fr" ? PRIVATE_VS_GOVERNMENT_FR : PRIVATE_VS_GOVERNMENT
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
