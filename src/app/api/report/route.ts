// Files a problem report from /report as a public GitHub issue. POST handlers are never cached, so this always
// runs per request. Without GITHUB_ISSUES_TOKEN it answers "unconfigured" and the form offers a prefilled
// GitHub link instead. Token values and GitHub error bodies never reach the client or the logs.
import { del, put } from "@vercel/blob"
import { createIssue, recentReportCount } from "@/lib/github"
import { buildIssue, createRateLimiter, fallbackIssueUrl, MAX_SCREENSHOT, MIN_FILL_MS, reportSchema, sniffImage } from "@/lib/report"

const GLOBAL_PER_HOUR = 10
const perIp = createRateLimiter({ limit: 3, windowMs: 10 * 60 * 1000 })

function fields(form: FormData) {
  const get = (k: string) => {
    const v = form.get(k)
    return typeof v === "string" ? v : undefined
  }
  return {
    description: get("description") ?? "",
    page: get("page") ?? "/",
    kind: get("kind") || undefined,
    email: get("email") ?? "",
    locale: get("locale") || undefined,
    website: get("website") ?? "",
    elapsed: get("elapsed") ?? "0",
    viewport: get("viewport") ?? "",
    subject: get("subject") || undefined,
  }
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin")
  if (origin) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host")
    let ok = false
    try {
      ok = new URL(origin).host === host
    } catch {}
    if (!ok) return Response.json({ error: "forbidden" }, { status: 403 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return Response.json({ error: "invalid", fields: [] }, { status: 400 })
  }
  const raw = fields(form)
  // Honeypot: people never see this field. Pretend it worked so bots learn nothing.
  if (raw.website) return Response.json({ ok: true })

  const parsed = reportSchema.safeParse(raw)
  if (!parsed.success) {
    return Response.json({ error: "invalid", fields: [...new Set(parsed.error.issues.map((i) => String(i.path[0])))] }, { status: 400 })
  }
  const input = parsed.data
  const fallbackUrl = fallbackIssueUrl(input)
  if (input.elapsed < MIN_FILL_MS) return Response.json({ error: "tooFast", fallbackUrl }, { status: 429 })

  const file = form.get("screenshot")
  let image: { file: File; ext: string } | null = null
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_SCREENSHOT) return Response.json({ error: "tooBig", fallbackUrl }, { status: 400 })
    const ext = sniffImage(new Uint8Array(await file.slice(0, 16).arrayBuffer()))
    if (!ext) return Response.json({ error: "image", fallbackUrl }, { status: 400 })
    image = { file, ext }
  }

  const userAgent = request.headers.get("user-agent")
  if (process.env.REPORT_FIXTURES === "1" && !process.env.VERCEL) {
    const preview = buildIssue(input, { userAgent, screenshotUrl: image ? `https://example.invalid/reports/fixture.${image.ext}` : null })
    return Response.json({ ok: true, issueUrl: "https://github.com/yasher3413/tabled/issues/0", issueNumber: 0, preview })
  }

  const token = process.env.GITHUB_ISSUES_TOKEN
  if (!token) return Response.json({ error: "unconfigured", fallbackUrl }, { status: 503 })

  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown"
  if (!perIp(ip)) return Response.json({ error: "busy", fallbackUrl }, { status: 429 })
  try {
    if ((await recentReportCount(token, Date.now())) >= GLOBAL_PER_HOUR) return Response.json({ error: "busy", fallbackUrl }, { status: 429 })
  } catch {
    return Response.json({ error: "github", fallbackUrl }, { status: 502 })
  }

  let screenshotUrl: string | null = null
  let screenshotSkipped = false
  if (image) {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const blob = await put(`reports/${crypto.randomUUID()}.${image.ext}`, image.file, { access: "public", contentType: `image/${image.ext}` })
        screenshotUrl = blob.url
      } catch {
        screenshotSkipped = true
      }
    } else {
      screenshotSkipped = true
    }
  }

  try {
    const issue = await createIssue(token, buildIssue(input, { userAgent, screenshotUrl }))
    return Response.json({ ok: true, issueUrl: issue.html_url, issueNumber: issue.number, screenshotSkipped })
  } catch {
    if (screenshotUrl) await del(screenshotUrl).catch(() => {})
    return Response.json({ error: "github", fallbackUrl }, { status: 502 })
  }
}
