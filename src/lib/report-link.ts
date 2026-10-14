// The parts of the report feature the browser also needs, kept free of zod so the form stays small.
import { REPO_URL, SITE_URL } from "./site"

export const MAX_SCREENSHOT = 4 * 1024 * 1024 // Vercel caps request bodies at 4.5 MB
export const REPORT_KINDS = ["bug", "data"] as const
export type ReportKind = (typeof REPORT_KINDS)[number]

/** Strip control characters and tags, stop @mentions from pinging anyone, and collapse runs of blank lines. */
export function sanitize(s: string): string {
  return s
    .replace(/<\/?[a-zA-Z!][^>]*>/g, "") // tags and comments; a lone "<" or ">" (as in "< 50") stays
    .replace(/<(?=[a-zA-Z!/])/g, "< ")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/@(?=[A-Za-z0-9-])/g, "@​")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

export function oneLine(s: string) {
  return sanitize(s).replace(/\s+/g, " ").trim()
}

export function truncate(s: string, max: number) {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`
}

/** A prefilled "new issue" link on GitHub, used when the form cannot file the issue itself. */
export function fallbackIssueUrl(input: { description?: string; page?: string; subject?: string; kind?: ReportKind }): string {
  let page = new URL("/", SITE_URL).toString()
  try {
    const u = input.page && input.page.startsWith("/") && !input.page.includes("\\") ? new URL(input.page, SITE_URL) : null
    if (u && u.host === new URL(SITE_URL).host) page = u.toString()
  } catch {}
  const title = `Report: ${input.subject ? oneLine(input.subject) : truncate(oneLine(input.description ?? ""), 60) || "problem on the site"}`
  const body = [`Page: ${page}`, `Kind: ${input.kind === "data" ? "data error" : "bug"}`, "", "What is wrong:", "", sanitize(input.description ?? "")].join("\n")
  const params = new URLSearchParams({ title: truncate(title, 80), body: truncate(body, 6000) })
  return `${REPO_URL}/issues/new?${params}`
}
