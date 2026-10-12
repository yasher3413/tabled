import { cn } from "@/lib/utils"

export function PageHeader({
  title,
  lede,
  children,
  className,
}: {
  title: React.ReactNode
  lede?: React.ReactNode
  children?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("border-b border-rule-strong pt-10 pb-8 sm:pt-14", className)}>
      <h1 className="font-display text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.02em] sm:text-[3.25rem]">{title}</h1>
      {lede && <p className="measure mt-3 text-lg leading-relaxed text-ink-2">{lede}</p>}
      {children}
    </div>
  )
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[76rem] px-4 sm:px-6", className)}>{children}</div>
}

/** Section heading with a hairline, used for every zone's literal label ("What it does", "Who voted"). */
export function SectionHeading({ children, aside, id, className }: { children: React.ReactNode; aside?: React.ReactNode; id?: string; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 border-b border-rule pb-2", className)}>
      <h2 id={id} className="font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.01em]">
        {children}
      </h2>
      {aside && <div className="shrink-0 text-sm text-ink-3">{aside}</div>}
    </div>
  )
}
