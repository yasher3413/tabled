// Canadian postal codes: letter digit letter, digit letter digit. D, F, I, O, Q and U never appear,
// and W and Z never start a code.
const POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/

export function normalizePostal(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "")
}

export function isValidPostal(input: string): boolean {
  return POSTAL.test(normalizePostal(input))
}

/** "K1A0A6" -> "K1A 0A6" */
export function formatPostal(input: string): string {
  const n = normalizePostal(input)
  return n.length === 6 ? `${n.slice(0, 3)} ${n.slice(3)}` : n
}

export function postalError(input: string): string | null {
  const n = normalizePostal(input)
  if (!n) return "Enter a postal code."
  if (n.length !== 6) return "A postal code has six characters, like K1A 0A6."
  if (!POSTAL.test(n)) return "That doesn't look like a Canadian postal code. Check for a mistyped letter or number."
  return null
}
