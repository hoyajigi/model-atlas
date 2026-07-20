import { z } from 'zod'
import { SourceMeta, isoDate } from './common.ts'

/**
 * A measured inference data point: (model x quant x hardware x engine x workload).
 * Text models report throughput at a given concurrency and sequence shape;
 * image models report seconds per image at a resolution/step count.
 */
export const HardwareEntry = z
  .object({
    /** Reference to a model entity as "org/id" */
    model_ref: z.string().min(1),
    /** Quantization/precision, e.g. "fp16", "fp8", "nvfp4", "gguf-q4_k_m", "mlx-4bit" */
    quant: z.string().min(1),
    /** Hardware slug, e.g. "rtx-5090-32gb", "h100-80gb", "m3-pro-36gb" */
    hardware: z.string().min(1),
    /** Number of devices the measurement used (TP/EP total), default 1 */
    gpus: z.number().int().positive().default(1),
    /** Inference engine, e.g. "vllm", "sglang", "trtllm", "llama.cpp", "mlx", "comfyui" */
    engine: z.string().min(1),
    engine_version: z.string().optional(),
    /** Concurrent requests during measurement, default 1 (single-stream) */
    concurrency: z.number().int().positive().default(1),
    /** Input/output sequence lengths in tokens (text workloads) */
    seq_in: z.number().int().positive().optional(),
    seq_out: z.number().int().positive().optional(),
    vram_gb: z.number().positive().optional(),
    /** Text models: total output tokens/sec across all concurrent requests and GPUs */
    tok_per_s: z.number().positive().optional(),
    ttft_ms: z.number().positive().optional(),
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
