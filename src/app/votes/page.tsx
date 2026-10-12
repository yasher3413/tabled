import type { Metadata } from "next"
import { Suspense } from "react"
import { VotesExplorer, VotesExplorerWithParams } from "@/components/filters/votes-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import { getDataYear, listVotes } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Votes",
  description: "Every recorded vote in the House of Commons this session, with results and how each party voted.",
  alternates: { canonical: "/votes" },
}

export default function VotesPage() {
  const props = { votes: listVotes(), referenceYear: getDataYear() }
  return (
    <Container>
      <PageHeader
        title="Votes"
        lede="Every recorded vote (a division) in the House of Commons this session. Most decisions pass without one; a recorded vote happens when MPs stand to be counted by name."
      />
      <Suspense fallback={<VotesExplorer {...props} params={{}} />}>
        <VotesExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
