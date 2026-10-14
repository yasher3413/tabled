// Minimal GitHub REST client for filing problem reports. The token is a fine-grained PAT limited to Issues
// (read and write) on this one repository; it is never sent to the browser or logged.
import type { BuiltIssue } from "./report"
import { REPO_SLUG } from "./site"

const API = `https://api.github.com/repos/${REPO_SLUG}`
const USER_AGENT = "Tabled/0.1 (civic project; report form; github.com/yasher3413/tabled)"

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": USER_AGENT,
  }
}

export class GitHubError extends Error {
  constructor(readonly status: number) {
    super(`GitHub returned ${status}`)
  }
}

export async function createIssue(token: string, issue: BuiltIssue): Promise<{ number: number; html_url: string }> {
  const res = await fetch(`${API}/issues`, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify(issue),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) throw new GitHubError(res.status)
  const json = (await res.json()) as { number: number; html_url: string }
  return { number: json.number, html_url: json.html_url }
}

/** Reports filed in the last hour (all instances share this count, unlike the in-memory limiter). */
export async function recentReportCount(token: string, now: number): Promise<number> {
  const since = new Date(now - 60 * 60 * 1000).toISOString()
  const res = await fetch(`${API}/issues?labels=user-report&state=all&since=${encodeURIComponent(since)}&per_page=20`, {
    headers: headers(token),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new GitHubError(res.status)
  const items = (await res.json()) as Array<{ created_at: string }>
  // `since` filters on updated_at, so count only issues created in the window.
  return items.filter((i) => Date.parse(i.created_at) >= now - 60 * 60 * 1000).length
}
