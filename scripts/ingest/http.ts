import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs"
import path from "node:path"

export const USER_AGENT =
  "Tabled/0.1 (civic project; contact via GitHub repo github.com/yasher3413/tabled)"

const CACHE_DIR = path.join(process.cwd(), "data", "cache")
const MAX_CONCURRENCY = 3
const MAX_ATTEMPTS = 5

let active = 0
const queue: Array<() => void> = []

async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENCY) await new Promise<void>((resolve) => queue.push(resolve))
  active++
  try {
    return await fn()
  } finally {
    active--
    queue.shift()?.()
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const stats = { network: 0, cached: 0, retries: 0 }

export interface FetchOptions {
  /** Serve from disk cache when the entry is younger than this. Infinity = always use cache. */
  maxAgeMs?: number
  accept?: string
}

function cachePath(url: string, ext: string) {
  const host = new URL(url).hostname.replace(/[^a-z0-9.]/gi, "_")
  const hash = createHash("sha1").update(url).digest("hex").slice(0, 16)
  return path.join(CACHE_DIR, host, `${hash}.${ext}`)
}

/** Polite GET with disk cache, concurrency limit and exponential backoff on 429/5xx. */
export async function fetchText(url: string, opts: FetchOptions = {}): Promise<string> {
  const { maxAgeMs = 6 * 60 * 60 * 1000, accept = "*/*" } = opts
  const file = cachePath(url, "txt")
  if (existsSync(file) && Date.now() - statSync(file).mtimeMs < maxAgeMs) {
    stats.cached++
    return readFileSync(file, "utf8")
  }
  return withSlot(async () => {
    for (let attempt = 1; ; attempt++) {
      let res: Response | null = null
      try {
        res = await fetch(url, {
          headers: { "User-Agent": USER_AGENT, Accept: accept },
          signal: AbortSignal.timeout(60_000),
        })
      } catch (err) {
        if (attempt >= MAX_ATTEMPTS) throw new Error(`GET ${url} failed: ${String(err)}`)
      }
      if (res?.ok) {
        const body = await res.text()
        stats.network++
        mkdirSync(path.dirname(file), { recursive: true })
        writeFileSync(file, body)
        return body
      }
      if (res && res.status !== 429 && res.status < 500) {
        throw new HttpError(url, res.status)
      }
      if (attempt >= MAX_ATTEMPTS) throw new HttpError(url, res?.status ?? 0)
      stats.retries++
      const retryAfter = Number(res?.headers.get("retry-after"))
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt)
    }
  })
}

export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const text = await fetchText(url, { accept: "application/json", ...opts })
  return JSON.parse(text) as T
}

export class HttpError extends Error {
  constructor(
    public url: string,
    public status: number,
  ) {
    super(`GET ${url} returned HTTP ${status}`)
  }
}

/** Run an async mapper over items; the shared slot limiter keeps network concurrency bounded. */
export async function mapAll<T, R>(items: T[], fn: (item: T) => Promise<R>): Promise<R[]> {
  return Promise.all(items.map(fn))
}
