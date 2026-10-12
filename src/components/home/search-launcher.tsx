"use client"

import { KbdHint } from "@/components/site/kbd-hint"
import { Search } from "lucide-react"
import { openSearch } from "@/components/site/command-palette"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

export function SearchLauncher({ locale }: { locale: Locale }) {
  return (
    <button
      type="button"
      onClick={openSearch}
      className="group flex h-12 w-full items-center gap-3 rounded-sm border border-rule-strong/70 bg-paper-raised px-4 text-left text-[1rem] text-ink-3 transition-colors duration-150 hover:border-ink"
    >
      <Search aria-hidden className="size-[1.125rem] text-ink-2" strokeWidth={1.75} />
      <span className="flex-1 truncate">{getMessages(locale).home.searchLauncher}</span>
      <KbdHint className="hidden rounded-sm border border-rule px-1.5 text-xs sm:inline" />
    </button>
  )
}
