import type { Metadata } from "next"
import { Suspense } from "react"
import { CompareMps, CompareMpsWithParams } from "@/components/members/compare-mps"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { partyShort } from "@/i18n/parties"
import { alternates } from "@/lib/metadata"
import { listMembers, listVotes, partyMap } from "@/lib/queries"

export function compareMetadata(locale: Locale): Metadata {
  const fr = locale === "fr"
  return {
    title: fr ? "Comparer deux députés" : "Compare two MPs",
    description: fr ? "À quelle fréquence deux députés ont voté de la même façon cette session." : "How often two MPs voted the same way this session.",
    alternates: alternates(locale, "/compare"),
  }
}

export function CompareView({ locale }: { locale: Locale }) {
  const fr = locale === "fr"
  const parties = partyMap()
  const members = listMembers().map((m) => ({ id: m.id, name: m.name, party: partyShort(m.partyId ? parties.get(m.partyId) : null, locale), active: m.active }))
  const votes = listVotes().map((v) => ({ id: v.id, sessionId: v.sessionId, number: v.number, date: v.date, description: fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn }))
  const props = { members, votes, locale }
  return (
    <Container>
      <PageHeader
        title={fr ? "Comparer deux députés" : "Compare two MPs"}
        lede={fr ? "Choisissez deux députés pour voir à quelle fréquence ils ont voté de la même façon lors des votes par appel nominal de cette session." : "Pick any two MPs to see how often they voted the same way on recorded votes this session."}
      />
      <Suspense fallback={<CompareMps {...props} params={{}} />}>
        <CompareMpsWithParams {...props} />
      </Suspense>
    </Container>
  )
}
