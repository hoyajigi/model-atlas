import { z } from 'zod'
import { Modality, SourceMeta } from './common.ts'

/**
 * Image generation pricing keeps the provider's original billing unit
 * and adds a normalized $/image figure at 1024x1024 for comparison.
 */
export const ImagePricing = z
  .object({
    unit: z.enum(['per_image', 'per_megapixel', 'per_gpu_second']),
    usd: z.number().nonnegative(),
    /** For per_image pricing: the resolution the price applies to */
    resolution: z.string().optional(),
    /** For per_gpu_second pricing: the GPU type billed */
    gpu: z.string().optional(),
    /** Normalized cost of one 1024x1024 image in USD */
    usd_per_image_1024: z.number().nonnegative().optional()
  })
  .strict()

export const TokenPricing = z
  .object({
    input_per_mtok: z.number().nonnegative().optional(),
    output_per_mtok: z.number().nonnegative().optional(),
    cache_read_per_mtok: z.number().nonnegative().optional(),
    cache_write_per_mtok: z.number().nonnegative().optional(),
    reasoning_per_mtok: z.number().nonnegative().optional(),
    per_request: z.number().nonnegative().optional(),
    image: ImagePricing.optional()
  })
  .strict()

export const Capabilities = z
  .object({
    tool_call: z.boolean().optional(),
    reasoning: z.boolean().optional(),
    structured_output: z.boolean().optional(),
    vision: z.boolean().optional(),
    audio_input: z.boolean().optional(),
    pdf_input: z.boolean().optional(),
    caching: z.boolean().optional()
  })
  .strict()

/** A specific model as offered by a specific provider (pricing, limits). */
export const Offering = z
  .object({
    /** The provider's own model identifier used in API calls */
    model_id: z.string().min(1),
    /** Reference to a model entity: "data/models/{org}/{id}.toml" as "org/id" */
    model_ref: z.string().optional(),
    name: z.string().min(1),
    modality: Modality,
    status: z.enum(['active', 'deprecated', 'retired']).default('active'),
    context: z.number().int().positive().optional(),
    max_output: z.number().int().positive().optional(),
    knowledge_cutoff: z.string().optional(),
    release_date: z.string().optional(),
    pricing: TokenPricing.optional(),
    capabilities: Capabilities.optional(),
    source: SourceMeta
  })
  .strict()

export type OfferingT = z.infer<typeof Offering>
export type ImagePricingT = z.infer<typeof ImagePricing>
