"use client"

import { useSearchParams } from "next/navigation"
import { useDeferredValue, useMemo, useState } from "react"
import { EmptyState } from "@/components/tabled/states"
import { VoteRow } from "@/components/tabled/vote-row"
import type { VoteListItem } from "@/lib/queries"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"
import { DEFAULT_VOTE_FILTERS, filterVotes, readVoteFilters, voteMonths } from "@/lib/vote-filters"
import { FilterSelect, ResultCount, SearchField } from "./controls"

const PAGE = 50
const monthFmt = new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" })

interface Props {
  votes: VoteListItem[]
  referenceYear: number
}

export function VotesExplorerWithParams(props: Props) {
  const sp = useSearchParams()
  return <VotesExplorer {...props} params={paramsToRecord(sp)} interactive />
}

export function VotesExplorer({ votes, referenceYear, params, interactive = false }: Props & { params: Record<string, string>; interactive?: boolean }) {
  const f = readVoteFilters(params)
  const set = useReplaceParams(params, DEFAULT_VOTE_FILTERS as unknown as Record<string, string>)
  const q = useDeferredValue(f.q)
  const shown = useMemo(() => filterVotes(votes, { ...f, q }), [votes, f, q])
  const months = useMemo(() => voteMonths(votes), [votes])
  const [limit, setLimit] = useState(PAGE)
  const reset = () => set({ q: null, result: null, kind: null, split: null, month: null })

  return (
    <div>
      <div role="search" aria-label="Filter votes" inert={!interactive ? true : undefined} className="grid grid-cols-2 gap-3 border-b border-rule py-5 md:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
        <SearchField className="col-span-2 md:col-span-1" label="Search" value={f.q} onChange={(v) => set({ q: v })} placeholder="Words, bill number or vote number" />
        <FilterSelect
          label="Result"
          value={f.result}
          onChange={(v) => set({ result: v })}
          options={[
            { value: "", label: "Any result" },
            { value: "passed", label: "Passed" },
            { value: "failed", label: "Failed" },
            { value: "tied", label: "Tied" },
          ]}
        />
        <FilterSelect
          label="About"
          value={f.kind}
          onChange={(v) => set({ kind: v })}
          options={[
            { value: "", label: "Anything" },
            { value: "bill", label: "A bill" },
            { value: "other", label: "Motions and other" },
          ]}
        />
        <FilterSelect
          label="Party lines"
          value={f.split}
          onChange={(v) => set({ split: v })}
          options={[
            { value: "", label: "All votes" },
            { value: "yes", label: "A party split" },
          ]}
        />
        <FilterSelect
          label="Month"
          value={f.month}
          onChange={(v) => set({ month: v })}
          options={[{ value: "", label: "Any month" }, ...months.map((m) => ({ value: m, label: monthFmt.format(new Date(`${m}-01T00:00:00Z`)) }))]}
        />
      </div>
      <div className="py-3">
        <ResultCount shown={shown.length} total={votes.length} noun="recorded votes" onReset={reset} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No votes match" action={<button type="button" className="link text-[0.9375rem]" onClick={reset}>Clear all filters</button>}>
          Try a different word, or search a bill number like C-5.
        </EmptyState>
      ) : (
        <>
          <div className="border-t border-rule">
            {shown.slice(0, limit).map((v) => (
              <VoteRow key={v.id} vote={v} referenceYear={referenceYear} />
            ))}
          </div>
          {shown.length > limit && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setLimit((l) => l + PAGE)}
                className="h-10 rounded-sm border border-rule-strong px-5 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                Show {Math.min(PAGE, shown.length - limit)} more of {shown.length - limit}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
