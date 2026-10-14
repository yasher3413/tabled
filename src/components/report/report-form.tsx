"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import type { Locale } from "@/i18n/config"
import { getMessages } from "@/i18n/messages"
import { fallbackIssueUrl, MAX_SCREENSHOT, type ReportKind } from "@/lib/report-link"
import { cn } from "@/lib/utils"

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]
const FIELD = "w-full rounded-sm border border-rule bg-paper-raised px-3 text-[0.9375rem] text-ink transition-colors duration-150 placeholder:text-ink-3 hover:border-ink-3 aria-[invalid=true]:border-danger-ink"
const LABEL = "text-xs font-medium text-ink-3"
const HELP = "mt-1.5 text-[0.8125rem] text-ink-3"
const ERROR = "mt-1.5 text-[0.8125rem] text-danger-ink"

/** Milliseconds since the form was ready; the endpoint rejects forms filled faster than a person could. */
function msSince(start: number) {
  return Date.now() - start
}

function now() {
  return Date.now()
}

type ErrorCode = "invalid" | "image" | "tooBig" | "tooFast" | "busy" | "unconfigured" | "github" | "network"
type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; issueUrl?: string; issueNumber?: number; screenshotSkipped?: boolean }
  | { kind: "error"; code: ErrorCode; fallbackUrl: string }

export function ReportFormWithParams({ locale }: { locale: Locale }) {
  const sp = useSearchParams()
  // Keyed by the query so following another report link (a different bill, the footer) starts a fresh form.
  return <ReportForm key={sp.toString()} locale={locale} params={{ page: sp.get("page") ?? "", subject: sp.get("subject") ?? "", kind: sp.get("kind") ?? "" }} interactive />
}

