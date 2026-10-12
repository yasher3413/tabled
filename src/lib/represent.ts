// Maps a Represent (Open North) postal code response to federal ridings and MPs.

export const CURRENT_FEDERAL_SET = "/boundary-sets/federal-electoral-districts-2023-representation-order/"

interface RepBoundary {
  name: string
  external_id?: string
  related: { boundary_set_url: string }
}
interface RepRepresentative {
  name: string
  district_name: string
  representative_set_name: string
  url?: string
  party_name?: string
}
export interface RepresentPostcode {
  code: string
  city?: string
  province?: string
  boundaries_centroid?: RepBoundary[]
  boundaries_concordance?: RepBoundary[]
  representatives_centroid?: RepRepresentative[]
  representatives_concordance?: RepRepresentative[]
}

export interface RidingMatch {
  ridingName: string
  /** House of Commons PersonId parsed from the representative's ourcommons URL. */
  parlMpId: number | null
  representativeName: string | null
}

/** Ridings for a postal code, deduplicated; more than one when the code spans a boundary. */
export function federalRidings(data: RepresentPostcode): RidingMatch[] {
  const boundaries = [...(data.boundaries_centroid ?? []), ...(data.boundaries_concordance ?? [])].filter(
    (b) => b.related.boundary_set_url === CURRENT_FEDERAL_SET,
  )
  const reps = [...(data.representatives_centroid ?? []), ...(data.representatives_concordance ?? [])].filter(
    (r) => r.representative_set_name === "House of Commons",
  )
  const names = new Map<string, RidingMatch>()
  for (const b of boundaries) names.set(b.name, { ridingName: b.name, parlMpId: null, representativeName: null })
  for (const r of reps) {
    const m = r.url ? /\((\d+)\)\s*$/.exec(r.url) : null
    const existing = names.get(r.district_name)
    names.set(r.district_name, {
      ridingName: r.district_name,
      parlMpId: m ? Number(m[1]) : (existing?.parlMpId ?? null),
      representativeName: r.name,
    })
  }
  return [...names.values()]
}
