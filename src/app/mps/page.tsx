import type { Metadata } from "next"
import { Suspense } from "react"
import { MembersExplorer, MembersExplorerWithParams } from "@/components/filters/members-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import { listMembers, listParties } from "@/lib/queries"

export const metadata: Metadata = {
  title: "MPs",
  description: "Every Member of Parliament: party, riding, how often they vote with their party and the bills they sponsor.",
  alternates: { canonical: "/mps" },
}

export default function MpsPage() {
  const props = { members: listMembers(), parties: listParties() }
  return (
    <Container>
      <PageHeader title="Members of Parliament" lede="Everyone who sits, or sat this session, in the House of Commons. Filter by party or province, or search by name or riding." />
      <Suspense fallback={<MembersExplorer {...props} params={{}} />}>
        <MembersExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
