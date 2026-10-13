import { expect, test } from "@playwright/test"
import { runSpecial } from "./interactions"
import { externalQueue, Qa } from "./qa"
import { qaRoutes } from "./routes"

// French routes run in two projects only, to keep the run near ten minutes.
const FR_PROJECTS = ["desktop-chromium", "mobile-webkit"]
const checkedExternal = new Set<string>()

for (const route of qaRoutes()) {
  test(route.name, async ({ page, context, request }, testInfo) => {
    test.skip(route.name.startsWith("fr-") && !FR_PROJECTS.includes(testInfo.project.name), "French routes run in two projects")
    const qa = new Qa(page, context, request, route, testInfo.project.name, testInfo)
    qa.listen()
    try {
      await qa.load()
      await qa.staticChecks()
      await qa.blankTaps()
      await qa.tapSample()
      await runSpecial(qa)
      if (process.env.QA_EXTERNAL === "1") {
        for (const url of externalQueue) {
          if (checkedExternal.has(url)) continue
          checkedExternal.add(url)
          const res = await request.head(url, { timeout: 5000 }).catch(() => null)
          if (!res || res.status() >= 400) qa.add("external-url", { selector: url, expected: "reachable", actual: res ? String(res.status()) : "no response" })
        }
      }
    } finally {
      await qa.attach()
    }
    expect.soft(qa.errors()).toEqual([])
  })
}
