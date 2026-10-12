import { activityDates, stageEventsBetween, votesBetween } from "./queries"
import { weekKey, weekRange } from "./weeks"

/** Weeks (newest first) in which a bill moved or the House held a recorded vote. */
export function activeWeeks(): string[] {
  return [...new Set(activityDates().map(weekKey))].sort().reverse()
}

export function weekDigest(week: string) {
  const { start, end } = weekRange(week)
  return { week, start, end, events: stageEventsBetween(start, end), votes: votesBetween(start, end) }
}
