"use client"

import { useCallback } from "react"

/** Replace query params without a navigation; Next keeps useSearchParams in sync with history.replaceState. */
export function useReplaceParams(params: Record<string, string>, defaults: Record<string, string> = {}) {
  return useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams()
      const merged = { ...params, ...patch }
      for (const [k, v] of Object.entries(merged)) {
        if (v && v !== defaults[k]) next.set(k, v)
      }
      const qs = next.toString()
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname)
    },
    [params, defaults],
  )
}

export function paramsToRecord(sp: URLSearchParams | null): Record<string, string> {
  const out: Record<string, string> = {}
  sp?.forEach((v, k) => (out[k] = v))
  return out
}
