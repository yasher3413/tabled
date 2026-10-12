// How often two MPs voted the same way. Only votes where both cast a yea or nay count.

export type CompactBallot = "y" | "n" | "p" | "a"

export interface CompareResult {
  bothSitting: number
  bothVoted: number
  agreed: number
  agreement: number | null
  disagreements: string[] // vote ids, newest first as given
}

export function compareBallots(a: Record<string, CompactBallot>, b: Record<string, CompactBallot>, order: string[]): CompareResult {
  let bothSitting = 0
  let bothVoted = 0
  let agreed = 0
  const disagreements: string[] = []
  for (const id of order) {
    const x = a[id]
    const y = b[id]
    if (!x || !y) continue
    bothSitting++
    if ((x !== "y" && x !== "n") || (y !== "y" && y !== "n")) continue
    bothVoted++
    if (x === y) agreed++
    else disagreements.push(id)
  }
  return { bothSitting, bothVoted, agreed, agreement: bothVoted ? agreed / bothVoted : null, disagreements }
}

export function compactBallot(ballot: "yea" | "nay" | "paired" | "absent"): CompactBallot {
  return ballot === "yea" ? "y" : ballot === "nay" ? "n" : ballot === "paired" ? "p" : "a"
}
