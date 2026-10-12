"use client"

import { useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { useDeferredValue, useMemo, useState } from "react"
import { BillRow } from "@/components/tabled/bill-row"
import { EmptyState } from "@/components/tabled/states"
import { DEFAULT_BILL_FILTERS, filterBills, readBillFilters } from "@/lib/bill-filters"
import type { BillListItem, Party } from "@/lib/queries"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyShort } from "@/i18n/parties"
import { stageInfo } from "@/lib/stages"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"
import { FilterSelect, ResultCount, SearchField } from "./controls"

const STAGE_KEYS = {
  house: ["first-reading", "second-reading", "committee", "report", "third-reading"],
  senate: ["first-reading", "second-reading", "committee", "third-reading"],
}

const PAGE = 25

interface Props {
  bills: BillListItem[]
  parties: Party[]
  referenceYear: number
  locale: Locale
}

export function BillsExplorerWithParams(props: Props) {
  const sp = useSearchParams()
  return <BillsExplorer {...props} params={paramsToRecord(sp)} interactive />
}

export function BillsExplorer({ bills, parties, referenceYear, locale, params, interactive = false }: Props & { params: Record<string, string>; interactive?: boolean }) {
  const m = getMessages(locale)
  const t = m.bills
  const filters = readBillFilters(params)
  const set = useReplaceParams(params, DEFAULT_BILL_FILTERS as unknown as Record<string, string>)
  const q = useDeferredValue(filters.q)
  const shown = useMemo(() => filterBills(bills, { ...filters, q }), [bills, filters, q])
  const partyById = useMemo(() => new Map(parties.map((p) => [p.id, p])), [parties])
  const sponsorParties = parties.filter((p) => bills.some((b) => b.sponsorPartyId === p.id))
  const filterKey = JSON.stringify({ ...filters, q })
  const [page, setPage] = useState({ key: filterKey, limit: PAGE })
  const limit = page.key === filterKey ? page.limit : PAGE
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeFilters = [filters.stage, filters.chamber, filters.type, filters.party, filters.law].filter(Boolean).length

  const stageOptions = [
    { value: "", label: t.anyStage },
    { value: "house", label: t.inHouse },
    { value: "senate", label: t.inSenate },
    { value: "law", label: t.becameLaw },
    { value: "defeated", label: t.defeated },
    { group: t.houseGroup, options: STAGE_KEYS.house.map((k) => ({ value: `house:${k}`, label: `${t.housePrefix} : ${stageInfo(`house:${k}`, locale).label}`.replace(" : ", locale === "fr" ? " : " : ": ") })) },
    { group: t.senateGroup, options: STAGE_KEYS.senate.map((k) => ({ value: `senate:${k}`, label: `${t.senatePrefix} : ${stageInfo(`senate:${k}`, locale).label}`.replace(" : ", locale === "fr" ? " : " : ": ") })) },
  ]

  return (
    <div>
      <div
        role="search"
        aria-label={locale === "fr" ? "Filtrer les projets de loi" : "Filter bills"}
        className="grid grid-cols-2 gap-3 border-b border-rule py-5 md:grid-cols-3 lg:grid-cols-6"
        inert={!interactive ? true : undefined}
      >
        <SearchField
          className="col-span-2 md:col-span-3 lg:col-span-6 xl:col-span-2"
          label={m.filters.search}
          value={filters.q}
          onChange={(v) => set({ q: v })}
          placeholder={t.placeholder}
          locale={locale}
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((o) => !o)}
          aria-expanded={filtersOpen}
          aria-controls="bill-filters"
          className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-sm border border-rule bg-paper-raised text-[0.9375rem] text-ink-2 md:hidden"
        >
          <SlidersHorizontal aria-hidden className="size-4" strokeWidth={1.75} />
          {filtersOpen ? m.filters.hideFilters : m.filters.filters}
          {activeFilters > 0 && <span className="rounded-full bg-ink px-1.5 text-[0.75rem] text-paper">{activeFilters}</span>}
        </button>
        <div id="bill-filters" className={`col-span-2 grid-cols-2 gap-3 md:col-span-3 md:grid md:grid-cols-3 lg:col-span-6 lg:grid-cols-6 xl:col-span-4 xl:grid-cols-[repeat(6,minmax(0,1fr))] ${filtersOpen ? "grid" : "hidden"}`}>
        <FilterSelect label={t.stage} value={filters.stage} onChange={(v) => set({ stage: v })} options={stageOptions} />
        <FilterSelect
          label={t.startsIn}
          value={filters.chamber}
          onChange={(v) => set({ chamber: v })}
          options={[
            { value: "", label: t.either },
            { value: "house", label: t.house },
            { value: "senate", label: t.senate },
          ]}
        />
        <FilterSelect
          label={t.type}
          value={filters.type}
          onChange={(v) => set({ type: v })}
          options={[
            { value: "", label: t.allTypes },
            { value: "government", label: t.types.government },
            { value: "private_member", label: t.types.private_member },
            { value: "senate_public", label: t.types.senate_public },
            { value: "senate_private", label: t.types.senate_private },
          ]}
        />
        <FilterSelect
          label={t.sponsorParty}
          value={filters.party}
          onChange={(v) => set({ party: v })}
          options={[{ value: "", label: t.anyParty }, ...sponsorParties.map((p) => ({ value: p.id, label: partyShort(p, locale) }))]}
        />
        <FilterSelect
          label={t.lawFilter}
          value={filters.law}
          onChange={(v) => set({ law: v })}
          options={[
            { value: "", label: t.lawEither },
            { value: "yes", label: t.lawYes },
            { value: "no", label: t.lawNo },
          ]}
        />
        <FilterSelect
          label={m.filters.sortBy}
          defaultValue="activity"
          value={filters.sort}
          onChange={(v) => set({ sort: v })}
          options={[
            { value: "activity", label: t.sortActivity },
            { value: "introduced", label: t.sortIntroduced },
            { value: "number", label: t.sortNumber },
          ]}
        />
        </div>
      </div>
      <div className="flex items-center justify-between py-3">
        <ResultCount
          shown={shown.length}
          total={bills.length}
          noun={t.noun}
          locale={locale}
          onReset={() => set({ q: null, stage: null, chamber: null, type: null, party: null, law: null, sort: null })}
        />
      </div>
      {shown.length === 0 ? (
        <EmptyState
          title={t.noneMatch}
          action={
            <button type="button" className="link text-[0.9375rem]" onClick={() => set({ q: null, stage: null, chamber: null, type: null, party: null, law: null })}>
              {m.filters.clearAll}
            </button>
          }
        >
          {t.noneHint}
        </EmptyState>
      ) : (
        <>
          <h2 className="sr-only">{m.filters.results}</h2>
          <div className="border-t border-rule">
            {shown.slice(0, limit).map((b) => (
              <BillRow key={b.id} bill={b} party={b.sponsorPartyId ? partyById.get(b.sponsorPartyId) : undefined} referenceYear={referenceYear} dateField={filters.sort === "introduced" ? "introduced" : "activity"} locale={locale} />
            ))}
          </div>
          {shown.length > limit && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setPage({ key: filterKey, limit: limit + PAGE * 2 })}
                className="h-10 rounded-sm border border-rule-strong px-5 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                {m.filters.showMore(shown.length - limit)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
