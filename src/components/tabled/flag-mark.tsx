/** The single folded flag that marks where a bill stopped. */
export function FlagMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 18" className={className} aria-hidden>
      <path d="M3 17V1.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <path d="M3.9 2h9.6l-2.6 3.6 2.6 3.6H3.9z" fill="currentColor" />
      <path d="M3.9 9.2l2.4 1.9V9.2z" fill="currentColor" opacity="0.55" />
    </svg>
  )
}
