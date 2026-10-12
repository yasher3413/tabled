"use client"

import { useSearchParams } from "next/navigation"
import { useDeferredValue, useMemo } from "react"
import { BillRow } from "@/components/tabled/bill-row"
import { EmptyState } from "@/components/tabled/states"
import { DEFAULT_BILL_FILTERS, filterBills, readBillFilters } from "@/lib/bill-filters"
import type { BillListItem, Party } from "@/lib/queries"
import { stageInfo } from "@/lib/stages"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"
import { FilterSelect, ResultCount, SearchField } from "./controls"

const STAGE_KEYS = {
  house: ["first-reading", "second-reading", "committee", "report", "third-reading"],
  senate: ["first-reading", "second-reading", "committee", "third-reading"],
}

interface Props {
  bills: BillListItem[]
  parties: Party[]
  referenceYear: number
}

export function BillsExplorerWithParams(props: Props) {
  const sp = useSearchParams()
  return <BillsExplorer {...props} params={paramsToRecord(sp)} interactive />
}

export function BillsExplorer({ bills, parties, referenceYear, params, interactive = false }: Props & { params: Record<string, string>; interactive?: boolean }) {
  const filters = readBillFilters(params)
  const set = useReplaceParams(params, DEFAULT_BILL_FILTERS as unknown as Record<string, string>)
  const q = useDeferredValue(filters.q)
  const shown = useMemo(() => filterBills(bills, { ...filters, q }), [bills, filters, q])
  const partyById = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties])
  const sponsorParties = parties.filter((p) => bills.some((b) => b.sponsorPartyId === p.id))

  const stageOptions = [
    { value: "", label: "Any stage" },
    { value: "house", label: "Anywhere in the House" },
    { value: "senate", label: "Anywhere in the Senate" },
    { value: "law", label: "Became law" },
    { value: "defeated", label: "Defeated" },
    { group: "House of Commons", options: STAGE_KEYS.house.map((k) => ({ value: `house:${k}`, label: `House: ${stageInfo(`house:${k}`).label}` })) },
    { group: "Senate", options: STAGE_KEYS.senate.map((k) => ({ value: `senate:${k}`, label: `Senate: ${stageInfo(`senate:${k}`).label}` })) },
  ]

  return (
    <div>
      <div
        role="search"
        aria-label="Filter bills"
        className="grid grid-cols-2 gap-3 border-b border-rule py-5 md:grid-cols-4 lg:grid-cols-[2fr_repeat(6,minmax(0,1fr))]"
        inert={!interactive ? true : undefined}
      >
        <SearchField
          className="col-span-2 md:col-span-4 lg:col-span-1"
          label="Search"
          value={filters.q}
          onChange={(v) => set({ q: v })}
          placeholder="Number, title or keyword"
        />
        <FilterSelect label="Stage" value={filters.stage} onChange={(v) => set({ stage: v })} options={stageOptions} />
        <FilterSelect
          label="Starts in"
          value={filters.chamber}
          onChange={(v) => set({ chamber: v })}
          options={[
            { value: "", label: "Either chamber" },
            { value: "house", label: "House of Commons" },
            { value: "senate", label: "Senate" },
          ]}
        />
        <FilterSelect
          label="Type"
          value={filters.type}
          onChange={(v) => set({ type: v })}
          options={[
            { value: "", label: "All types" },
            { value: "government", label: "Government" },
            { value: "private_member", label: "Private member's" },
            { value: "senate_public", label: "Senate public" },
            { value: "senate_private", label: "Senate private" },
          ]}
        />
        <FilterSelect
          label="Sponsor's party"
          value={filters.party}
          onChange={(v) => set({ party: v })}
          options={[{ value: "", label: "Any party" }, ...sponsorParties.map((p) => ({ value: p.id, label: p.shortName }))]}
        />
        <FilterSelect
          label="Became law"
          value={filters.law}
          onChange={(v) => set({ law: v })}
          options={[
            { value: "", label: "Either" },
            { value: "yes", label: "Yes" },
            { value: "no", label: "Not yet" },
          ]}
        />
        <FilterSelect
          label="Sort by"
          defaultValue="activity"
          value={filters.sort}
          onChange={(v) => set({ sort: v })}
          options={[
            { value: "activity", label: "Last activity" },
            { value: "introduced", label: "Date introduced" },
            { value: "number", label: "Bill number" },
          ]}
        />
      </div>
      <div className="flex items-center justify-between py-3">
        <ResultCount
          shown={shown.length}
          total={bills.length}
          noun="bills"
          onReset={() => set({ q: null, stage: null, chamber: null, type: null, party: null, law: null, sort: null })}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState
          title="No bills match"
          action={
            <button type="button" className="link text-[0.9375rem]" onClick={() => set({ q: null, stage: null, chamber: null, type: null, party: null, law: null })}>
              Clear all filters
            </button>
          }
        >
          Try fewer filters, or search for a bill number like C-5.
        </EmptyState>
      ) : (
        <div className="border-t border-rule">
          {shown.map((b) => (
            <BillRow key={b.id} bill={b} party={b.sponsorPartyId ? partyById.get(b.sponsorPartyId) : undefined} referenceYear={referenceYear} />
          ))}
        </div>
      )}
    </div>
  )
}
