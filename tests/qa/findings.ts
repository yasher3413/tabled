import { ALLOWLIST } from "./allowlist"

export type Severity = "error" | "warning"

export const ERROR_KINDS = [
  "tap-target-mismatch",
  "blank-tap-navigates",
  "blank-covered",
  "obscured",
  "dead-link",
  "page-error",
  "console-error",
  "http-error",
  "request-failed",
  "overflow",
  "unexpected-dialog",
  "interaction",
] as const
export const WARNING_KINDS = ["small-target", "no-op", "external-rel", "external-url"] as const
export type FindingKind = (typeof ERROR_KINDS)[number] | (typeof WARNING_KINDS)[number]

export interface Finding {
  kind: FindingKind
  severity: Severity
  project: string
  route: string
  path: string
  selector: string
  name: string
  expected: string
  actual: string
  screenshot?: string
  allowlisted?: string
}

export function severityOf(kind: FindingKind): Severity {
  return (WARNING_KINDS as readonly string[]).includes(kind) ? "warning" : "error"
}

/** The reason a finding is accepted, or null. */
export function allowReason(f: Pick<Finding, "kind" | "route" | "selector" | "actual">): string | null {
  for (const a of ALLOWLIST) {
    if (a.kind !== f.kind) continue
    if (a.route !== "*" && a.route !== f.route && !(a.route.endsWith("*") && f.route.startsWith(a.route.slice(0, -1)))) continue
    if (a.selector && !(typeof a.selector === "string" ? f.selector === a.selector : a.selector.test(f.selector))) continue
    if (a.actual && !a.actual.test(f.actual)) continue
    return a.reason
  }
  return null
}
