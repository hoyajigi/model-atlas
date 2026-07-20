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