export function ReportForm({ locale, params, interactive = false }: { locale: Locale; params: { page?: string; subject?: string; kind?: string }; interactive?: boolean }) {
  const t = getMessages(locale).report
  const id = useId()
  const [kind, setKind] = useState<ReportKind>(params.kind === "data" ? "data" : "bug")
  const [description, setDescription] = useState("")
  const [page, setPage] = useState(params.page ?? "")
  const [email, setEmail] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<"description" | "email" | "page" | "screenshot", string>>>({})
  const [status, setStatus] = useState<Status>({ kind: "idle" })
  const started = useRef(0)
  const fileInput = useRef<HTMLInputElement>(null)
  const result = useRef<HTMLDivElement>(null)

  useEffect(() => {
    started.current = now()
  }, [])

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- object URL lifecycle follows the file
    setPreview(url)
    return () => {
      URL.revokeObjectURL(url)
      setPreview(null)
    }
  }, [file])

  useEffect(() => {
    if (status.kind === "done" || status.kind === "error") result.current?.focus()
  }, [status])

  function pickFile(f: File | null) {
    if (!f) {
      setFile(null)
      setFieldErrors((e) => ({ ...e, screenshot: undefined }))
      return
    }
    // A refused file is never kept, so its message informs but does not block sending.
    if (!IMAGE_TYPES.includes(f.type) || f.size > MAX_SCREENSHOT) {
      setFieldErrors((e) => ({ ...e, screenshot: IMAGE_TYPES.includes(f.type) ? t.errors.tooBig : t.errors.image }))
      if (fileInput.current && !file) fileInput.current.value = ""
      return
    }
    setFieldErrors((e) => ({ ...e, screenshot: undefined }))
    setFile(f)
  }

  function removeFile() {
    setFile(null)
    setFieldErrors((e) => ({ ...e, screenshot: undefined }))
    if (fileInput.current) fileInput.current.value = ""
  }

  function validate() {
    const errors: typeof fieldErrors = {}
    if (description.trim().length < 10) errors.description = t.errors.description
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = t.errors.email
    if (page.trim() && !page.trim().startsWith("/") && !/^https?:\/\//.test(page.trim())) errors.page = t.errors.page
    return errors
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const errors = validate()
    setFieldErrors({ ...errors, screenshot: fieldErrors.screenshot })
    const first = (["description", "page", "email"] as const).find((k) => errors[k])
    if (first) {
      document.getElementById(`${id}-${first}`)?.focus()
      return
    }
    const fallbackUrl = fallbackIssueUrl({ description, page: page.trim(), subject: params.subject, kind })
    const body = new FormData(e.currentTarget)
    body.set("kind", kind)
    body.set("locale", locale)
    body.set("elapsed", String(msSince(started.current)))
    body.set("viewport", `${window.innerWidth}x${window.innerHeight}`)
    if (params.subject) body.set("subject", params.subject)
    if (file) body.set("screenshot", file)
    setStatus({ kind: "sending" })
    try {
      const res = await fetch("/api/report", { method: "POST", body })
      const json = (await res.json().catch(() => ({}))) as { ok?: boolean; issueUrl?: string; issueNumber?: number; screenshotSkipped?: boolean; error?: ErrorCode; fallbackUrl?: string; fields?: string[] }
      if (res.ok && json.ok) {
        setStatus({ kind: "done", issueUrl: json.issueUrl, issueNumber: json.issueNumber, screenshotSkipped: json.screenshotSkipped })
        return
      }
      const code: ErrorCode = json.error && json.error in t.errors ? json.error : "github"
      if (code === "invalid" && json.fields?.length) {
        const map: typeof fieldErrors = {}
        for (const f of json.fields) if (f === "description" || f === "email" || f === "page") map[f] = t.errors[f]
        setFieldErrors(map)
      }
      setStatus({ kind: "error", code, fallbackUrl: json.fallbackUrl ?? fallbackUrl })
    } catch {
      setStatus({ kind: "error", code: "network", fallbackUrl })
    }
  }

  if (status.kind === "done") {
    return (
      <div ref={result} tabIndex={-1} role="status" className="max-w-[44rem] border-y border-rule py-6 text-[1rem] text-ink outline-none">
        {status.issueUrl && status.issueNumber !== undefined ? (
          <p>
            {t.success(status.issueNumber)}{" "}
            <a className="link" href={status.issueUrl}>
              {t.viewIssue}
            </a>
          </p>
        ) : (
          <p>{t.successSpam}</p>
        )}
        {status.screenshotSkipped && <p className="mt-2 text-[0.875rem] text-ink-2">{t.screenshotSkipped}</p>}
      </div>
    )
  }

  const sending = status.kind === "sending"
  const describe = (k: string, help: boolean) => [help ? `${id}-${k}-help` : null, fieldErrors[k as keyof typeof fieldErrors] ? `${id}-${k}-error` : null].filter(Boolean).join(" ") || undefined

  return (
    <form onSubmit={submit} noValidate inert={!interactive ? true : undefined} className="max-w-[44rem]">
      <p className="border-l-2 border-rule-strong pl-4 text-[0.9375rem] text-ink-2">{t.publicNotice}</p>

      <fieldset className="mt-8">
        <legend className={LABEL}>{t.kind}</legend>
        <div className="mt-1.5 inline-flex flex-wrap rounded-sm border border-rule p-0.5 text-[0.9375rem]">
          {(["bug", "data"] as const).map((k) => (
            <label key={k} className="relative cursor-pointer">
              <input type="radio" name="kind-choice" value={k} checked={kind === k} onChange={() => setKind(k)} className="peer sr-only" />
              <span className="block rounded-[2px] px-3 py-1.5 text-ink-2 transition-colors duration-150 peer-checked:bg-ink peer-checked:text-paper peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-ink hover:text-ink peer-checked:hover:text-paper">
                {t.kinds[k]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6">
        <label htmlFor={`${id}-description`} className={LABEL}>
          {t.description}
        </label>
        <textarea
          id={`${id}-description`}
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onPaste={(e) => {
            const image = Array.from(e.clipboardData.files).find((f) => f.type.startsWith("image/"))
            if (image) {
              e.preventDefault()
              pickFile(image)
            }
          }}
          rows={7}
          maxLength={4000}
          required
          aria-invalid={!!fieldErrors.description}
          aria-describedby={describe("description", true)}
          className={cn(FIELD, "mt-1.5 block min-h-40 py-2.5 leading-relaxed")}
        />
        <p id={`${id}-description-help`} className={HELP}>
          {t.descriptionHelp}
        </p>
        {fieldErrors.description && (
          <p id={`${id}-description-error`} className={ERROR}>
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor={`${id}-page`} className={LABEL}>
          {t.page}
        </label>
        <input
          id={`${id}-page`}
          name="page"
          value={page}
          onChange={(e) => setPage(e.target.value)}
          maxLength={500}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!fieldErrors.page}
          aria-describedby={describe("page", true)}
          className={cn(FIELD, "mt-1.5 h-10")}
        />
        <p id={`${id}-page-help`} className={HELP}>
          {t.pageHelp}
        </p>
        {fieldErrors.page && (
          <p id={`${id}-page-error`} className={ERROR}>
            {fieldErrors.page}
          </p>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor={`${id}-screenshot`} className={LABEL}>
          {t.screenshot}
        </label>
        <input
          ref={fileInput}
          id={`${id}-screenshot`}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          aria-invalid={!!fieldErrors.screenshot}
          aria-describedby={describe("screenshot", true)}
          className="mt-1.5 block w-full text-[0.875rem] text-ink-2 file:mr-3 file:h-10 file:cursor-pointer file:rounded-sm file:border file:border-rule-strong file:bg-paper file:px-4 file:text-[0.9375rem] file:text-ink file:transition-colors file:duration-150 hover:file:bg-ink hover:file:text-paper"
        />
        <p id={`${id}-screenshot-help`} className={HELP}>
          {t.screenshotHelp}
        </p>
        {fieldErrors.screenshot && (
          <p id={`${id}-screenshot-error`} className={ERROR}>
            {fieldErrors.screenshot}
          </p>
        )}
        {file && preview && (
          <div className="mt-3 flex items-end gap-4">
            {/* A local object URL preview; next/image cannot optimise blob: URLs. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={t.screenshotPreview} className="max-h-32 max-w-48 rounded-sm border border-rule object-contain" />
            <button type="button" onClick={removeFile} className="link min-h-6 text-[0.875rem]">
              {t.removeScreenshot}
            </button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <label htmlFor={`${id}-email`} className={LABEL}>
          {t.email}
        </label>
        <input
          id={`${id}-email`}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          maxLength={254}
          autoComplete="email"
          aria-invalid={!!fieldErrors.email}
          aria-describedby={describe("email", true)}
          className={cn(FIELD, "mt-1.5 h-10")}
        />
        <p id={`${id}-email-help`} className={HELP}>
          {t.emailHelp}
        </p>
        {fieldErrors.email && (
          <p id={`${id}-email-error`} className={ERROR}>
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots that fill every field give themselves away. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>{t.honeypot}</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="mt-8 border-t border-rule pt-6">
        <button
          type="submit"
          disabled={sending}
          aria-busy={sending}
          className="h-12 rounded-sm bg-ink px-5 text-[1rem] font-medium text-paper transition-colors duration-150 hover:bg-accent-ink disabled:opacity-70"
        >
          {sending ? t.sending : t.send}
        </button>
      </div>

      {status.kind === "error" && (
        <div ref={result} tabIndex={-1} role="alert" className="mt-6 border-l-2 border-danger-ink pl-4 text-[0.9375rem] text-ink outline-none">
          <p>{status.code === "invalid" ? t.errors.invalid : t.errors[status.code]}</p>
          {status.code !== "invalid" && status.code !== "tooFast" && (
            <p className="mt-2">
              <a className="link" href={status.fallbackUrl}>
                {t.fallback}
              </a>
            </p>
          )}
        </div>
      )}
    </form>
  )
}
