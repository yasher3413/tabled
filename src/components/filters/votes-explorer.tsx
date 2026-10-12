"use client"

import { useSearchParams } from "next/navigation"
import { useDeferredValue, useMemo, useState } from "react"
import { EmptyState } from "@/components/tabled/states"
import { VoteRow } from "@/components/tabled/vote-row"
import type { VoteListItem } from "@/lib/queries"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"
import type { Locale } from "@/i18n/config"
import { INTL_LOCALE } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { DEFAULT_VOTE_FILTERS, filterVotes, readVoteFilters, voteMonths } from "@/lib/vote-filters"
import { FilterSelect, ResultCount, SearchField } from "./controls"

const PAGE = 50

interface Props {
  votes: VoteListItem[]
  referenceYear: number
  locale: Locale
}

export function VotesExplorerWithParams(props: Props) {
  const sp = useSearchParams()
  return <VotesExplorer {...props} params={paramsToRecord(sp)} interactive />
}

export function VotesExplorer({ votes, referenceYear, locale, params, interactive = false }: Props & { params: Record<string, string>; interactive?: boolean }) {
  const m = getMessages(locale)
  const t = m.votes
  const monthFmt = new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "long", year: "numeric", timeZone: "UTC" })
  const f = readVoteFilters(params)
  const set = useReplaceParams(params, DEFAULT_VOTE_FILTERS as unknown as Record<string, string>)
  const q = useDeferredValue(f.q)
  const shown = useMemo(() => filterVotes(votes, { ...f, q }), [votes, f, q])
  const months = useMemo(() => voteMonths(votes), [votes])
  const [limit, setLimit] = useState(PAGE)
  const reset = () => set({ q: null, result: null, kind: null, split: null, month: null })

  return (
    <div>
      <div role="search" aria-label={locale === "fr" ? "Filtrer les votes" : "Filter votes"} inert={!interactive ? true : undefined} className="grid grid-cols-2 gap-3 border-b border-rule py-5 md:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
        <SearchField className="col-span-2 md:col-span-1" label={m.filters.search} value={f.q} onChange={(v) => set({ q: v })} placeholder={t.placeholder} locale={locale} />
        <FilterSelect
          label={t.result}
          value={f.result}
          onChange={(v) => set({ result: v })}
          options={[
            { value: "", label: t.anyResult },
            { value: "passed", label: m.vote.passed },
            { value: "failed", label: m.vote.failed },
            { value: "tied", label: m.vote.tied },
          ]}
        />
        <FilterSelect
          label={t.about}
          value={f.kind}
          onChange={(v) => set({ kind: v })}
          options={[
            { value: "", label: t.anything },
            { value: "bill", label: t.aBill },
            { value: "other", label: t.motions },
          ]}
        />
        <FilterSelect
          label={t.partyLines}
          value={f.split}
          onChange={(v) => set({ split: v })}
          options={[
            { value: "", label: t.allVotes },
            { value: "yes", label: t.partySplit },
          ]}
        />
        <FilterSelect
          label={t.month}
          value={f.month}
          onChange={(v) => set({ month: v })}
          options={[{ value: "", label: t.anyMonth }, ...months.map((m) => ({ value: m, label: monthFmt.format(new Date(`${m}-01T00:00:00Z`)) }))]}
        />
      </div>
      <div className="py-3">
        <ResultCount shown={shown.length} total={votes.length} noun={t.noun} onReset={reset} locale={locale} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t.noneMatch} action={<button type="button" className="link text-[0.9375rem]" onClick={reset}>{m.filters.clearAll}</button>}>
          {t.noneHint}
        </EmptyState>
      ) : (
        <>
          <div className="border-t border-rule">
            {shown.slice(0, limit).map((v) => (
              <VoteRow key={v.id} vote={v} referenceYear={referenceYear} locale={locale} />
            ))}
          </div>
          {shown.length > limit && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="h-10 rounded-sm border border-rule-strong px-5 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                {t.showMore(Math.min(PAGE, shown.length - limit), shown.length - limit)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
