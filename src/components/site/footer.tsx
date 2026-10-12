import Link from "next/link"
import { formatDate } from "@/lib/format"
import { getMeta } from "@/lib/queries"
import { REPO_URL } from "@/lib/site"

export function SiteFooter() {
  const meta = getMeta()
  return (
    <footer className="mt-24 border-t border-rule-strong bg-paper">
      <div className="mx-auto grid max-w-[76rem] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-[34rem]">
          <p className="font-display text-xl font-semibold">Tabled</p>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-2">
            Every federal bill, recorded House vote and MP in the current Parliament of Canada, in plain English.
            Independent and nonpartisan. Not affiliated with Parliament or any party.
          </p>
          <p className="mt-4 text-sm text-ink-3">
            Data last updated {meta.last_ingest ? formatDate(meta.last_ingest) : "date unavailable"}.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Sources</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>
              Votes and MPs from{" "}
              <a className="link" href="https://openparliament.ca">
                openparliament.ca
              </a>
            </li>
            <li>
              Bills from{" "}
              <a className="link" href="https://www.parl.ca/legisinfo/en">
                LEGISinfo
              </a>
            </li>
            <li>
              Cross-checked with{" "}
              <a className="link" href="https://www.ourcommons.ca/en/open-data">
                House of Commons open data
              </a>
            </li>
            <li>
              Postal codes by{" "}
              <a className="link" href="https://represent.opennorth.ca">
                Represent (Open North)
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Project</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>
              <Link className="link" href="/about">
                About and methodology
              </Link>
            </li>
            <li>
              <a className="link" href={`${REPO_URL}/issues/new`}>
                Report an error
              </a>
            </li>
            <li>
              <a className="link" href={REPO_URL}>
                Source code (MIT)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
