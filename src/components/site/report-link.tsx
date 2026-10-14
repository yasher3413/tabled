"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

/** "Report a problem", carrying the current page so the form can prefill it. */
export function ReportLink({ locale, className = "link" }: { locale: Locale; className?: string }) {
  const pathname = usePathname()
  const page = pathname && !pathname.endsWith("/report") && !pathname.includes("/_not-found") ? `?page=${encodeURIComponent(pathname)}` : ""
  return (
    <Link className={className} href={`${localePath(locale, "/report")}${page}`}>
      {getMessages(locale).footer.report}
    </Link>
  )
}
