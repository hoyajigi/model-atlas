import { z } from 'zod'
import { SourceMeta, isoDate } from './common.ts'

/** A measured (model x quant x hardware) data point: VRAM and throughput. */
export const HardwareEntry = z
  .object({
    /** Reference to a model entity as "org/id" */
    model_ref: z.string().min(1),
    /** Quantization/precision, e.g. "fp16", "gguf-q4_k_m", "mlx-4bit" */
    quant: z.string().min(1),
    /** Hardware slug, e.g. "rtx-5090-32gb", "m3-pro-36gb", "rtx-5090x2" */
    hardware: z.string().min(1),
    backend: z.string().optional(),
    vram_gb: z.number().positive().optional(),
    /** Text models: decode throughput */
    tok_per_s: z.number().positive().optional(),
    /** Image models: seconds per image at the given resolution/steps */
    sec_per_image: z.number().positive().optional(),
    resolution: z.string().optional(),
    steps: z.number().int().positive().optional(),
    batch_size: z.number().int().positive().optional(),
    measured_on: isoDate.optional(),
    source: SourceMeta
  })
  .strict()
  .refine((e) => e.vram_gb !== undefined || e.tok_per_s !== undefined || e.sec_per_image !== undefined, {
    message: 'at least one measurement (vram_gb, tok_per_s, sec_per_image) is required'
  })

export type HardwareEntryT = z.infer<typeof HardwareEntry>
