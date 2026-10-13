import { SummarySchema, type Summary } from "../../src/lib/summary-schema"
import { isTopic, TOPIC_IDS } from "../../src/lib/topics"

/** Loaded or evaluative words that have no place in a neutral description. */
export const BANNED_WORDS = [
  "controversial",
  "landmark",
  "sweeping",
  "broad",
  "far-reaching",
  "overhaul",
  "reshape",
  "radical",
  "historic",
  "historical milestone",
  "common-sense",
  "common sense",
  "dangerous",
  "extreme",
  "extremist",
  "draconian",
  "groundbreaking",
  "game-changing",
  "game changer",
  "unprecedented",
  "bold",
  "disastrous",
  "devastating",
  "reckless",
  "outrageous",
  "shocking",
  "slammed",
  "massive",
  "crucial",
  "vital",
  "much-needed",
  "long-overdue",
  "long overdue",
  "crackdown",
  "cracks down",
  "job-killing",
  "woke",
  "ideological",
  "unfortunately",
  "fortunately",
  "finally",
  "hopefully",
]

export const LIMITS = {
  tldrWords: 30,
  bulletWords: 45,
  minBullets: 3,
  /** Very short bills (a single repeal, say) cannot honestly yield three distinct changes. */
  shortSourceChars: 1500,
  minBulletsShortSource: 1,
  maxBullets: 6,
  maxAffected: 8,
  affectedWords: 8,
  backgroundSentences: 2,
} as const

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length
/** Statutory terms that happen to contain a banned word ("dangerous offender" is a Criminal Code designation). */
const LEGAL_TERMS = /dangerous (?:offenders?|driving|goods|operation)/g

/** A period that ends an abbreviation or initial (R.S.C., c., No., St., e.g.), not a sentence. */
const ABBREVIATION_END = /(?:^|[\s(.])(?:[A-Za-z]|No|Nos|St|Ste|Mr|Mrs|Ms|Dr|Jr|Sr|Hon|vs|etc|e\.g|i\.e|ss|cc|art|para|subs|Sch)\.$/
export const sentences = (s: string) => {
  let count = 0
  let current = ""
  for (const piece of s.split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/)) {
    current = current ? `${current} ${piece}` : piece
    if (!ABBREVIATION_END.test(current.trim())) {
      if (current.trim()) count++
      current = ""
    }
  }
  return count + (current.trim() ? 1 : 0)
}

function allText(s: Summary): string[] {
  return [s.tldr, ...s.what_it_does, ...s.who_it_affects, s.background ?? ""].filter(Boolean)
}

export interface ValidationResult {
  ok: boolean
  errors: string[]
  summary?: Summary
}

export function validateSummary(input: unknown, opts: { sourceChars?: number } = {}): ValidationResult {
  const parsed = SummarySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.issues.map((i) => `${i.path.join(".") || "summary"}: ${i.message}`) }
  }
  const s = parsed.data
  const errors: string[] = []
  if (words(s.tldr) > LIMITS.tldrWords) errors.push(`tldr has ${words(s.tldr)} words; the limit is ${LIMITS.tldrWords}.`)
  if (sentences(s.tldr) > 1) errors.push("tldr must be a single sentence.")
  const minBullets = opts.sourceChars !== undefined && opts.sourceChars < LIMITS.shortSourceChars ? LIMITS.minBulletsShortSource : LIMITS.minBullets
  if (s.what_it_does.length < minBullets || s.what_it_does.length > LIMITS.maxBullets) {
    errors.push(`what_it_does needs ${minBullets} to ${LIMITS.maxBullets} bullets; got ${s.what_it_does.length}.`)
  }
  s.what_it_does.forEach((b, i) => {
    if (words(b) > LIMITS.bulletWords) errors.push(`what_it_does[${i}] has ${words(b)} words; the limit is ${LIMITS.bulletWords}.`)
  })
  if (s.who_it_affects.length > LIMITS.maxAffected) errors.push(`who_it_affects has ${s.who_it_affects.length} groups; the limit is ${LIMITS.maxAffected}.`)
  s.who_it_affects.forEach((g, i) => {
    if (words(g) > LIMITS.affectedWords) errors.push(`who_it_affects[${i}] should be a short group name (at most ${LIMITS.affectedWords} words).`)
  })
  for (const topic of s.topics ?? []) {
    if (!isTopic(topic)) errors.push(`Unknown topic "${topic}". Use only: ${TOPIC_IDS.join(", ")}.`)
  }
  if (s.background && sentences(s.background) > LIMITS.backgroundSentences) {
    errors.push(`background must be at most ${LIMITS.backgroundSentences} sentences.`)
  }
  for (const text of allText(s)) {
    if (/[—–]/.test(text) || / -- /.test(text)) errors.push(`Remove dashes used as punctuation (em or en dash): "${text.slice(0, 60)}"`)
    // Legal designations that contain a banned word are terms of art, not judgements.
    const lower = text.toLowerCase().replace(LEGAL_TERMS, "")
    for (const banned of BANNED_WORDS) {
      const re = new RegExp(`(^|[^a-z])${banned.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}([^a-z]|$)`)
      if (re.test(lower)) errors.push(`Avoid the loaded word "${banned}".`)
    }
  }
  return { ok: errors.length === 0, errors: [...new Set(errors)], summary: errors.length ? undefined : s }
}
