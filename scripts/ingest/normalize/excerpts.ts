import type { OPSpeech } from "../types"
import { stripHtml } from "./bills"

export interface Excerpt {
  ordinal: number
  date: string
  memberId: string
  partyId: string
  textEn: string
  textFr: string | null
  url: string
}

/** Presiding officers speak for the House, not a party. */
const PRESIDING = /speaker|chair|président|présidente|vice-président/i
/** A main speech, not a question or comment in the follow-up exchange. */
const MIN_CHARS = 1500
const MAX_CHARS = 380

const ABBREVIATIONS = /\b(hon|Mr|Mrs|Ms|Dr|St|No|Nos|Bill|art|p|M|Mme|MM|Mmes|ch|L\.C|S\.C|c)\.\s/g
/** Openers that carry no substance: address, procedure, thanks and time-sharing. */
const BOILERPLATE = [
  /^(madam|mr\.?|mister)\s+speaker[,.]?\s*/i,
  /^(madame|monsieur)\s+(la\s+|le\s+)?présidente?[,.]?\s*/i,
]
const SKIP_SENTENCE =
  /^(moved that|that bill|propose que|que le projet de loi|i (will|would like to|am going to) (be )?(shar|split)|je partagerai|i (would like to|want to|wish to) (thank|congratulate|begin by thanking|start by thanking)|je (voudrais|tiens à|veux) (remercier|féliciter)|it is (a|an) (honour|pleasure|privilege)|c.est un (honneur|plaisir|privilège))/i

function sentencesOf(text: string): string[] {
  // Protect abbreviations so "the hon. member" is not cut in two.
  const guarded = text.replace(ABBREVIATIONS, (m) => m.replace(".", "\u0000"))
  return (guarded.match(/[^.!?]+[.!?]+(\s|$)/g) ?? [guarded]).map((x) => x.replace(/\u0000/g, ".").trim())
}

function clean(raw: string) {
  let s = raw
  for (const re of BOILERPLATE) s = s.replace(re, "")
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Sentences that talk about the bill itself. */
function mentionsBill(sentence: string, billNumber?: string) {
  const num = billNumber ? billNumber.replace("-", "[-\\s]?") : "[CS]-\\d+"
  return new RegExp(`\\b(this bill|the bill|bill ${num}|ce projet de loi|le projet de loi|projet de loi ${num})\\b`, "i").test(sentence)
}

/**
 * Two sentences from a speech, kept under MAX_CHARS: the first sentence that mentions the bill and the
 * one after it; otherwise the first two substantive sentences. The same rule applies to every speaker.
 */
export function excerptText(html: string, billNumber?: string): string {
  const text = stripHtml(html).replace(/\s+/g, " ").trim()
  const all = sentencesOf(text).map(clean)
  const anchor = all.findIndex((x) => x.length >= 40 && !SKIP_SENTENCE.test(x) && mentionsBill(x, billNumber))
  if (anchor >= 0) {
    const out = [all[anchor]]
    const next = all[anchor + 1]
    if (next && next.length >= 20 && [...out, next].join(" ").length <= MAX_CHARS) out.push(next)
    if (out[0].length <= MAX_CHARS) return out.join(" ")
  }
  const picked: string[] = []
  for (const raw of all) {
    const s = raw
    if (s.length < 40 || SKIP_SENTENCE.test(s)) {
      if (picked.length === 0) continue
      break
    }
    if ([...picked, s].join(" ").length > MAX_CHARS) break
    picked.push(s)
    if (picked.length === 2) break
  }
  if (picked.length) return picked.join(" ")
  return `${text.slice(0, MAX_CHARS - 1).replace(/\s+\S*$/, "")}…`
}

/**
 * One opening excerpt per party: each party's first substantive speech on the bill, in seat order.
 * Gives every party the same space and uses only their own words.
 */
export function selectExcerpts(
  speeches: OPSpeech[],
  membershipParty: Map<string, string | null>,
  partyOrder: string[],
  max = 5,
  billNumber?: string,
): Excerpt[] {
  const substantive = speeches
    .filter(
      (s) =>
        !s.procedural &&
        s.politician_url &&
        s.politician_membership_url &&
        !PRESIDING.test(s.attribution.en) &&
        stripHtml(s.content.en).length >= MIN_CHARS,
    )
    .sort((a, b) => a.time.localeCompare(b.time))
  const firstByParty = new Map<string, OPSpeech>()
  for (const s of substantive) {
    const party = membershipParty.get(s.politician_membership_url!)
    if (!party || party === "independent" || firstByParty.has(party)) continue
    firstByParty.set(party, s)
  }
  return partyOrder
    .filter((p) => firstByParty.has(p))
    .slice(0, max)
    .map((partyId, ordinal) => {
      const s = firstByParty.get(partyId)!
      const parts = s.politician_url!.split("/").filter(Boolean)
      return {
        ordinal,
        date: s.time.slice(0, 10),
        memberId: parts[parts.length - 1],
        partyId,
        textEn: excerptText(s.content.en, billNumber),
        textFr: s.content.fr ? excerptText(s.content.fr, billNumber) : null,
        url: `https://openparliament.ca${s.url}`,
      }
    })
}
