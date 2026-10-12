import AxeBuilder from "@axe-core/playwright"
import { expect, type Page } from "@playwright/test"

export async function setTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((t) => {
    try {
      localStorage.setItem("tabled-theme", t)
    } catch {}
  }, theme)
}

/** Zero serious or critical axe violations, reported with enough detail to fix. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze()
  const bad = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical")
  const report = bad.map((v) => `${v.id} (${v.impact}): ${v.help}\n  ${v.nodes.slice(0, 5).map((n) => n.target.join(" ")).join("\n  ")}`)
  expect(report, report.join("\n")).toEqual([])
}
