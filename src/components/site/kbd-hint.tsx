"use client"

import { useSyncExternalStore } from "react"

const subscribe = () => () => {}
const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)

/** "⌘K" on Apple platforms, "Ctrl K" elsewhere; renders nothing on the server. */
export function KbdHint({ className }: { className?: string }) {
  const mac = useSyncExternalStore(subscribe, isMac, () => null)
  if (mac === null) return null
  return <kbd className={className}>{mac ? "⌘K" : "Ctrl K"}</kbd>
}
