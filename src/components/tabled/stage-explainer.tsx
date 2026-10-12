"use client"

import { Info } from "lucide-react"
import { Popover } from "radix-ui"

/** A small "what does this stage mean" control that works with mouse, touch and keyboard. */
export function StageExplainer({ label, chamber, explainer }: { label: string; chamber: string; explainer: string }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        aria-label={`What is ${label.toLowerCase()} in the ${chamber}?`}
        className="inline-flex size-6 items-center justify-center rounded-full text-ink-3 transition-colors duration-150 hover:bg-paper-sunk hover:text-accent-ink data-[state=open]:text-accent-ink"
      >
        <Info className="size-3.5" strokeWidth={1.75} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-sm border border-rule bg-paper-raised p-4 text-[0.875rem] leading-relaxed text-ink-2 shadow-[0_12px_32px_-12px_oklch(0.2_0.02_60/0.3)] data-[state=open]:animate-fade-in"
        >
          <p className="font-display text-base font-semibold text-ink">
            {label} <span className="font-sans text-[0.8125rem] font-normal text-ink-3">· {chamber}</span>
          </p>
          <p className="mt-1.5">{explainer}</p>
          <Popover.Arrow className="fill-paper-raised" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
