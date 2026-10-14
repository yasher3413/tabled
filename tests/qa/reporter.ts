import { execSync } from "node:child_process"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import type { FullConfig, Reporter, Suite, TestCase, TestResult } from "@playwright/test/reporter"
import type { Finding } from "./findings"

const OUT = path.join(process.cwd(), "qa-report")

/** Collects each route's findings and writes qa-report/report.json and report.md. */
export default class QaReporter implements Reporter {
  private findings: Finding[] = []
  private routes = new Set<string>()
  private projects = new Set<string>()
  private startedAt = new Date().toISOString()
  private baseURL = ""
  private failed: string[] = []

  onBegin(config: FullConfig, suite: Suite) {
    rmSync(path.join(OUT, "report.json"), { force: true })
    rmSync(path.join(OUT, "report.md"), { force: true })
    rmSync(path.join(OUT, "shots"), { recursive: true, force: true })
    mkdirSync(path.join(OUT, "shots"), { recursive: true })
    this.baseURL = String(config.projects[0]?.use.baseURL ?? "")
    for (const t of suite.allTests()) this.projects.add(t.parent.project()?.name ?? "")
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.routes.add(test.title)
    const a = result.attachments.find((x) => x.name === "findings")
    if (a?.body) this.findings.push(...(JSON.parse(a.body.toString()) as Finding[]))
    if (result.status === "timedOut" || (result.status === "failed" && !a)) {
      this.failed.push(`${test.parent.project()?.name}: ${test.title}: ${result.error?.message?.split("\n")[0] ?? result.status}`)
    }
  }

  onEnd() {
    const seen = new Map<string, Finding & { id: string; count: number }>()
    for (const f of this.findings) {
      const key = `${f.kind}|${f.route}|${f.selector}|${f.project}`
      const prev = seen.get(key)
      if (prev) prev.count++
      else seen.set(key, { ...f, id: `F${seen.size + 1}`, count: 1 })
    }
    const all = [...seen.values()]
    let commit = ""
    try {
      commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim()
    } catch {}
    const report = { startedAt: this.startedAt, baseURL: this.baseURL, commit, projects: [...this.projects], routes: this.routes.size, harnessFailures: this.failed, findings: all }
    mkdirSync(OUT, { recursive: true })
    writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2))

    const active = all.filter((f) => !f.allowlisted)
    const projects = [...this.projects]
    const lines: string[] = [
      "# QA report",
      "",
      `${this.startedAt} · ${this.baseURL} · commit ${commit} · ${this.routes.size} routes`,
      "",
      `| Severity | ${projects.join(" | ")} | Total |`,
      `| --- | ${projects.map(() => "---").join(" | ")} | --- |`,
    ]
    for (const sev of ["error", "warning"] as const) {
      const counts = projects.map((p) => active.filter((f) => f.severity === sev && f.project === p).length)
      lines.push(`| ${sev} | ${counts.join(" | ")} | ${counts.reduce((a, b) => a + b, 0)} |`)
    }
    lines.push(`| allowlisted | ${projects.map((p) => all.filter((f) => f.allowlisted && f.project === p).length).join(" | ")} | ${all.filter((f) => f.allowlisted).length} |`)
    if (this.failed.length) {
      lines.push("", "## Harness failures", "", ...this.failed.map((f) => `- ${f}`))
    }
    for (const sev of ["error", "warning"] as const) {
      const group = active.filter((f) => f.severity === sev)
      if (!group.length) continue
      lines.push("", `## ${sev === "error" ? "Errors" : "Warnings"}`)
      for (const kind of [...new Set(group.map((f) => f.kind))]) {
        lines.push("", `### ${kind}`, "")
        for (const f of group.filter((x) => x.kind === kind)) {
          lines.push(`- **${f.id}** [${f.project}] ${f.route} \`${f.path}\` · \`${f.selector}\`${f.name ? ` (${f.name})` : ""}: expected ${f.expected}; got ${f.actual}${f.count > 1 ? ` (x${f.count})` : ""}${f.screenshot ? ` · ${f.screenshot}` : ""}`)
        }
      }
    }
    const allowed = all.filter((f) => f.allowlisted)
    if (allowed.length) {
      lines.push("", "## Allowlisted", "")
      for (const f of allowed) lines.push(`- [${f.project}] ${f.kind} ${f.route} \`${f.selector}\`: ${f.allowlisted}`)
    }
    writeFileSync(path.join(OUT, "report.md"), lines.join("\n") + "\n")
    const errors = active.filter((f) => f.severity === "error").length
    const warnings = active.filter((f) => f.severity === "warning").length
    console.log(`\nQA: ${errors} errors, ${warnings} warnings, ${allowed.length} allowlisted. See qa-report/report.md`)
  }

  printsToStdio() {
    return false
  }
}
