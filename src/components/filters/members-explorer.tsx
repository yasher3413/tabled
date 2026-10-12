"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useDeferredValue, useMemo, useState } from "react"
import { MemberAvatar } from "@/components/tabled/member-avatar"
import { PartySwatch } from "@/components/tabled/party-tag"
import { EmptyState } from "@/components/tabled/states"
import { formatPercent, PROVINCES } from "@/lib/format"
import { DEFAULT_MEMBER_FILTERS, filterMembers, readMemberFilters } from "@/lib/member-filters"
import type { MemberListItem, Party } from "@/lib/queries"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"
import { FilterSelect, ResultCount, SearchField } from "./controls"

const PAGE = 60

interface Props {
  members: MemberListItem[]
  parties: Party[]
}

export function MembersExplorerWithParams(props: Props) {
  const sp = useSearchParams()
  return <MembersExplorer {...props} params={paramsToRecord(sp)} interactive />
}

export function MembersExplorer({ members, parties, params, interactive = false }: Props & { params: Record<string, string>; interactive?: boolean }) {
  const f = readMemberFilters(params)
  const set = useReplaceParams(params, DEFAULT_MEMBER_FILTERS as unknown as Record<string, string>)
  const q = useDeferredValue(f.q)
  const shown = useMemo(() => filterMembers(members, { ...f, q }), [members, f, q])
  const partyName = useMemo(() => new Map(parties.map((p) => [p.id, p.shortName])), [parties])
  const pool = filterMembers(members, { ...DEFAULT_MEMBER_FILTERS, status: f.status })
  const reset = () => set({ q: null, party: null, province: null, status: null, sort: null })
  const filterKey = JSON.stringify({ ...f, q })
  const [page, setPage] = useState({ key: filterKey, limit: PAGE })
  const limit = page.key === filterKey ? page.limit : PAGE

  return (
    <div>
      <div role="search" aria-label="Filter MPs" inert={!interactive ? true : undefined} className="grid grid-cols-2 gap-3 border-b border-rule py-5 md:grid-cols-[2fr_repeat(4,minmax(0,1fr))]">
        <SearchField className="col-span-2 md:col-span-1" label="Search" value={f.q} onChange={(v) => set({ q: v })} placeholder="Name or riding" />
        <FilterSelect label="Party" value={f.party} onChange={(v) => set({ party: v })} options={[{ value: "", label: "All parties" }, ...parties.map((p) => ({ value: p.id, label: p.shortName }))]} />
        <FilterSelect
          label="Province or territory"
          value={f.province}
          onChange={(v) => set({ province: v })}
          options={[{ value: "", label: "Anywhere" }, ...Object.entries(PROVINCES).map(([code, name]) => ({ value: code, label: name }))]}
        />
        <FilterSelect
          label="Show"
          defaultValue="current"
          value={f.status}
          onChange={(v) => set({ status: v })}
          options={[
            { value: "current", label: "Current MPs" },
            { value: "former", label: "Left this session" },
            { value: "all", label: "Everyone" },
          ]}
        />
        <FilterSelect
          label="Sort by"
          defaultValue="name"
          value={f.sort}
          onChange={(v) => set({ sort: v })}
          options={[
            { value: "name", label: "Last name" },
            { value: "party-line", label: "Party-line rate" },
            { value: "attendance", label: "Votes cast" },
            { value: "dissent", label: "Times broke ranks" },
            { value: "bills", label: "Bills sponsored" },
          ]}
        />
      </div>
      <div className="py-3">
        <ResultCount shown={shown.length} total={pool.length} noun={f.status === "former" ? "former MPs" : "MPs"} onReset={reset} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No MPs match" action={<button type="button" className="link text-[0.9375rem]" onClick={reset}>Clear all filters</button>}>
          Try a different spelling, or search by riding name. Looking for your own MP?{" "}
          <Link className="link" href="/find">
            Use your postal code
          </Link>
          .
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[0.9375rem]">
            <caption className="sr-only">Members of Parliament</caption>
            <thead>
              <tr className="border-y border-rule-strong text-left text-xs text-ink-3">
                <th scope="col" className="py-2 pr-3 font-medium">MP</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">Riding</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  <abbr title="Share of votes where the MP voted with their party's majority" className="no-underline">Party line</abbr>
                </th>
                <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">Votes cast</th>
                <th scope="col" className="hidden py-2 text-right font-medium lg:table-cell">Bills</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, limit).map((m) => (
                <tr key={m.id} className="group relative border-b border-rule hover:bg-paper-sunk/60">
                  <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <MemberAvatar name={m.name} size="sm" />
                      <span className="min-w-0">
                        <Link href={`/mps/${m.id}`} className="name-sc block text-ink after:absolute after:inset-0 group-hover:underline">
                          {m.name}
                        </Link>
                        <span className="flex items-center gap-1.5 text-[0.8125rem] text-ink-3">
                          <PartySwatch partyId={m.partyId} />
                          {partyName.get(m.partyId ?? "") ?? "No party"}
                          <span className="md:hidden">· {m.ridingName}</span>
                          {!m.active && <span>· left {m.endDate?.slice(0, 4)}</span>}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="hidden py-2.5 pr-3 text-ink-2 md:table-cell">
                    {m.ridingName}
                    {m.province && <span className="text-ink-3">, {m.province}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{formatPercent(m.partyLineRate)}</td>
                  <td className="hidden py-2.5 pr-3 text-right text-ink-2 tabular-nums sm:table-cell">
                    {m.votesHeld ? `${m.votesCast} of ${m.votesHeld}` : "n/a"}
                  </td>
                  <td className="hidden py-2.5 text-right text-ink-2 tabular-nums lg:table-cell">{m.billsSponsored}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {shown.length > limit && (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setPage({ key: filterKey, limit: limit + PAGE * 2 })}
                className="h-10 rounded-sm border border-rule-strong px-5 text-[0.9375rem] text-ink transition-colors duration-150 hover:bg-ink hover:text-paper"
              >
                Show more ({shown.length - limit} left)
              </button>
            </div>
          )}
        </div>
      )}
      <p className="mt-6 text-[0.8125rem] text-ink-3">
        How these are calculated, and why a missed vote is not a mark against anyone:{" "}
        <Link className="link" href="/about#methodology">
          methodology
        </Link>
        .
      </p>
    </div>
  )
}
