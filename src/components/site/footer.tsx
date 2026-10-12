import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatDate } from "@/lib/format"
import { getMeta } from "@/lib/queries"
import { REPO_URL } from "@/lib/site"

export function SiteFooter({ locale }: { locale: Locale }) {
  const meta = getMeta()
  const t = getMessages(locale).footer
  return (
    <footer className="mt-24 border-t border-rule-strong bg-paper">
      <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-[34rem]">
          <p className="font-display text-xl font-semibold">Tabled</p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">{t.blurb}</p>
          <p className="mt-4 text-sm text-ink-3">
            {t.updated} {meta.last_ingest ? formatDate(meta.last_ingest, locale) : t.updatedUnknown}.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">{t.sources}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>
              {t.votesFrom}{" "}
              <a className="link" href="https://openparliament.ca">
                openparliament.ca
              </a>
            </li>
            <li>
              {t.billsFrom}{" "}
              <a className="link" href={locale === "fr" ? "https://www.parl.ca/legisinfo/fr" : "https://www.parl.ca/legisinfo/en"}>
                LEGISinfo
              </a>
            </li>
            <li>
              {t.crossChecked}{" "}
              <a className="link" href={locale === "fr" ? "https://www.noscommunes.ca/fr/donnees-ouvertes" : "https://www.ourcommons.ca/en/open-data"}>
                {t.ocOpenData}
              </a>
            </li>
            <li>
              {t.postalBy}{" "}
              <a className="link" href="https://represent.opennorth.ca">
                Represent (Open North)
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">{t.project}</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>
              <Link className="link" href={localePath(locale, "/this-week")}>
                {getMessages(locale).digest.title}
              </Link>
            </li>
            <li>
              <a className="link" href={localePath(locale, "/this-week/rss.xml")}>
                {getMessages(locale).digest.rss}
              </a>
            </li>
            <li>
              <Link className="link" href={localePath(locale, "/about")}>
                {t.about}
              </Link>
            </li>
            <li>
              <a className="link" href={`${REPO_URL}/issues/new`}>
                {t.report}
              </a>
            </li>
            <li>
              <a className="link" href={REPO_URL}>
                {t.source}
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
