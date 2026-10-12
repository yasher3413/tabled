import Link from "next/link"
import { LogoMark } from "./logo"
import { MobileNav } from "./mobile-nav"
import { NavLinks } from "./nav-links"
import { SearchButton } from "./command-palette"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="mx-auto flex h-[3.75rem] max-w-[76rem] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5 rounded-sm" aria-label="Tabled, home">
          <LogoMark className="h-[1.05rem] w-auto text-ink transition-colors duration-150 group-hover:text-accent-ink" />
          <span className="font-display text-[1.375rem] leading-none font-semibold tracking-[-0.01em]">Tabled</span>
        </Link>
        <nav aria-label="Main" className="ml-4 hidden md:block">
          <NavLinks className="flex items-center" />
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <SearchButton />
          <ThemeToggle />
          <MobileNav />
        </div>
      </div>
    </header>
  )
}
