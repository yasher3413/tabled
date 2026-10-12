import type { Metadata } from "next"
import Link from "next/link"
import { Container, PageHeader, SectionHeading } from "@/components/tabled/page-header"
import { formatDate } from "@/lib/format"
import { getMeta } from "@/lib/queries"
import { REPO_URL } from "@/lib/site"
import { CHAMBER_LABEL, PRIVATE_VS_GOVERNMENT, stageInfo } from "@/lib/stages"

export const metadata: Metadata = {
  title: "About and methodology",
  description: "Where Tabled's data comes from, how every number is calculated, how the plain-English summaries are written, and how to report an error.",
  alternates: { canonical: "/about" },
}

const STAGES = [
  "house:first-reading",
  "house:second-reading",
  "house:committee",
  "house:report",
  "house:third-reading",
  "senate:first-reading",
  "senate:second-reading",
  "senate:committee",
  "senate:third-reading",
  "crown:royal-assent",
]

export default function AboutPage() {
  const meta = getMeta()
  const reconciled = (() => {
    try {
      return (JSON.parse(meta.crosscheck ?? "[]") as string[]).filter((n) => n.includes("used official record")).length
    } catch {
      return 0
    }
  })()
  return (
    <Container>
      <PageHeader title="About Tabled" lede="Tabled is an independent, nonpartisan guide to the Parliament of Canada. It shows what every bill does, where it is, and how every MP voted, using only official and public data." />

      <div className="mt-12 grid gap-x-16 gap-y-12 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-6 space-y-2 text-[0.9375rem] text-ink-2">
            {[
              ["sources", "Data sources"],
              ["methodology", "How numbers are calculated"],
              ["summaries", "Plain-English summaries"],
              ["how-a-bill-becomes-law", "How a bill becomes law"],
              ["nonpartisan", "Nonpartisan commitment"],
              ["errors", "Report an error"],
            ].map(([id, label]) => (
              <li key={id}>
                <a className="hover:text-accent-ink" href={`#${id}`}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="measure min-w-0 space-y-14 text-[1.0625rem] leading-relaxed text-ink-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_p]:mt-3">
          <section aria-labelledby="sources">
            <SectionHeading id="sources">Data sources</SectionHeading>
            <ul className="mt-4 list-disc space-y-3 pl-5 marker:text-ink-3">
              <li>
                <a className="link" href="https://openparliament.ca">openparliament.ca</a> for MPs, recorded votes and how each MP voted. Tabled would not exist without this
                project by Michael Mulley; please credit it too.
              </li>
              <li>
                <a className="link" href="https://www.parl.ca/legisinfo/en">LEGISinfo</a>, Parliament’s official bill tracker, for bill status, stages, dates, sponsors and
                links to the bill text.
              </li>
              <li>
                <a className="link" href="https://www.ourcommons.ca/en/open-data">House of Commons open data</a> to cross-check every vote. When the two disagree, Tabled uses
                the official House record{reconciled ? ` (this affected ${reconciled} votes in the latest update)` : ""}.
              </li>
              <li>
                <a className="link" href="https://represent.opennorth.ca">Represent by Open North</a> to match postal codes to ridings.
              </li>
            </ul>
            <p>
              Data is refreshed daily. The current snapshot was taken {meta.last_ingest ? formatDate(meta.last_ingest) : "on an unknown date"}. Tabled covers the current
              session of Parliament ({meta.current_session ?? "unknown"}). Senate votes are not included.
            </p>
          </section>

          <section aria-labelledby="methodology">
            <SectionHeading id="methodology">How numbers are calculated</SectionHeading>
            <h3>Party position</h3>
            <p>
              On each recorded vote, a party’s position is whichever side most of its voting MPs took. MPs who were paired or did not vote are left out. If a party’s MPs split
              exactly evenly, it has no position on that vote. A party needs at least two MPs voting to have a position, so a party with one MP never has one.
            </p>
            <h3>Voted with party (party-line rate)</h3>
            <p>
              The share of an MP’s yea or nay votes that matched their party’s position. Only votes where their party had a position count. Independents have no rate. The party
              is the one the MP belonged to on the day of the vote.
            </p>
            <h3>Broke ranks</h3>
            <p>A yea or nay vote that went against the MP’s party position on that vote.</p>
            <h3>Split votes</h3>
            <p>
              Votes where a party’s MPs voted on both sides. Sometimes this is a free vote, where a party lets its MPs vote as they choose; sometimes it is individual MPs
              breaking ranks. Tabled flags these votes but does not guess which is which.
            </p>
            <h3>Votes cast</h3>
            <p>
              Yea and nay votes cast, out of all recorded votes held while the MP was sitting. Paired MPs (two MPs on opposite sides who agree to both stay out) are counted as
              not casting a vote. Missing a recorded vote has many legitimate causes: committee work, travel for the job, illness, family leave or constituency duties. It is
              not a measure of how hard an MP works.
            </p>
            <h3>Cohesion</h3>
            <p>The average party-line rate of a party’s current MPs.</p>
          </section>

          <section aria-labelledby="summaries">
            <SectionHeading id="summaries">Plain-English summaries</SectionHeading>
            <p>
              Bill summaries are written by an AI model (Anthropic’s Claude) from official sources, and every one is labelled as AI-generated. The model is given, in order of
              preference, the bill summary published on LEGISinfo, the full text of the bill, or LEGISinfo’s description. If only a bill’s title is available, no summary is
              written.
            </p>
            <p>
              Each summary is checked automatically before it is published: it must follow a fixed structure, stay short, avoid loaded words like “controversial” or
              “historic”, and describe what the bill does rather than judge it. Claims are attributed (“the government says”). Summaries are only rewritten when the official
              text changes.
            </p>
            <p>The official text is always the authority, and is linked from every bill page.</p>
          </section>

          <section aria-labelledby="how-a-bill-becomes-law">
            <SectionHeading id="how-a-bill-becomes-law">How a bill becomes law</SectionHeading>
            <p>
              A bill must pass the same stages in both the House of Commons and the Senate, in the same words, then receive royal assent. Most bills start in the House; some
              start in the Senate and follow the same path in reverse.
            </p>
            <ol className="mt-5 space-y-4 border-l border-rule pl-5">
              {STAGES.map((key) => {
                const s = stageInfo(key)
                return (
                  <li key={key}>
                    <p className="!mt-0 font-semibold text-ink">
                      {s.label} <span className="font-normal text-ink-3">· {CHAMBER_LABEL[s.chamber]}</span>
                    </p>
                    <p className="!mt-1">{s.explainer}</p>
                  </li>
                )
              })}
            </ol>
            <h3>Government bills and private members’ bills</h3>
            <p>{PRIVATE_VS_GOVERNMENT}</p>
          </section>

          <section aria-labelledby="nonpartisan">
            <SectionHeading id="nonpartisan">Nonpartisan commitment</SectionHeading>
            <p>
              Tabled is not affiliated with Parliament, any party or any advocacy group. It does not endorse or oppose any bill or MP. Party colours appear only in charts and
              small labels, and parties are always listed in order of seats held. If you see wording that seems to take a side, please report it.
            </p>
          </section>

          <section aria-labelledby="errors">
            <SectionHeading id="errors">Report an error</SectionHeading>
            <p>
              Found something wrong? <a className="link" href={`${REPO_URL}/issues/new`}>Open an issue on GitHub</a> with the page and what the correct information is. Tabled is
              open source under the MIT licence; the code is at <a className="link" href={REPO_URL}>{REPO_URL.replace("https://", "")}</a>.
            </p>
            <p>
              <Link className="link" href="/">Back to the home page</Link>
            </p>
          </section>
        </div>
      </div>
    </Container>
  )
}
