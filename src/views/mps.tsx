import type { Metadata } from "next"
import { Suspense } from "react"
import { MembersExplorer, MembersExplorerWithParams } from "@/components/filters/members-explorer"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"
import { listMembers, listParties } from "@/lib/queries"

export function mpsMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return { title: t.mps, description: t.mpsDesc, alternates: alternates(locale, "/mps") }
}

export function MpsView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).mps
  const props = { members: listMembers(), parties: listParties(), locale }
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede} />
      <Suspense fallback={<MembersExplorer {...props} params={{}} />}>
        <MembersExplorerWithParams {...props} />
      </Suspense>
    </Container>
  )
}
