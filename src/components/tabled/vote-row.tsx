import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatShortDate } from "@/lib/format"
import type { VoteListItem } from "@/lib/queries"
import { VoteTally } from "./vote-tally"

export function VoteRow({ vote: v, referenceYear, locale = "en" }: { vote: VoteListItem; referenceYear: number; locale?: Locale }) {
  const t = getMessages(locale)
  const fr = locale === "fr"
  const shortTitle = fr ? (v.billShortTitleFr ?? v.billShortTitle) : v.billShortTitle
  return (
    <article className="group relative grid gap-x-8 gap-y-3 border-b border-rule py-5 md:grid-cols-[6.5rem_1fr_17rem]">
      <div className="order-2 flex items-baseline gap-3 text-[0.8125rem] text-ink-3 md:order-none md:block">
        <p className="text-ink-2">
          <time dateTime={v.date}>{formatShortDate(v.date, referenceYear, locale)}</time>
        </p>
        <p className="md:mt-0.5">{t.home.voteN(v.number)}</p>
      </div>
      <div className="order-1 min-w-0 md:order-none">
        <h3 className="text-[1rem] leading-snug text-ink">
          <Link href={localePath(locale, `/votes/${v.sessionId}/${v.number}`)} className="after:absolute after:inset-0 group-hover:underline">
            {fr ? (v.descriptionFr ?? v.descriptionEn) : v.descriptionEn}
          </Link>
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-4 text-[0.8125rem] text-ink-3">
          {v.billNumber && (
            <Link href={localePath(locale, `/bills/${v.billSession}/${v.billNumber}`)} className="link relative z-10">
              {v.billNumber}
              {shortTitle ? `, ${shortTitle}` : ""}
            </Link>
          )}
          {v.hasPartySplit && <span>{t.votes.split}</span>}
        </p>
      </div>
      <VoteTally className="order-3 md:order-none" yeas={v.yeas} nays={v.nays} paired={v.paired} result={v.result} locale={locale} />
    </article>
  )
}
