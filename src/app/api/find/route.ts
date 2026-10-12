import { readFile } from "node:fs/promises"
import path from "node:path"
import { cacheLife } from "next/cache"
import type { NextRequest } from "next/server"
import { listMembers, memberParlIds, normalizeRiding, partyMap } from "@/lib/queries"
import { partyShort } from "@/i18n/parties"
import { formatPostal, normalizePostal, postalError } from "@/lib/postal"
import { federalRidings, type RepresentPostcode } from "@/lib/represent"

const USER_AGENT = "Tabled/0.1 (civic project; contact via GitHub repo github.com/yasher3413/tabled)"

type Lookup = { ok: true; data: RepresentPostcode } | { ok: false; status: number }

/** One Represent request per postal code per day, shared by every visitor. */
async function lookupPostcode(code: string): Promise<Lookup> {
  "use cache"
  cacheLife("days")
  if (process.env.REPRESENT_FIXTURES === "1") {
    try {
      const file = path.join(process.cwd(), "tests", "fixtures", "represent", `postcode-${code}.json`)
      return { ok: true, data: JSON.parse(await readFile(file, "utf8")) }
    } catch {
      return { ok: false, status: 404 }
    }
  }
  const res = await fetch(`https://represent.opennorth.ca/postcodes/${code}/`, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return { ok: false, status: res.status }
  return { ok: true, data: (await res.json()) as RepresentPostcode }
}

const ERRORS = {
  en: {
    down: "The postal code service is not responding. Try again in a minute.",
    notFound: (pc: string) => `We couldn't find ${pc}. Check it, or try a nearby postal code.`,
    busy: "Too many lookups right now. Try again in a minute.",
    failed: "The postal code service returned an error. Try again later.",
  },
  fr: {
    down: "Le service des codes postaux ne répond pas. Réessayez dans une minute.",
    notFound: (pc: string) => `Code postal ${pc} introuvable. Vérifiez-le, ou essayez un code postal voisin.`,
    busy: "Trop de recherches en ce moment. Réessayez dans une minute.",
    failed: "Le service des codes postaux a renvoyé une erreur. Réessayez plus tard.",
  },
}

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("postal") ?? ""
  const lang = request.nextUrl.searchParams.get("lang") === "fr" ? "fr" : "en"
  const E = ERRORS[lang]
  const error = postalError(raw, lang)
  if (error) return Response.json({ error }, { status: 400 })
  const code = normalizePostal(raw)

  let lookup: Lookup
  try {
    lookup = await lookupPostcode(code)
  } catch {
    return Response.json({ error: E.down }, { status: 502 })
  }
  if (!lookup.ok) {
    if (lookup.status === 404) {
      return Response.json({ error: E.notFound(formatPostal(code)) }, { status: 404 })
    }
    if (lookup.status === 429) {
      return Response.json({ error: E.busy }, { status: 503 })
    }
    return Response.json({ error: E.failed }, { status: 502 })
  }

  const members = listMembers().filter((m) => m.active)
  const parties = partyMap()
  const byParl = new Map<number, (typeof members)[number]>()
  const parlIds = memberParlIds()
  for (const m of members) {
    const id = parlIds.get(m.id)
    if (id) byParl.set(id, m)
  }
  const ridings = federalRidings(lookup.data).map((r) => {
    const member =
      (r.parlMpId ? byParl.get(r.parlMpId) : undefined) ??
      members.find((m) => m.ridingName && normalizeRiding(m.ridingName) === normalizeRiding(r.ridingName))
    return {
      riding: r.ridingName,
      mp: member
        ? { id: member.id, name: member.name, party: member.partyId ? partyShort(parties.get(member.partyId), lang) : null, partyId: member.partyId }
        : null,
    }
  })
  return Response.json(
    { postal: formatPostal(code), city: lookup.data.city ?? null, province: lookup.data.province ?? null, ridings },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  )
}
