"use client"

import Link from "next/link"
import { useState } from "react"
import { formatShortDate } from "@/lib/format"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { cn } from "@/lib/utils"

export interface RecordRow {
  voteId: string
  number: number
  sessionId: string
  date: string
  description: string
  descriptionFr?: string | null
  result: "passed" | "failed" | "tied"
  ballot: "yea" | "nay" | "paired" | "absent"
  isDissent: boolean
  billNumber: string | null
}

const PAGE = 25

export function VotingRecord({
  rows: allRows,
  referenceYear,
  locale = "en",
  sessions = [],
}: {
  rows: RecordRow[]
  referenceYear: number
  locale?: Locale
  /** Sessions this MP has votes in; a selector appears when there is more than one. */
  sessions?: Array<{ id: string; label: string }>
}) {
  const [session, setSession] = useState(sessions[0]?.id ?? "")
  const rows = session ? allRows.filter((r) => r.sessionId === session) : allRows
  const m = getMessages(locale)
  const t = m.mp
  const LABEL = { yea: m.vote.yea, nay: m.vote.nay, paired: m.vote.paired, absent: m.vote.didNotVote }
  const [dissentOnly, setDissentOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const dissents = rows.filter((r) => r.isDissent).length
  const shown = dissentOnly ? rows.filter((r) => r.isDissent) : rows
  return (
    <div>
      {sessions.length > 1 && (
        <div role="group" aria-label={locale === "fr" ? "Session" : "Session"} className="mt-4 inline-flex flex-wrap rounded-sm border border-rule p-0.5 text-[0.8125rem]">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={session === s.id}
              onClick={() => {
                setSession(s.id)
                setLimit(PAGE)
              }}
              className={cn("rounded-[2px] px-2.5 py-1 transition-colors duration-150", session === s.id ? "bg-ink text-paper" : "text-ink-2 hover:text-ink")}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm text-ink-3" aria-live="polite">
          {dissentOnly ? t.brokeCount(shown.length) : t.recordCount(rows.length)}
        </p>
        <label className={cn("flex cursor-pointer items-center gap-2 text-[0.9375rem] text-ink-2", dissents === 0 && "cursor-not-allowed opacity-60")}>
          <input type="checkbox" disabled={dissents === 0} checked={dissentOnly} onChange={(e) => setDissentOnly(e.target.checked)} className="size-4 accent-[var(--accent-ink)]" />
          {t.onlyAgainst(dissents)}
        </label>
      </div>
      <ol className="border-t border-rule">
        {shown.slice(0, limit).map((r) => (
          <li key={r.voteId} className={cn("group relative grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-b border-rule py-3 sm:grid-cols-[5.5rem_1fr_9rem]", r.isDissent && "bg-accent-wash/50")}>
            <p className="text-[0.8125rem] text-ink-3 sm:pt-0.5">
              <time dateTime={r.date}>{formatShortDate(r.date, referenceYear, locale)}</time>
            </p>
            <div className="col-span-2 min-w-0 sm:col-span-1 sm:row-start-1 sm:col-start-2">
              <Link href={localePath(locale, `/votes/${r.sessionId}/${r.number}`)} className="line-clamp-2 text-[0.9375rem] leading-snug text-ink after:absolute after:inset-0 group-hover:underline">
                {locale === "fr" ? (r.descriptionFr ?? r.description) : r.description}
              </Link>
              <p className="text-[0.8125rem] text-ink-3">
                {m.home.voteN(r.number)} · {m.vote[r.result]}
              </p>
            </div>
            <p className="row-start-1 text-right text-[0.9375rem] sm:col-start-3">
              <span className={cn(r.ballot === "absent" || r.ballot === "paired" ? "text-ink-3" : "text-ink")}>{LABEL[r.ballot]}</span>
              {r.isDissent && <span className="block text-[0.75rem] font-medium text-accent-ink">{t.againstParty}</span>}
            </p>
          </li>
        ))}
      </ol>
      {shown.length > limit && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setLimit((l) => l + PAGE * 2)} className="h-10 rounded-sm border border-rule-strong px-5 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper">
            {m.filters.showMore(shown.length - limit)}
          </button>
        </div>
      )}
    </div>
  )
}
