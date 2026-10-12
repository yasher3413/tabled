"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { FilterSelect } from "@/components/filters/controls"
import { localePath, type Locale } from "@/i18n/config"
import { compareBallots, type CompactBallot } from "@/lib/compare"
import { formatDate, formatPercent } from "@/lib/format"
import { paramsToRecord, useReplaceParams } from "@/lib/url-state"

export interface CompareMember {
  id: string
  name: string
  party: string
  active: boolean
}
export interface CompareVote {
  id: string
  sessionId: string
  number: number
  date: string
  description: string
}

const cache = new Map<string, Promise<Record<string, CompactBallot>>>()
function loadBallots(slug: string) {
  let p = cache.get(slug)
  if (!p) {
    p = fetch(`/data/mp/${slug}`).then((r) => {
      if (!r.ok) throw new Error(String(r.status))
      return r.json()
    })
    p.catch(() => cache.delete(slug))
    cache.set(slug, p)
  }
  return p
}

const LABEL = {
  en: { y: "Yea", n: "Nay", p: "Paired", a: "Did not vote" },
  fr: { y: "Pour", n: "Contre", p: "Pairé", a: "N’a pas voté" },
}

export function CompareMpsWithParams(props: { members: CompareMember[]; votes: CompareVote[]; locale: Locale }) {
  return <CompareMps {...props} params={paramsToRecord(useSearchParams())} />
}

export function CompareMps({ members, votes, locale, params }: { members: CompareMember[]; votes: CompareVote[]; locale: Locale; params: Record<string, string> }) {
  const fr = locale === "fr"
  const set = useReplaceParams(params)
  const a = members.find((m) => m.id === params.a)
  const b = members.find((m) => m.id === params.b)
  const [data, setData] = useState<{ key: string; a: Record<string, CompactBallot>; b: Record<string, CompactBallot> } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const key = `${a?.id}|${b?.id}`

  useEffect(() => {
    if (!a || !b) return
    let live = true
    Promise.all([loadBallots(a.id), loadBallots(b.id)]).then(
      ([x, y]) => live && setData({ key: `${a.id}|${b.id}`, a: x, b: y }),
      () => live && setFailed(`${a.id}|${b.id}`),
    )
    return () => {
      live = false
    }
  }, [a, b])

  const options = [
    { value: "", label: fr ? "Choisir un député" : "Choose an MP" },
    ...members.map((m) => ({ value: m.id, label: `${m.name} (${m.party}${m.active ? "" : fr ? ", ancien" : ", former"})` })),
  ]
  const result = data && data.key === key ? compareBallots(data.a, data.b, votes.map((v) => v.id)) : null
  const voteById = new Map(votes.map((v) => [v.id, v]))

  return (
    <div>
      <div className="grid max-w-3xl gap-4 border-b border-rule py-6 sm:grid-cols-2">
        <FilterSelect label={fr ? "Premier député" : "First MP"} value={params.a ?? ""} onChange={(v) => set({ a: v || null })} options={options} />
        <FilterSelect label={fr ? "Second député" : "Second MP"} value={params.b ?? ""} onChange={(v) => set({ b: v || null })} options={options} />
      </div>

      <div aria-live="polite" className="mt-10">
        {!a || !b ? (
          <p className="text-[0.9375rem] text-ink-2">{fr ? "Choisissez deux députés pour voir à quelle fréquence ils ont voté de la même façon." : "Choose two MPs to see how often they voted the same way."}</p>
        ) : a.id === b.id ? (
          <p className="text-[0.9375rem] text-ink-2">{fr ? "Choisissez deux députés différents." : "Choose two different MPs."}</p>
        ) : failed === key ? (
          <p role="alert" className="text-[0.9375rem] text-danger-ink">{fr ? "Impossible de charger les votes. Réessayez." : "Couldn’t load the votes. Try again."}</p>
        ) : !result ? (
          <p className="text-[0.9375rem] text-ink-3">{fr ? "Chargement…" : "Loading…"}</p>
        ) : (
          <section>
            <h2 className="font-display text-[1.75rem] leading-tight font-semibold">
              {result.agreement === null
                ? fr
                  ? `${a.name} et ${b.name} n’ont jamais voté tous les deux lors du même vote.`
                  : `${a.name} and ${b.name} never both voted on the same division.`
                : fr
                  ? `${a.name} et ${b.name} ont voté de la même façon ${formatPercent(result.agreement, 1, locale)} du temps.`
                  : `${a.name} and ${b.name} voted the same way ${formatPercent(result.agreement, 1, locale)} of the time.`}
            </h2>
            <dl className="mt-6 grid max-w-2xl gap-x-10 border-t border-rule-strong sm:grid-cols-3">
              {[
                [fr ? "Votes où les deux siégeaient" : "Votes both were sitting for", result.bothSitting],
                [fr ? "Votes où les deux ont voté" : "Votes both cast", result.bothVoted],
                [fr ? "Votés de la même façon" : "Voted the same way", result.agreed],
              ].map(([label, n]) => (
                <div key={label as string} className="flex items-baseline justify-between gap-4 border-b border-rule py-3">
                  <dt className="text-[0.875rem] text-ink-2">{label}</dt>
                  <dd className="font-display text-[1.5rem] font-semibold tabular-nums">{n}</dd>
                </div>
              ))}
            </dl>
            <h3 className="mt-12 text-[0.8125rem] font-semibold text-ink">
              {fr ? `Votes où ils se sont opposés (${result.disagreements.length})` : `Votes where they split (${result.disagreements.length})`}
            </h3>
            {result.disagreements.length === 0 ? (
              <p className="mt-2 text-[0.9375rem] text-ink-2">{fr ? "Aucun." : "None."}</p>
            ) : (
              <ul className="mt-2 border-t border-rule">
                {result.disagreements.map((id) => {
                  const v = voteById.get(id)!
                  return (
                    <li key={id} className="grid gap-x-6 gap-y-1 border-b border-rule py-3 sm:grid-cols-[1fr_auto]">
                      <div className="min-w-0">
                        <Link className="line-clamp-2 text-[0.9375rem] text-ink hover:underline" href={localePath(locale, `/votes/${v.sessionId}/${v.number}`)}>
                          {v.description}
                        </Link>
                        <p className="text-[0.8125rem] text-ink-3">{formatDate(v.date, locale)}</p>
                      </div>
                      <p className="text-[0.8125rem] whitespace-nowrap text-ink-2 sm:text-right">
                        <span className="name-sc">{a.name}</span>: {LABEL[locale][data!.a[id]]}
                        <br />
                        <span className="name-sc">{b.name}</span>: {LABEL[locale][data!.b[id]]}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="mt-8 text-[0.8125rem] text-ink-3">
              {fr
                ? "Seuls les votes où les deux députés ont voté pour ou contre sont comptés. Pairés et absents sont exclus."
                : "Only votes where both MPs cast a yea or nay are counted. Paired and absent ballots are left out."}
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
