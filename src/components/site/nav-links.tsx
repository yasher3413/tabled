"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export const NAV = [
  { href: "/bills", label: "Bills" },
  { href: "/votes", label: "Votes" },
  { href: "/mps", label: "MPs" },
  { href: "/parties", label: "Parties" },
  { href: "/find", label: "Find your MP" },
  { href: "/about", label: "About" },
]

export function NavLinks({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <ul className={className}>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative inline-flex h-9 items-center px-2.5 text-[0.9375rem] text-ink-2 transition-colors duration-150 hover:text-ink",
                active &&
                  "text-ink after:absolute after:inset-x-2.5 after:-bottom-[0.6875rem] after:h-[2px] after:bg-accent-ink",
              )}
            >
              {item.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
