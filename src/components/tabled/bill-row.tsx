import Link from "next/link"
import type { BillListItem, Party } from "@/lib/queries"
import { formatShortDate } from "@/lib/format"
import { PartyTag } from "./party-tag"
import { StageProgress } from "./stage-progress"

/** One bill in a ruled list: number, title, plain-English line, progress, sponsor, last activity. */
export function BillRow({
  bill,
  party,
  referenceYear,
  dateField = "activity",
}: {
  bill: BillListItem
  party?: Party
  referenceYear?: number
  /** Which date the right-hand column shows; it is labelled either way. */
  dateField?: "activity" | "introduced"
}) {
  const title = bill.shortTitle ?? bill.title
  return (
    <article className="group relative grid gap-x-6 gap-y-2 border-b border-rule py-5 sm:grid-cols-[5.5rem_1fr_auto]">
      <p className="font-display text-xl leading-tight font-semibold text-ink tabular-nums sm:pt-0.5">{bill.number}</p>
      <div className="min-w-0">
        <h3 className="text-[1.0625rem] leading-snug font-medium text-ink">
          <Link
            href={`/bills/${bill.sessionId}/${bill.number}`}
            className="decoration-accent-ink/40 underline-offset-[0.2em] after:absolute after:inset-0 group-hover:underline"
          >
            {title}
          </Link>
        </h3>
        {bill.tldr ? (
          <p className="measure mt-1 text-[0.9375rem] leading-relaxed text-ink-2">{bill.tldr}</p>
        ) : bill.shortTitle ? (
          <p className="measure mt-1 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-3">{bill.title}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          <StageProgress stages={bill.stages} currentStage={bill.currentStage} />
          <span className="text-[0.8125rem] text-ink-3">{bill.typeLabel}</span>
          {bill.sponsorName && (
            <span className="text-[0.8125rem] text-ink-3">
              {bill.sponsorMemberId && party ? (
                <PartyTag partyId={party.id} label={bill.sponsorName} className="text-ink-3" />
              ) : bill.chamber === "senate" ? (
                `Senator ${bill.sponsorName}`
              ) : (
                bill.sponsorName
              )}
            </span>
          )}
        </div>
      </div>
      <p className="text-[0.8125rem] whitespace-nowrap text-ink-3 sm:text-right">
        <span className="sm:block">{dateField === "introduced" ? "Introduced" : "Last activity"}</span>{" "}
        <span className="text-ink-2">{formatShortDate(dateField === "introduced" ? bill.introducedDate : bill.lastActivityDate, referenceYear)}</span>
      </p>
    </article>
  )
}
