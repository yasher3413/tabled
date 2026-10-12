import Link from "next/link"
import { SearchButton } from "@/components/site/command-palette"
import { Container } from "@/components/tabled/page-header"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

export function NotFoundView({ locale }: { locale: Locale }) {
  const t = getMessages(locale).notFound
  const L = (p: string) => localePath(locale, p)
  return (
    <Container>
      <div className="max-w-2xl border-b border-rule-strong pt-16 pb-12 sm:pt-24">
        <h1 className="font-display text-[2.75rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.5rem]">{t.title}</h1>
        <p className="measure mt-4 text-lg leading-relaxed text-ink-2">{t.body}</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <SearchButton
            locale={locale}
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-ink px-5 text-[0.9375rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink"
          />
          <Link className="link text-[0.9375rem]" href={L("/")}>
            {t.home}
          </Link>
        </div>
      </div>
      <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
        <li>
          <Link className="link" href={L("/bills")}>{t.allBills}</Link>
        </li>
        <li>
          <Link className="link" href={L("/votes")}>{t.votes}</Link>
        </li>
        <li>
          <Link className="link" href={L("/mps")}>{t.mps}</Link>
        </li>
        <li>
          <Link className="link" href={L("/find")}>{t.find}</Link>
        </li>
      </ul>
    </Container>
  )
}
