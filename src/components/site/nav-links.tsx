"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { localePath, unlocalizedPath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { cn } from "@/lib/utils"

const NAV = ["bills", "votes", "mps", "parties", "find", "about"] as const

export function NavLinks({ locale, className, onNavigate }: { locale: Locale; className?: string; onNavigate?: () => void }) {
  const pathname = unlocalizedPath(usePathname())
  const t = getMessages(locale).nav
  return (
    <ul className={className}>
      {NAV.map((key) => {
        const href = `/${key}`
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <li key={key}>
            <Link
              href={localePath(locale, href)}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-9 items-center px-2.5 text-[0.9375rem] whitespace-nowrap text-ink-2 transition-colors duration-150 hover:text-ink",
                active && "text-ink after:absolute after:inset-x-2.5 after:-bottom-[0.6875rem] after:h-[2px] after:bg-accent-ink",
              )}
            >
              {t[key]}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
