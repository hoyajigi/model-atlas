/** Fetch JSON with a descriptive error on failure. */
export const fetchJson = async <T = unknown>(url: string): Promise<T> => {
  try {
    const res = await fetch(url, { headers: { 'user-agent': 'model-atlas-sync/0.1' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as T
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${err instanceof Error ? err.message : String(err)}`)
  }
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
