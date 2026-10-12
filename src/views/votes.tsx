import type { Metadata } from "next"
import { Suspense } from "react"
import { VotesExplorer, VotesExplorerWithParams } from "@/components/filters/votes-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"
import { getDataYear, listVotes } from "@/lib/queries"

export function votesMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return { title: t.votes, description: t.votesDesc, alternates: alternates(locale, "/votes") }
}

export function VotesView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).votes
  const props = { votes: listVotes(), referenceYear: getDataYear(), locale }
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede} />
      <Suspense fallback={<VotesExplorer {...props} params={{}} />}>
        <VotesExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
