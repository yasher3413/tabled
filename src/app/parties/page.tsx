import type { Metadata } from "next"
import Link from "next/link"
import { HouseComposition } from "@/components/tabled/house-composition"
import { Container, PageHeader, SectionHeading } from "@/components/tabled/page-header"
import { PartySwatch } from "@/components/tabled/party-tag"
import { formatPercent } from "@/lib/format"
import { houseComposition, listMembers, partySummaries } from "@/lib/queries"

export const metadata: Metadata = {
  title: "Parties",
  description: "Seats, voting cohesion and bills sponsored for each party in the House of Commons.",
  alternates: { canonical: "/parties" },
}

export default function PartiesPage() {
  const rows = partySummaries().filter((r) => r.seats > 0)
  const house = houseComposition()
  const independents = listMembers().filter((m) => m.active && m.partyId === "independent")
  return (
    <Container>
      <PageHeader title="Parties" lede="How each party in the House of Commons is doing this session: seats held, how consistently its MPs vote together, and the bills its MPs have sponsored." />

      <div className="mt-12 grid gap-x-16 gap-y-10 lg:grid-cols-[1fr_1.5fr]">
        <div className="mx-auto w-full max-w-[26rem] lg:mx-0">
          <HouseComposition parties={house.parties} vacant={house.vacant} seatsTotal={house.seatsTotal} />
        </div>
        <div className="min-w-0">
          <SectionHeading>By party</SectionHeading>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-[0.9375rem]">
              <caption className="sr-only">Party seats, cohesion and bills, ordered by seats held</caption>
              <thead>
                <tr className="border-b border-rule-strong text-left text-xs text-ink-3">
                  <th scope="col" className="py-2 pr-3 font-medium">Party</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Seats</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Cohesion</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Split votes</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Bills sponsored</th>
                  <th scope="col" className="py-2 text-right font-medium">Became law</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.party.id} className="border-b border-rule">
                    <th scope="row" className="py-3 pr-3 text-left font-normal">
                      <span className="inline-flex items-center gap-2">
                        <PartySwatch partyId={r.party.id} />
                        <Link className="hover:underline" href={`/mps?party=${r.party.id}`}>
                          {r.party.nameEn}
                        </Link>
                      </span>
                    </th>
                    <td className="py-3 pr-3 text-right font-display text-lg font-semibold tabular-nums">{r.seats}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">{r.cohesionSample >= 2 ? formatPercent(r.cohesion) : <span className="text-ink-3">n/a</span>}</td>
                    <td className="py-3 pr-3 text-right text-ink-2 tabular-nums">{r.seats >= 2 ? `${r.splitVotes} of ${r.votesWithPosition}` : <span className="text-ink-3">n/a</span>}</td>
                    <td className="py-3 pr-3 text-right tabular-nums">
                      <Link className="hover:underline" href={`/bills?party=${r.party.id}`}>
                        {r.billsSponsored}
                      </Link>
                    </td>
                    <td className="py-3 text-right text-ink-2 tabular-nums">{r.billsBecameLaw}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {independents.length > 0 && (
            <p className="mt-4 text-[0.875rem] text-ink-2">
              {independents.length} independent {independents.length === 1 ? "MP sits" : "MPs sit"} without a party.
            </p>
          )}
          <dl className="mt-10 grid gap-6 text-[0.875rem] leading-relaxed text-ink-2 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink">Cohesion</dt>
              <dd className="mt-1">
                The average party-line rate of the party’s current MPs: how often each one voted the same way as most of their party. Parties with one MP have no rate.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Split votes</dt>
              <dd className="mt-1">
                Recorded votes where the party’s MPs voted on both sides. Some are free votes, where a party lets members vote as they choose.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Bills sponsored</dt>
              <dd className="mt-1">
                Bills introduced by the party’s MPs, including government bills introduced by ministers. Senate bills are not counted.
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Order</dt>
              <dd className="mt-1">
                Parties are always listed by seats held, largest first, everywhere on Tabled.{" "}
                <Link className="link" href="/about#methodology">
                  Methodology
                </Link>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Container>
  )
}
