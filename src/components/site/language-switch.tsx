"use client"

import { usePathname } from "next/navigation"
import { localePath, unlocalizedPath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

/** Links to the same page in the other language. A plain anchor: the two languages use separate root layouts. */
export function LanguageSwitch({ locale, className }: { locale: Locale; className?: string }) {
  const other: Locale = locale === "en" ? "fr" : "en"
  const path = localePath(other, unlocalizedPath(usePathname()))
  const t = getMessages(locale).site
  return (
    <a
      href={path}
      hrefLang={other === "fr" ? "fr-CA" : "en-CA"}
      lang={other === "fr" ? "fr-CA" : "en-CA"}
      aria-label={t.switchLanguageLabel}
      className={
        className ??
        "inline-flex h-9 items-center rounded-sm px-2 text-[0.875rem] text-ink-2 transition-colors duration-150 hover:bg-paper-sunk hover:text-ink"
      }
    >
      {t.switchLanguage}
    </a>
  )
}
