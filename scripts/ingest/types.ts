// Partial shapes of upstream responses, limited to fields Tabled reads.

export interface Localized {
  en: string
  fr?: string
}

export interface OPPage<T> {
  objects: T[]
  pagination: { offset: number; limit: number; next_url: string | null }
}

export interface OPPoliticianListItem {
  name: string
  url: string
  current_party: { short_name: Localized } | null
  current_riding: { province: string; name: Localized } | null
  image: string | null
}

export interface OPMembership {
  url: string
  start_date: string | null
  end_date: string | null
  party: { name: Localized; short_name: Localized } | null
  label: Localized
  riding: { name: Localized; province: string; id: number } | null
}

export interface OPPolitician {
  name: string
  given_name?: string
  family_name?: string
  image: string | null
  url: string
  other_info?: { parl_mp_id?: string[] }
  links?: { url: string; note: string }[]
  memberships: OPMembership[]
}

export interface OPVoteListItem {
  bill_url: string | null
  session: string
  number: number
  date: string
  description: Localized
  result: string
  yea_total: number
  nay_total: number
  paired_total: number
  url: string
}

export interface OPBallot {
  vote_url: string
  politician_url: string
  politician_membership_url: string
  ballot: string
}

export interface LIStage {
  BillStageNameEn: string
  BillStageNameFr: string
  StateNameEn: string | null
  StateAsOfDate: string | null
  Sittings?: { Date: string }[]
}

export interface LIBill {
  Id: number
  NumberCode: string
  NumberPrefix: string | null
  Number: number
  LongTitleEn: string
  LongTitleFr: string
  ShortTitleEn: string
  ShortTitleFr: string
  StatusNameEn: string
  StatusNameFr: string
  ParliamentNumber: number
  SessionNumber: number
  BillDocumentTypeNameEn: string
  IsGovernmentBill: boolean
  OriginatingChamberOrganizationId: number
  IsHouseBill: boolean
  IsSenateBill: boolean
  SponsorPersonId: number | null
  SponsorPersonName: string | null
  SponsorPersonShortHonorificEn: string | null
  SponsorAffiliationTitleEn: string | null
  LatestBillEventDateTime: string | null
  LatestBillEventTypeNameEn: string | null
  LatestCompletedBillStageDateTime: string | null
  PassedHouseFirstReadingDateTime: string | null
  PassedSenateFirstReadingDateTime: string | null
  ReceivedRoyalAssentDateTime: string | null
  ReceivedRoyalAssent: boolean
  IsProForma: boolean
  StatuteYear: number | null
  StatuteChapter: number | null
  IsFullLegislativeSummaryAvailable: boolean
  ShortLegislativeSummaryEn: string | null
  IsSessionOngoing: boolean
  BillStages: {
    HouseBillStages: LIStage[]
    SenateBillStages: LIStage[]
    RoyalAssent: LIStage[]
  } | null
  Publications: { PublicationId: number; PublicationTypeNameEn: string }[] | null
  HouseVoteDetails: { DivisionNumber: number }[] | null
}
