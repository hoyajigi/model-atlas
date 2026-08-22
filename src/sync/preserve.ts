/**
 * Sync scripts regenerate TOML files from upstream, but some fields are
 * curated by hand or by other sync jobs and must survive regeneration.
 */

const isRecord = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === 'object' && !Array.isArray(v)

/** Copy selected top-level fields from `existing` into `next` (upstream wins elsewhere). */
export const preserveFields = (
  next: Record<string, unknown>,
  existing: Record<string, unknown> | null,
  fields: string[]
): Record<string, unknown> => {
  if (!existing) return next
  const kept = Object.fromEntries(fields.filter((f) => existing[f] !== undefined).map((f) => [f, existing[f]]))
  return { ...next, ...kept }
}

/** Preserve `pricing.image` (curated t2i pricing) across offering regeneration. */
export const preserveImagePricing = (
  next: Record<string, unknown>,
  existing: Record<string, unknown> | null
): Record<string, unknown> => {
  const existingPricing = existing?.pricing
  if (!isRecord(existingPricing) || existingPricing.image === undefined) return next
  const nextPricing = isRecord(next.pricing) ? next.pricing : {}
  return { ...next, pricing: { ...nextPricing, image: existingPricing.image } }
}

/** Every sync writes this as `source.url`; anything else means a human edited the row. */
export const UPSTREAM_SOURCE_URL = 'https://models.dev'

/**
 * How long a hand-verified price outranks upstream. Past this the override
 * expires and upstream wins again, so a stale correction gets re-reviewed
 * instead of outliving the price it recorded.
 */
export const MANUAL_PRICING_TTL_DAYS = 180

const TOKEN_PRICING_FIELDS = [
  'input_per_mtok',
  'output_per_mtok',
  'cache_read_per_mtok',
  'cache_write_per_mtok'
]

const MS_PER_DAY = 86_400_000

/** Whole days from `from` to `to`, or undefined if either date is unparseable. */
const daysBetween = (from: unknown, to: string): number | undefined => {
  if (typeof from !== 'string') return undefined
  const start = Date.parse(`${from}T00:00:00Z`)
  const end = Date.parse(`${to}T00:00:00Z`)
  if (Number.isNaN(start) || Number.isNaN(end)) return undefined
  return Math.floor((end - start) / MS_PER_DAY)
}

/**
 * Preserve token pricing a curator verified against the provider's own page.
 *
 * models.dev is the only writer of `source.url = https://models.dev`, so a
 * source pointing anywhere else marks the row as hand-verified. Without this,
 * the daily sync reverts every manual correction and the curator "discovers"
 * and re-fixes the same prices on its next run.
 *
 * The whole `source` block is kept alongside the numbers: it is what marks the
 * row as curated, so dropping it would erase the override on the next sync.
 */
export const preserveManualPricing = (
  next: Record<string, unknown>,
  existing: Record<string, unknown> | null,
  asOf: string
): Record<string, unknown> => {
  const source = existing?.source
  if (!isRecord(source) || typeof source.url !== 'string') return next
  if (source.url.startsWith(UPSTREAM_SOURCE_URL)) return next

  const age = daysBetween(source.as_of, asOf)
  if (age === undefined || age < 0 || age > MANUAL_PRICING_TTL_DAYS) return next

  const existingPricing = existing?.pricing
  if (!isRecord(existingPricing)) return next
  const kept = Object.fromEntries(
    TOKEN_PRICING_FIELDS.filter((f) => existingPricing[f] !== undefined).map((f) => [f, existingPricing[f]])
  )
  if (Object.keys(kept).length === 0) return next

  const nextPricing = isRecord(next.pricing) ? next.pricing : {}
  return { ...next, pricing: { ...nextPricing, ...kept }, source }
}
