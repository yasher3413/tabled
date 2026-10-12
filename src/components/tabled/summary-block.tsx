import { Sparkles } from "lucide-react"
import { reportErrorUrl } from "@/lib/site"
import type { Summary } from "@/lib/summary-schema"
import { formatDate } from "@/lib/format"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { localePath } from "@/i18n/config"
import { isTopic, topicLabel } from "@/lib/topics"

interface Props {
  billNumber: string
  pageUrl: string
  summary: { parsed: Summary; model: string; generatedAt: string; sourceUrl: string | null } | null
  officialSummary: string | null
  sourceLinks: { label: string; href: string }[]
  locale?: Locale
}

/** Plain-English summary with its AI disclosure, or an honest placeholder. */
export function SummaryBlock({ billNumber, pageUrl, summary, officialSummary, sourceLinks, locale = "en" }: Props) {
  const t = getMessages(locale).summary
  if (!summary) {
    if (!officialSummary) {
      return (
        <div className="border-b border-rule pb-6">
          <p className="measure text-[1rem] leading-relaxed text-ink-2">
            {t.noneAtAll}{" "}
            {sourceLinks[0] ? (
              <a className="link" href={sourceLinks[0].href}>
                {t.officialText}
              </a>
            ) : (
              t.officialText
            )}{" "}
            {t.linkedBelow}
          </p>
        </div>
      )
    }
    return (
      <div className="border-b border-rule pb-6">
        <OfficialSummary text={officialSummary} locale={locale} />
        <p className="mt-5 text-[0.8125rem] text-ink-3">{t.officialNote}</p>
      </div>
    )
  }
  const s = summary.parsed
  return (
    <div>
      <p className="measure font-display text-[1.375rem] leading-snug font-medium text-ink sm:text-[1.5rem]">{s.tldr}</p>
      <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-[1.6fr_1fr]">
        <div>
          <h3 className="text-[0.8125rem] font-semibold text-ink">{t.whatItDoes}</h3>
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
            <h3 className="text-[0.8125rem] font-semibold text-ink">{t.whoItAffects}</h3>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {s.who_it_affects.map((g, i) => (
                <li key={i} className="rounded-sm border border-rule px-2 py-1 text-[0.8125rem] text-ink-2">
                  {g}
                </li>
              ))}
            </ul>
          </div>
          {s.topics && s.topics.some(isTopic) && (
            <div>
              <h3 className="text-[0.8125rem] font-semibold text-ink">{locale === "fr" ? "Sujets" : "Topics"}</h3>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.875rem]">
                {s.topics.filter(isTopic).map((id) => (
                  <li key={id}>
                    <a className="link" href={localePath(locale, `/bills?topic=${id}`)}>
                      {topicLabel(id, locale)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {s.background && (
            <div>
              <h3 className="text-[0.8125rem] font-semibold text-ink">{t.background}</h3>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{s.background}</p>
            </div>
          )}
        </div>
      </div>
      <aside className="mt-8 flex gap-3 border-t border-rule pt-4 text-[0.8125rem] leading-relaxed text-ink-3">
        <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
        <p>
          <span className="font-medium text-ink-2">{t.aiLabel}</span> {t.writtenFrom}{" "}
          {summary.sourceUrl ? (
            <a className="link" href={summary.sourceUrl}>
              {t.basis[s.source_basis]}
            </a>
          ) : (
            t.basis[s.source_basis]
          )}{" "}
          {t.on} {formatDate(summary.generatedAt, locale)} {t.byModel} <code className="font-sans">{summary.model}</code>. {s.coverage_note ? `${s.coverage_note} ` : ""}{t.canErr}{" "}
          {sourceLinks[0] ? (
            <a className="link" href={sourceLinks[0].href}>
              {t.officialText}
            </a>
          ) : (
            t.officialText
          )}{" "}
          {t.isAuthority}{" "}
          <a className="link" href={reportErrorUrl(`Bill ${billNumber} summary`, pageUrl)}>
            {t.report}
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
function OfficialSummary({ text, locale }: { text: string; locale: Locale }) {
  const t = getMessages(locale).summary
  const paragraphs = splitParagraphs(text)
  const lead = paragraphs.slice(0, 2)
  const rest = paragraphs.slice(2)
  return (
    <div className="measure">
      <h3 className="text-[0.8125rem] font-semibold text-ink">{t.officialHeading}</h3>
      <div className="mt-2 space-y-3 text-[1.0625rem] leading-relaxed text-ink">
        {lead.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      {rest.length > 0 && (
        <details className="group mt-3">
          <summary className="link cursor-pointer text-[0.9375rem] marker:text-ink-3">{t.readFull(rest.length)}</summary>
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
