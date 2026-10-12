"use client"

import { ChevronDown, Search, X } from "lucide-react"
import { useId } from "react"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { formatNumber } from "@/lib/format"
import { cn } from "@/lib/utils"

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  defaultValue = "",
  className,
}: {
  label: string
  value: string
  defaultValue?: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string } | { group: string; options: Array<{ value: string; label: string }> }>
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-xs font-medium text-ink-3">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-10 w-full min-w-0 cursor-pointer appearance-none rounded-sm border border-rule bg-paper-raised pr-8 pl-3 text-[0.9375rem] text-ink transition-colors duration-150 hover:border-ink-3",
            value !== defaultValue && "border-ink-3",
          )}
        >
          {options.map((o) =>
            "group" in o ? (
              <optgroup key={o.group} label={o.group}>
                {o.options.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ),
          )}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.75} />
      </div>
    </div>
  )
}

export function SearchField({
  label,
  value,
  onChange,
  placeholder,
  className,
  locale = "en",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  locale?: Locale
}) {
  const id = useId()
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className="text-xs font-medium text-ink-3">
        {label}
      </label>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" strokeWidth={1.75} />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="h-10 w-full rounded-sm border border-rule bg-paper-raised pr-9 pl-9 text-[0.9375rem] text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-ink-3 [&::-webkit-search-cancel-button]:hidden"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label={getMessages(locale).filters.clearSearch}
            className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-ink-3 hover:bg-paper-sunk hover:text-ink"
          >
            <X className="size-4" strokeWidth={1.75} />
          </button>
        )}
      </div>
    </div>
  )
}

export function ResultCount({ shown, total, noun, onReset, locale = "en" }: { shown: number; total: number; noun: string; onReset?: () => void; locale?: Locale }) {
  const t = getMessages(locale).filters
  return (
    <p className="flex flex-wrap items-baseline gap-x-3 text-sm text-ink-3" aria-live="polite">
      <span>{shown === total ? `${formatNumber(total, locale)} ${noun}` : t.of(formatNumber(shown, locale), formatNumber(total, locale), noun)}</span>
      {onReset && shown !== total && (
        <button type="button" onClick={onReset} className="link">
          {t.clear}
        </button>
      )}
    </p>
  )
}
