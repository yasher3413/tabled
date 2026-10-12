import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatShortDate } from "@/lib/format"
import type { BillListItem, Party } from "@/lib/queries"
import { PartyTag } from "./party-tag"
import { StageProgress } from "./stage-progress"

/** One bill in a ruled list: number, title, plain-English line, progress, sponsor, labelled date. */
export function BillRow({
  bill,
  party,
  referenceYear,
  dateField = "activity",
  locale = "en",
  sessionTag,
}: {
  bill: BillListItem
  party?: Party
  referenceYear?: number
  /** Which date the right-hand column shows; it is labelled either way. */
  dateField?: "activity" | "introduced"
  locale?: Locale
  /** Shown under the number for bills from an earlier session. */
  sessionTag?: string
}) {
  const t = getMessages(locale).bills
  const fr = locale === "fr"
  const shortTitle = fr ? (bill.shortTitleFr ?? bill.shortTitle) : bill.shortTitle
  const longTitle = fr ? (bill.titleFr ?? bill.title) : bill.title
  const title = shortTitle ?? longTitle
  // Summaries are written from English sources, so the French site does not show them.
  const tldr = fr ? null : bill.tldr
  return (
    <article className="group relative grid gap-x-6 gap-y-2 border-b border-rule py-5 sm:grid-cols-[5.5rem_1fr_auto]">
      <p className="font-display text-xl leading-tight font-semibold text-ink tabular-nums sm:pt-0.5">
        {bill.number}
        {sessionTag && <span className="block font-sans text-[0.75rem] font-normal text-ink-3">{sessionTag}</span>}
      </p>
      <div className="min-w-0">
        <h3 className="text-[1.0625rem] leading-snug font-medium text-ink">
          <Link
            href={localePath(locale, `/bills/${bill.sessionId}/${bill.number}`)}
            className="decoration-accent-ink/40 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline"
          >
            {title}
          </Link>
        </h3>
        {tldr ? (
          <p className="measure mt-1 text-[0.9375rem] leading-relaxed text-ink-2">{tldr}</p>
        ) : shortTitle ? (
          <p className="measure mt-1 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-3">{longTitle}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <StageProgress stages={bill.stages} currentStage={bill.currentStage} locale={locale} />
          <span className="text-[0.8125rem] text-ink-3">{t.typeLabels[bill.type]}</span>
          {bill.sponsorName && (
            <span className="text-[0.8125rem] text-ink-3">
              {bill.sponsorMemberId && party ? (
                <PartyTag partyId={party.id} label={<span className="name-sc">{bill.sponsorName}</span>} className="text-ink-3" />
              ) : bill.chamber === "senate" ? (
                <>
                  {fr ? "Sénat : " : "Senator "}
                  <span className="name-sc">{bill.sponsorName}</span>
                </>
              ) : (
                <span className="name-sc">{bill.sponsorName}</span>
              )}
            </span>
          )}
        </div>
      </div>
      <p className="text-[0.8125rem] whitespace-nowrap text-ink-3 sm:text-right">
        <span className="sm:block">{dateField === "introduced" ? t.introduced : t.lastActivity}</span>{" "}
        <span className="text-ink-2">{formatShortDate(dateField === "introduced" ? bill.introducedDate : bill.lastActivityDate, referenceYear, locale)}</span>
      </p>
    </article>
  )
}
