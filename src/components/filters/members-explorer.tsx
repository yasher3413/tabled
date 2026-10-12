"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useDeferredValue, useMemo, useState } from "react"
import { MemberAvatar } from "@/components/tabled/member-avatar"
import { PartySwatch } from "@/components/tabled/party-tag"
import { EmptyState } from "@/components/tabled/states"
import type { Locale } from "@/i18n/config"
import { localePath } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { partyShort } from "@/i18n/parties"
import { formatPercent, provinces } from "@/lib/format"
import { DEFAULT_MEMBER_FILTERS, filterMembers, readMemberFilters } from "@/lib/member-filters"
import type { MemberListItem, Party } from "@/lib/queries"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"
import { FilterSelect, ResultCount, SearchField } from "./controls"

const PAGE = 60

interface Props {
  membersBySession: Record<string, MemberListItem[]>
  sessions: Array<{ id: string; label: string; isCurrent: boolean }>
  parties: Party[]
  locale: Locale
}

export function MembersExplorerWithParams(props: Props) {
  const sp = useSearchParams()
  return <MembersExplorer {...props} params={paramsToRecord(sp)} interactive />
}

export function MembersExplorer({ membersBySession, sessions, parties, locale, params, interactive = false }: Props & { params: Record<string, string>; interactive?: boolean }) {
  const m0 = getMessages(locale)
  const t = m0.mps
  const current = sessions.find((s) => s.isCurrent) ?? sessions[0]
  const session = sessions.find((s) => s.id === params.session) ?? current
  const members = membersBySession[session.id] ?? []
  // "Current MPs" only means something for the current session; earlier sessions list everyone who sat.
  const f = { ...readMemberFilters(params), ...(session.isCurrent ? {} : { status: "all" }) }
  const set = useReplaceParams(params, DEFAULT_MEMBER_FILTERS as unknown as Record<string, string>)
  const q = useDeferredValue(f.q)
  const shown = filterMembers(members, { ...f, q })
  const partyName = useMemo(() => new Map(parties.map((p) => [p.id, partyShort(p, locale)])), [parties, locale])
  const pool = filterMembers(members, { ...DEFAULT_MEMBER_FILTERS, status: f.status })
  const reset = () => set({ q: null, party: null, province: null, status: null, sort: null, session: null })
  const filterKey = JSON.stringify({ ...f, q })
  const [page, setPage] = useState({ key: filterKey, limit: PAGE })
  const limit = page.key === filterKey ? page.limit : PAGE

  return (
    <div>
      <div role="search" aria-label={locale === "fr" ? "Filtrer les députés" : "Filter MPs"} inert={!interactive ? true : undefined} className={`grid grid-cols-2 gap-3 border-b border-rule py-5 ${sessions.length > 1 ? "md:grid-cols-3 lg:grid-cols-[2fr_repeat(5,minmax(0,1fr))]" : "md:grid-cols-[2fr_repeat(4,minmax(0,1fr))]"}`}>
        <SearchField className="col-span-2 md:col-span-1" label={m0.filters.search} value={f.q} onChange={(v) => set({ q: v })} placeholder={t.placeholder} locale={locale} />
        <FilterSelect label={t.party} value={f.party} onChange={(v) => set({ party: v })} options={[{ value: "", label: t.allParties }, ...parties.map((p) => ({ value: p.id, label: partyShort(p, locale) }))]} />
        <FilterSelect
          label={t.province}
          value={f.province}
          onChange={(v) => set({ province: v })}
          options={[{ value: "", label: t.anywhere }, ...Object.entries(provinces(locale)).map(([code, name]) => ({ value: code, label: name }))]}
        />
        {sessions.length > 1 && (
          <FilterSelect
            label={locale === "fr" ? "Session" : "Session"}
            value={session.isCurrent ? "" : session.id}
            onChange={(v) => set({ session: v || null })}
            options={sessions.map((s) => ({ value: s.isCurrent ? "" : s.id, label: s.label }))}
          />
        )}
        <FilterSelect
          label={t.show}
          defaultValue={session.isCurrent ? "current" : "all"}
          value={f.status}
          onChange={(v) => set({ status: v })}
          options={[
            { value: "current", label: t.current },
            { value: "former", label: t.former },
            { value: "all", label: t.everyone },
          ]}
        />
        <FilterSelect
          label={m0.filters.sortBy}
          defaultValue="name"
          value={f.sort}
          onChange={(v) => set({ sort: v })}
          options={[
            { value: "name", label: t.sortName },
            { value: "party-line", label: t.sortPartyLine },
            { value: "attendance", label: t.sortAttendance },
            { value: "dissent", label: t.sortDissent },
            { value: "bills", label: t.sortBills },
          ]}
        />
      </div>
      <div className="py-3">
        <ResultCount shown={shown.length} total={pool.length} noun={f.status === "former" ? t.formerNoun : t.noun} onReset={reset} locale={locale} />
      </div>
      {shown.length === 0 ? (
        <EmptyState title={t.noneMatch} action={<button type="button" className="link text-[0.9375rem]" onClick={reset}>{m0.filters.clearAll}</button>}>
          {t.noneHint}{" "}
          <Link className="link" href={localePath(locale, "/find")}>
            {t.usePostal}
          </Link>
          .
        </EmptyState>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[0.9375rem]">
            <caption className="sr-only">{t.caption}</caption>
            <thead>
              <tr className="border-y border-rule-strong text-left text-xs text-ink-3">
                <th scope="col" className="py-2 pr-3 font-medium">{t.mp}</th>
                <th scope="col" className="hidden py-2 pr-3 font-medium md:table-cell">{t.riding}</th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  <abbr title={t.partyLineTitle} className="no-underline">{t.partyLine}</abbr>
                </th>
                <th scope="col" className="hidden py-2 pr-3 text-right font-medium sm:table-cell">{t.votesCast}</th>
                <th scope="col" className="hidden py-2 text-right font-medium lg:table-cell">{t.bills}</th>
              </tr>
            </thead>
            <tbody>
              {shown.slice(0, limit).map((m) => (
                <tr key={m.id} className="group relative border-b border-rule hover:bg-paper-sunk/60">
                  <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                    <span className="flex items-center gap-3">
                      <MemberAvatar name={m.name} size="sm" />
                      <span className="min-w-0">
                        <Link href={localePath(locale, `/mps/${m.id}`)} className="name-sc block text-ink after:absolute after:inset-0 group-hover:underline">
                          {m.name}
                        </Link>
                        <span className="flex items-center gap-1.5 text-[0.8125rem] text-ink-3">
                          <PartySwatch partyId={m.partyId} />
                          {partyName.get(m.partyId ?? "") ?? t.noParty}
                          <span className="md:hidden">· {m.ridingName}</span>
                          {!m.active && <span>· {t.left(m.endDate?.slice(0, 4) ?? "")}</span>}
                        </span>
                      </span>
                    </span>
                  </th>
                  <td className="hidden py-2.5 pr-3 text-ink-2 md:table-cell">
                    {m.ridingName}
                    {m.province && <span className="text-ink-3">, {m.province}</span>}
                  </td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{formatPercent(m.partyLineRate, 1, locale)}</td>
                  <td className="hidden py-2.5 pr-3 text-right text-ink-2 tabular-nums sm:table-cell">
                    {m.votesHeld ? t.of(m.votesCast, m.votesHeld) : formatPercent(null, 1, locale)}
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
                {m0.filters.showMore(shown.length - limit)}
              </button>
            </div>
          )}
        </div>
      )}
      <p className="mt-6 text-[0.8125rem] text-ink-3">
        {t.methodology}{" "}
        <Link className="link" href={localePath(locale, "/about#methodology")}>
          {t.methodologyLink}
        </Link>
        .
      </p>
    </div>
  )
}
