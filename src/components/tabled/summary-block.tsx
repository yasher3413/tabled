import { Sparkles } from "lucide-react"
import { reportErrorUrl } from "@/lib/site"
import type { Summary } from "@/lib/summary-schema"
import { SOURCE_BASIS_LABEL } from "@/lib/summary-schema"
import { formatDate } from "@/lib/format"

interface Props {
  billNumber: string
  pageUrl: string
  summary: { parsed: Summary; model: string; generatedAt: string; sourceUrl: string | null } | null
  officialSummary: string | null
  sourceLinks: { label: string; href: string }[]
}

/** Plain-English summary with its AI disclosure, or an honest placeholder. */
export function SummaryBlock({ billNumber, pageUrl, summary, officialSummary, sourceLinks }: Props) {
  if (!summary) {
    if (!officialSummary) {
      return (
        <div className="border-b border-rule pb-6">
          <p className="measure text-[1rem] leading-relaxed text-ink-2">
            A plain-English summary is not available yet, and Parliament has not published a summary for this bill. The{" "}
            {sourceLinks[0] ? (
              <a className="link" href={sourceLinks[0].href}>
                official text
              </a>
            ) : (
              "official text"
            )}{" "}
            is linked below.
          </p>
        </div>
      )
    }
    return (
      <div className="border-b border-rule pb-6">
        <OfficialSummary text={officialSummary} />
        <p className="mt-5 text-[0.8125rem] text-ink-3">A plain-English summary is not available yet. This is the official summary, as published on LEGISinfo.</p>
      </div>
    )
  }
  const s = summary.parsed
  return (
    <div>
      <p className="measure font-display text-[1.375rem] leading-snug font-medium text-ink sm:text-[1.5rem]">{s.tldr}</p>
      <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-[1.6fr_1fr]">
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-ink">What it does</h3>
          <ul className="measure mt-2 space-y-2.5">
            {s.what_it_does.map((item, i) => (
              <li key={i} className="relative pl-5 text-[1rem] leading-relaxed text-ink-2 before:absolute before:top-[0.7em] before:left-0 before:h-px before:w-2.5 before:bg-ink-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-8">
          <div>
            <h3 className="text-[0.8125rem] font-semibold text-ink">Who it affects</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {s.who_it_affects.map((g, i) => (
                <li key={i} className="rounded-sm border border-rule px-2 py-1 text-[0.8125rem] text-ink-2">
                  {g}
                </li>
              ))}
            </ul>
          </div>
          {s.background && (
            <div>
              <h3 className="text-[0.8125rem] font-semibold text-ink">Background</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{s.background}</p>
            </div>
          )}
        </div>
      </div>
      <aside className="mt-8 flex gap-3 border-t border-rule pt-4 text-[0.8125rem] leading-relaxed text-ink-3">
        <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <p>
          <span className="font-medium text-ink-2">AI-generated summary of the official text.</span> Written from the{" "}
          {summary.sourceUrl ? (
            <a className="link" href={summary.sourceUrl}>
              {SOURCE_BASIS_LABEL[s.source_basis]}
            </a>
          ) : (
            SOURCE_BASIS_LABEL[s.source_basis]
          )}{" "}
          on {formatDate(summary.generatedAt)}. {s.coverage_note ? `${s.coverage_note} ` : ""}It can contain mistakes; the{" "}
          {sourceLinks[0] ? (
            <a className="link" href={sourceLinks[0].href}>
              official text
            </a>
          ) : (
            "official text"
          )}{" "}
          is the authority.{" "}
          <a className="link" href={reportErrorUrl(`Bill ${billNumber} summary`, pageUrl)}>
            Report an error
          </a>
          .
        </p>
      </aside>
    </div>
  )
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}|\n(?=\(?[a-z0-9]\)|Part \d)/i)
    .map((p) => p.trim())
    .filter(Boolean)
}

/** The official summary, shown openly: the first paragraphs up front, the rest behind a disclosure. */
function OfficialSummary({ text }: { text: string }) {
  const paragraphs = splitParagraphs(text)
  const lead = paragraphs.slice(0, 2)
  const rest = paragraphs.slice(2)
  return (
    <div className="measure">
      <h3 className="text-[0.8125rem] font-semibold text-ink">Official summary from Parliament</h3>
      <div className="mt-2 space-y-3 text-[1.0625rem] leading-relaxed text-ink">
        {lead.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {rest.length > 0 && (
        <details className="group mt-3">
          <summary className="link cursor-pointer text-[0.9375rem] marker:text-ink-3">Read the full official summary ({rest.length} more {rest.length === 1 ? "paragraph" : "paragraphs"})</summary>
          <div className="mt-3 space-y-3 text-[1rem] leading-relaxed text-ink-2">
            {rest.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
