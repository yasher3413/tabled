import { MapPin } from "lucide-react"
import { localePath, type Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"

/** Plain GET form to /find, so it works before JavaScript loads. */
export function PostalForm({ className, locale }: { className?: string; locale: Locale }) {
  const t = getMessages(locale).home
  return (
    <form action={localePath(locale, "/find")} method="get" className={className} role="search" aria-label={t.postalForm}>
      <label htmlFor="home-postal" className="sr-only">
        {t.postalLabel}
      </label>
      <div className="flex h-12 items-stretch overflow-hidden rounded-sm border border-rule-strong/70 bg-paper-raised transition-colors duration-150 focus-within:border-ink hover:border-ink">
        <span className="flex items-center pl-4 text-ink-2">
          <MapPin aria-hidden className="size-[1.125rem]" strokeWidth={1.75} />
        </span>
        <input
          id="home-postal"
          name="postal"
          inputMode="text"
          autoComplete="postal-code"
          placeholder={t.postalPlaceholder}
          maxLength={7}
          className="w-full min-w-0 bg-transparent px-3 text-[1rem] text-ink uppercase outline-none placeholder:text-ink-3 placeholder:normal-case"
        />
        <button type="submit" className="shrink-0 bg-ink px-4 text-[0.9375rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink">
          {t.findMp}
        </button>
      </div>
    </form>
  )
}
