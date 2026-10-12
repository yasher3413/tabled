"use client"

import Link from "next/link"
import { useState } from "react"
import { formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export interface RecordRow {
  voteId: string
  number: number
  sessionId: string
  date: string
  description: string
  result: "passed" | "failed" | "tied"
  ballot: "yea" | "nay" | "paired" | "absent"
  isDissent: boolean
  billNumber: string | null
}

const LABEL = { yea: "Yea", nay: "Nay", paired: "Paired", absent: "Did not vote" }
const PAGE = 25

export function VotingRecord({ rows, referenceYear }: { rows: RecordRow[]; referenceYear: number }) {
  const [dissentOnly, setDissentOnly] = useState(false)
  const [limit, setLimit] = useState(PAGE)
  const dissents = rows.filter((r) => r.isDissent).length
  const shown = dissentOnly ? rows.filter((r) => r.isDissent) : rows
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 py-3">
        <p className="text-sm text-ink-3" aria-live="polite">
          {dissentOnly ? `${shown.length} times broke ranks` : `${rows.length} recorded votes, newest first`}
        </p>
        <label className={cn("flex cursor-pointer items-center gap-2 text-[0.9375rem] text-ink-2", dissents === 0 && "cursor-not-allowed opacity-60")}>
          <input type="checkbox" disabled={dissents === 0} checked={dissentOnly} onChange={(e) => setDissentOnly(e.target.checked)} className="size-4 accent-[var(--accent-ink)]" />
          Only votes against their party ({dissents})
        </label>
      </div>
      <ol className="border-t border-rule">
        {shown.slice(0, limit).map((r) => (
          <li key={r.voteId} className={cn("group relative grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 border-b border-rule py-3 sm:grid-cols-[5.5rem_1fr_9rem]", r.isDissent && "bg-accent-wash/50")}>
            <p className="text-[0.8125rem] text-ink-3 sm:pt-0.5">
              <time dateTime={r.date}>{formatShortDate(r.date, referenceYear)}</time>
            </p>
            <div className="col-span-2 min-w-0 sm:col-span-1 sm:row-start-1 sm:col-start-2">
              <Link href={`/votes/${r.sessionId}/${r.number}`} className="line-clamp-2 text-[0.9375rem] leading-snug text-ink after:absolute after:inset-0 group-hover:underline">
                {r.description}
              </Link>
              <p className="text-[0.8125rem] text-ink-3">
                Vote {r.number} · {r.result === "passed" ? "Passed" : r.result === "failed" ? "Failed" : "Tied"}
              </p>
            </div>
            <p className="row-start-1 text-right text-[0.9375rem] sm:col-start-3">
              <span className={cn(r.ballot === "absent" || r.ballot === "paired" ? "text-ink-3" : "text-ink")}>{LABEL[r.ballot]}</span>
              {r.isDissent && <span className="block text-[0.75rem] font-medium text-accent-ink">Against party</span>}
            </p>
          </li>
        ))}
      </ol>
      {shown.length > limit && (
        <div className="mt-6 text-center">
          <button type="button" onClick={() => setLimit((l) => l + PAGE * 2)} className="h-10 rounded-sm border border-rule-strong px-5 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper">
            Show more ({shown.length - limit} left)
          </button>
        </div>
      )}
    </div>
  )
}
