export const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const RETRY_DELAYS_MS = [5_000, 20_000, 60_000]

/** Fetch JSON with retry/backoff on 429 and 5xx, and a descriptive error on failure. */
export const fetchJson = async <T = unknown>(url: string): Promise<T> => {
  let lastError = ''
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'model-atlas-sync/0.1' } })
      if (res.ok) return (await res.json()) as T
      lastError = `HTTP ${res.status}`
      if (res.status !== 429 && res.status < 500) break
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
    }
    const delay = RETRY_DELAYS_MS[attempt]
    if (delay !== undefined) await sleep(delay)
  }
  throw new Error(`Failed to fetch ${url}: ${lastError}`)
}

export const today = (): string => {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

/** Recursively drop undefined/null values so TOML serialization stays clean. */
export const compact = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map(compact) as T
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, compact(v)])
    return Object.fromEntries(entries) as T
  }
  return value
}

/** Sanitize a model id into a filesystem-safe slug. */
export const fileSlug = (id: string): string => id.toLowerCase().replace(/[^a-z0-9._-]+/g, '-')
