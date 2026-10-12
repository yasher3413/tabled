import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { SearchButton } from "./command-palette"
import { LanguageSwitch } from "./language-switch"
import { LogoMark } from "./logo"
import { MobileNav } from "./mobile-nav"
import { NavLinks } from "./nav-links"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader({ locale }: { locale: Locale }) {
  const t = getMessages(locale)
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex h-[3.75rem] max-w-[76rem] items-center gap-4 px-4 sm:px-6">
        <Link href={localePath(locale, "/")} className="group flex items-center gap-2.5 rounded-sm" aria-label={t.site.home}>
          <LogoMark className="h-[1.05rem] w-auto text-ink transition-colors duration-150 group-hover:text-accent-ink" />
          <span className="font-display text-[1.375rem] leading-none font-semibold tracking-[-0.01em]">Tabled</span>
        </Link>
        <nav aria-label={t.site.menu} className="ml-4 hidden md:block">
          <NavLinks locale={locale} className="flex items-center" />
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchButton locale={locale} />
          <LanguageSwitch locale={locale} className="hidden h-9 items-center rounded-sm px-2 text-[0.875rem] text-ink-2 transition-colors duration-150 hover:bg-paper-sunk hover:text-ink sm:inline-flex" />
          <ThemeToggle locale={locale} />
          <MobileNav locale={locale} />
        </div>
      </div>
    </header>
  )
}
