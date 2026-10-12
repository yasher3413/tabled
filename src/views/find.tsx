import type { Metadata } from "next"
import { Suspense } from "react"
import { FindMp, FindMpWithParams } from "@/components/home/find-mp"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"

export function findMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).meta
  return { title: t.find, description: t.findDesc, alternates: alternates(locale, "/find") }
}

export function FindView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).find
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede} />
      <div className="mt-10">
        <Suspense fallback={<FindMp locale={locale} />}>
          <FindMpWithParams locale={locale} />
        </Suspense>
      </div>
    </Container>
  )
}
