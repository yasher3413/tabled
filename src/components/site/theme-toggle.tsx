"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"

type Theme = "light" | "dark" | "system"
const ORDER: Theme[] = ["system", "light", "dark"]
const LABEL: Record<Theme, string> = { system: "Theme: match system", light: "Theme: light", dark: "Theme: dark" }

function apply(theme: Theme) {
  const dark = theme === "dark" || (theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    let stored: Theme = "system"
    try {
      stored = (localStorage.getItem("tabled-theme") as Theme) ?? "system"
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with storage after hydration
    setTheme(ORDER.includes(stored) ? stored : "system")
    const mq = matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      let current: Theme = "system"
      try {
        current = (localStorage.getItem("tabled-theme") as Theme) ?? "system"
      } catch {}
      if (current === "system") apply("system")
    }
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    setTheme(next)
    try {
      localStorage.setItem("tabled-theme", next)
    } catch {}
    apply(next)
  }

  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor
  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={LABEL[theme]}
      title={LABEL[theme]}
      className="inline-flex size-9 items-center justify-center rounded-sm text-ink-2 transition-colors duration-150 hover:bg-paper-sunk hover:text-ink"
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  )
}
