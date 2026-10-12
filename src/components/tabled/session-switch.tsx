import Link from "next/link"
import { localePath, type Locale } from "@/i18n/config"
import type { Session } from "@/lib/queries"
import { sessionLabel } from "@/lib/sessions"
import { cn } from "@/lib/utils"

/** Links between sessions for a list page ("/bills" for the current session, "/bills/44-1" for others). */
export function SessionSwitch({ sessions, active, basePath, locale }: { sessions: Session[]; active: string; basePath: string; locale: Locale }) {
  if (sessions.length < 2) return null
  return (
    <nav aria-label={locale === "fr" ? "Session" : "Session"} className="mt-5 flex flex-wrap items-center gap-x-1 gap-y-2 text-[0.875rem]">
      <span className="mr-2 text-ink-3">{locale === "fr" ? "Session :" : "Session:"}</span>
      {sessions.map((s) => {
        const isActive = s.id === active
        return (
          <Link
            key={s.id}
            href={localePath(locale, s.isCurrent ? basePath : `${basePath}/${s.id}`)}
            aria-current={isActive ? "page" : undefined}
            className={cn("rounded-sm px-2.5 py-1 transition-colors duration-150", isActive ? "bg-ink text-paper" : "text-ink-2 hover:bg-paper-sunk hover:text-ink")}
          >
            {sessionLabel(s, locale)}
            {s.isCurrent ? (locale === "fr" ? " (en cours)" : " (current)") : ""}
          </Link>
        )
      })}
    </nav>
  )
}
