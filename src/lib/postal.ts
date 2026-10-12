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

export type PostalErrorCode = "empty" | "length" | "format"

export function postalErrorCode(input: string): PostalErrorCode | null {
  const n = normalizePostal(input)
  if (!n) return "empty"
  if (n.length !== 6) return "length"
  if (!POSTAL.test(n)) return "format"
  return null
}

const POSTAL_ERRORS: Record<"en" | "fr", Record<PostalErrorCode, string>> = {
  en: {
    empty: "Enter a postal code.",
    length: "A postal code has six characters, like K1A 0A6.",
    format: "That doesn't look like a Canadian postal code. Check for a mistyped letter or number.",
  },
  fr: {
    empty: "Entrez un code postal.",
    length: "Un code postal compte six caractères, comme K1A 0A6.",
    format: "Ceci ne ressemble pas à un code postal canadien. Vérifiez qu’aucune lettre ou chiffre n’est mal tapé.",
  },
}

export function postalError(input: string, locale: "en" | "fr" = "en"): string | null {
  const code = postalErrorCode(input)
  return code ? POSTAL_ERRORS[locale][code] : null
}
