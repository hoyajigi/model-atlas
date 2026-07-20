import { z } from 'zod'
import { SourceMeta, slug } from './common.ts'

/** An API provider hosting one or more model offerings. */
export const Provider = z
  .object({
    id: slug,
    name: z.string().min(1),
    api_base: z.string().url().optional(),
    /** API style, e.g. "openai-compatible", "anthropic", "proprietary" */
    api_style: z.string().optional(),
    docs_url: z.string().url().optional(),
    pricing_url: z.string().url().optional(),
    source: SourceMeta
  })
  .strict()

export type ProviderT = z.infer<typeof Provider>
