import { z } from 'zod'
import { Modality, SourceMeta, isoDate, slug } from './common.ts'

export const BenchmarkScore = z.object({
  score: z.number(),
  source: z.string().url(),
  as_of: isoDate
})

/** A model entity, independent of any hosting provider. */
export const Model = z
  .object({
    id: slug,
    name: z.string().min(1),
    org: slug,
    family: z.string().optional(),
    modality: Modality,
    open_weights: z.boolean(),
    hf_id: z.string().optional(),
    /** SPDX-ish license id, e.g. "apache-2.0", "llama-4-community" */
    license: z.string().optional(),
    params: z.number().int().positive().optional(),
    /** Activated params per token for MoE models */
    active_params: z.number().int().positive().optional(),
    context: z.number().int().positive().optional(),
    release_date: isoDate.optional(),
    knowledge_cutoff: isoDate.optional(),
    modalities: z
      .object({
        input: z.array(z.string()),
        output: z.array(z.string())
      })
      .optional(),
    /** Available quantization variants, e.g. ["fp8", "gguf-q4_k_m", "mlx-4bit"] */
    quants: z.array(z.string()).optional(),
    /** Precision -> required VRAM in GB, e.g. { fp16 = 48.0, q4 = 14.5 } */
    vram_gb: z.record(z.string(), z.number().positive()).optional(),
    /** Benchmark suite id -> score. Suite must exist in data/benchmarks/. */
    benchmarks: z.record(z.string(), BenchmarkScore).optional(),
    hf_downloads_30d: z.number().int().nonnegative().optional(),
    hf_likes: z.number().int().nonnegative().optional(),
    gated: z.boolean().optional(),
    source: SourceMeta
  })
  .strict()

export type ModelT = z.infer<typeof Model>
