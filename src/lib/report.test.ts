import { describe, expect, it } from "vitest"
import { buildIssue, createRateLimiter, fallbackIssueUrl, reportSchema, sanitize, sniffImage, type ReportInput } from "./report"

const valid = { description: "The vote count on this page is wrong.", page: "/bills/45-1/C-2", kind: "data", email: "", locale: "en", website: "", elapsed: "5000", viewport: "390x844" }

function parse(over: Record<string, unknown> = {}) {
  return reportSchema.safeParse({ ...valid, ...over })
}

describe("reportSchema", () => {
  it("accepts a valid report", () => {
    const r = parse()
    expect(r.success).toBe(true)
    expect(r.data?.elapsed).toBe(5000)
    expect(r.data?.kind).toBe("data")
  })
  it("rejects a short description", () => expect(parse({ description: "bad" }).success).toBe(false))
  it("rejects a bad email", () => expect(parse({ email: "not-an-email" }).success).toBe(false))
  it("accepts an empty or valid email", () => {
    expect(parse({ email: "" }).success).toBe(true)
    expect(parse({ email: "a@example.ca" }).success).toBe(true)
  })
  it("rejects a page on another host", () => expect(parse({ page: "https://evil.example/x" }).success).toBe(false))
  it("rejects protocol-relative pages", () => expect(parse({ page: "//evil.example/x" }).success).toBe(false))
  it("rejects backslash tricks that point at another host", () => {
    expect(parse({ page: "/\\evil.example/phish" }).success).toBe(false)
    expect(parse({ page: "/\\/evil.example" }).success).toBe(false)
  })
  it("counts CRLF newlines once", () => {
    const text = `${"a".repeat(3990)}${"\r\n".repeat(9)}b`
    expect(parse({ description: text }).success).toBe(true)
  })
  it("normalises an absolute URL on this site to its path", () => {
    expect(parse({ page: "https://tabled-ca.vercel.app/mps?party=green" }).data?.page).toBe("/mps?party=green")
  })
  it("rejects an over-long subject", () => expect(parse({ subject: "x".repeat(121) }).success).toBe(false))
  it("rejects an unknown kind", () => expect(parse({ kind: "spam" }).success).toBe(false))
})

describe("sanitize", () => {
  it("strips tags and scripts", () => {
    expect(sanitize('Hello <script>alert(1)</script><b>there</b>')).toBe("Hello alert(1)there")
  })
  it("keeps comparisons", () => {
    expect(sanitize("The yeas show < 50 but the record says > 100")).toBe("The yeas show < 50 but the record says > 100")
  })
  it("neutralises @mentions", () => {
    expect(sanitize("cc @octocat")).toBe("cc @​octocat")
  })
  it("collapses blank lines and removes control characters", () => {
    expect(sanitize("a\n\n\n\nb\u0007")).toBe("a\n\nb")
  })
})

describe("buildIssue", () => {
  const input = parse().data as ReportInput
  it("single-lines and truncates the title", () => {
    const long = { ...input, description: `Line one\nline two ${"word ".repeat(40)}` }
    const { title } = buildIssue(long)
    expect(title.startsWith("Report: Line one line two")).toBe(true)
    expect(title).not.toContain("\n")
    expect(title.length).toBeLessThanOrEqual(80)
  })
  it("prefers the subject for the title", () => {
    expect(buildIssue({ ...input, subject: "Bill C-2 summary" }).title).toBe("Report: Bill C-2 summary")
  })
  it("includes page, language and browser, never an IP", () => {
    const { body } = buildIssue(input, { userAgent: "Mozilla/5.0 (iPhone)", screenshotUrl: "https://blob.example/x.png" })
    expect(body).toContain("https://tabled-ca.vercel.app/bills/45-1/C-2")
    expect(body).toContain("**Language:** en")
    expect(body).toContain("Mozilla/5.0 (iPhone)")
    expect(body).toContain("![Screenshot](https://blob.example/x.png)")
    expect(body).toContain("> The vote count on this page is wrong.")
    expect(body).not.toMatch(/\b\d{1,3}(\.\d{1,3}){3}\b/)
  })
  it("labels by kind", () => {
    expect(buildIssue(input).labels).toEqual(["user-report", "data-error"])
    expect(buildIssue({ ...input, kind: "bug" }).labels).toEqual(["user-report", "bug"])
  })
  it("adds a contact line only when given", () => {
    expect(buildIssue(input).body).not.toContain("Contact")
    expect(buildIssue({ ...input, email: "a@example.ca" }).body).toContain("**Contact:** a@example.ca")
  })
})

describe("sniffImage", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
  it("recognises the four image types", () => {
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("png")
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg")
    expect(sniffImage(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe("webp")
    expect(sniffImage(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe("gif")
  })
  it("refuses SVG and HTML", () => {
    expect(sniffImage(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
    expect(sniffImage(new TextEncoder().encode("<!doctype html><html>"))).toBeNull()
  })
})

describe("createRateLimiter", () => {
  it("allows N, blocks N+1 and resets after the window", () => {
    let t = 0
    const allow = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t })
    expect([allow("a"), allow("a"), allow("a")]).toEqual([true, true, true])
    expect(allow("a")).toBe(false)
    expect(allow("b")).toBe(true)
    t = 1001
    expect(allow("a")).toBe(true)
  })
})

describe("fallbackIssueUrl", () => {
  it("encodes a prefilled GitHub issue", () => {
    const url = new URL(fallbackIssueUrl({ description: "Wrong & odd #1", page: "/bills?x=1", kind: "data" }))
    expect(url.origin + url.pathname).toBe("https://github.com/yasher3413/tabled/issues/new")
    expect(url.searchParams.get("title")).toBe("Report: Wrong & odd #1")
    expect(url.searchParams.get("body")).toContain("Page: https://tabled-ca.vercel.app/bills?x=1")
    expect(url.searchParams.get("body")).toContain("Kind: data error")
  })
  it("ignores a backslash page that resolves elsewhere", () => {
    const url = new URL(fallbackIssueUrl({ page: "/\\evil.example/x" }))
    expect(url.searchParams.get("body")).toContain("Page: https://tabled-ca.vercel.app/\n")
  })
  it("ignores a foreign page", () => {
    const url = new URL(fallbackIssueUrl({ page: "https://evil.example" }))
    expect(url.searchParams.get("body")).toContain("Page: https://tabled-ca.vercel.app/\n")
  })
})
