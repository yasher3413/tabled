// ISO weeks (Monday to Sunday) for the weekly digest. Dates are calendar dates (YYYY-MM-DD), no time zone.

function toDate(d: string) {
  return new Date(`${d.slice(0, 10)}T00:00:00Z`)
}
function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}

/** "2026-10-08" -> "2026-W41" */
export function weekKey(date: string): string {
  const d = toDate(date)
  const day = (d.getUTCDay() + 6) % 7 // Monday = 0
  d.setUTCDate(d.getUTCDate() - day + 3) // Thursday of this week decides the ISO year
  const year = d.getUTCFullYear()
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const week = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86_400_000 - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7)
  return `${year}-W${String(week).padStart(2, "0")}`
}

/** "2026-W41" -> { start: Monday, end: Sunday } */
export function weekRange(key: string): { start: string; end: string } {
  const m = /^(\d{4})-W(\d{2})$/.exec(key)
  if (!m) throw new Error(`Bad week key ${key}`)
  const year = Number(m[1])
  const week = Number(m[2])
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const monday = new Date(jan4)
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() + 6) % 7) + (week - 1) * 7)
  const sunday = new Date(monday)
  sunday.setUTCDate(monday.getUTCDate() + 6)
  return { start: iso(monday), end: iso(sunday) }
}

export function isWeekKey(value: string): boolean {
  return /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/.test(value)
}
