import type { Metadata } from "next"
import { Suspense } from "react"
import { ReportForm, ReportFormWithParams } from "@/components/report/report-form"
import { Container, PageHeader } from "@/components/tabled/page-header"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { alternates } from "@/lib/metadata"

export function reportMetadata(locale: Locale): Metadata {
  const t = getMessages(locale).report
  return { title: t.title, description: t.metaDesc, alternates: alternates(locale, "/report"), robots: { index: false } }
}

export function ReportView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).report
  return (
    <Container>
      <PageHeader title={t.title} lede={t.lede} />
      <div className="pt-8">
        {/* The form reads ?page= and ?subject=, so it renders inside Suspense to keep the page prerendered. */}
        <Suspense fallback={<ReportForm locale={locale} params={{}} />}>
          <ReportFormWithParams locale={locale} />
        </Suspense>
      </div>
    </Container>
  )
}
