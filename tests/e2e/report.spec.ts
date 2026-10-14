import { expect, test, type Page } from "@playwright/test"

// The test server runs with REPORT_FIXTURES=1: the endpoint validates and formats the issue but files nothing.
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64)])

async function ready(page: Page) {
  await expect(page.locator("main form:not([inert])")).toBeVisible()
  // The endpoint rejects forms filled faster than a person could.
  await page.waitForTimeout(3100)
}

test.describe("report a problem", () => {
  test("footer link carries the current page", async ({ page }) => {
    await page.goto("/bills")
    await page.locator("footer").getByRole("link", { name: "Report a problem" }).click()
    await expect(page).toHaveURL(/\/report\?page=%2Fbills$/)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Report a problem")
    await expect(page.getByLabel("Page", { exact: true })).toHaveValue("/bills")
  })

  test("validates, then files a report with a screenshot", async ({ page }) => {
    await page.goto("/report?page=/bills/45-1/C-2&subject=Bill%20C-2%20summary&kind=data")
    await ready(page)
    await expect(page.getByRole("radio", { name: "Information is wrong" })).toBeChecked()
    await page.getByRole("button", { name: "Send report" }).click()
    await expect(page.getByText("Describe the problem in at least 10 characters.")).toBeVisible()
    await expect(page.getByLabel("What happened")).toBeFocused()

    await page.getByLabel("What happened").fill("The second reading date is a day off.")
    await page.getByLabel("Screenshot (optional)").setInputFiles({ name: "shot.png", mimeType: "image/png", buffer: PNG })
    await expect(page.getByRole("img", { name: "Screenshot preview" })).toBeVisible()
    const response = page.waitForResponse((r) => r.url().endsWith("/api/report"))
    await page.getByRole("button", { name: "Send report" }).click()
    const json = await (await response).json()
    expect(json.ok).toBe(true)
    expect(json.preview.labels).toEqual(["user-report", "data-error"])
    expect(json.preview.title).toBe("Report: Bill C-2 summary")
    expect(json.preview.body).toContain("https://tabled-ca.vercel.app/bills/45-1/C-2")
    expect(json.preview.body).toContain("![Screenshot](")
    const status = page.getByRole("status")
    await expect(status).toContainText("Your report is issue #0 on GitHub.")
    await expect(status.getByRole("link", { name: "View the issue" })).toHaveAttribute("href", /issues\/0$/)
    await expect(status).toBeFocused()
  })

  test("refuses a screenshot over 4 MB before sending", async ({ page }) => {
    await page.goto("/report")
    await ready(page)
    const big = Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024)])
    await page.getByLabel("Screenshot (optional)").setInputFiles({ name: "big.png", mimeType: "image/png", buffer: big })
    await expect(page.getByText("That image is larger than 4 MB.")).toBeVisible()
    await expect(page.getByRole("img", { name: "Screenshot preview" })).toHaveCount(0)
  })

  test("a filled honeypot gets a quiet success and no issue link", async ({ request }) => {
    const res = await request.post("/api/report", {
      multipart: { description: "Buy cheap things at my site today", page: "/", website: "https://spam.example", elapsed: "9000", kind: "bug", locale: "en" },
    })
    expect(res.status()).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  test("rejects a foreign origin and non-image uploads", async ({ request }) => {
    const foreign = await request.post("/api/report", { headers: { Origin: "https://evil.example" }, multipart: { description: "x".repeat(20), elapsed: "9000" } })
    expect(foreign.status()).toBe(403)
    const svg = await request.post("/api/report", {
      multipart: { description: "An SVG pretending to be a screenshot", page: "/", elapsed: "9000", screenshot: { name: "x.png", mimeType: "image/png", buffer: Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>") } },
    })
    expect(svg.status()).toBe(400)
    expect((await svg.json()).error).toBe("image")
  })

  test("works in French", async ({ page }) => {
    await page.goto("/fr/report?page=/fr/mps")
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Signaler un problème")
    await ready(page)
    await page.getByLabel("Ce qui s’est passé").fill("Le nom de la circonscription est mal écrit.")
    await page.getByRole("button", { name: "Envoyer" }).click()
    await expect(page.getByRole("status")).toContainText("Votre signalement est le ticket no 0 sur GitHub.")
  })

  test("fits a 390px phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/report")
    await ready(page)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
    await expect(page.getByRole("button", { name: "Send report" })).toBeVisible()
  })
})
