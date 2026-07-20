import { z } from 'zod'
import { SourceMeta, slug } from './common.ts'

/** A benchmark suite definition. Scores live on model entries. */
export const Benchmark = z
  .object({
    id: slug,
    name: z.string().min(1),
    url: z.string().url(),
    /** e.g. "knowledge", "reasoning", "korean", "t2i-quality", "arena-elo" */
    category: z.string(),
    higher_is_better: z.boolean().default(true),
    /** License of the published results, e.g. "CC-BY-4.0" */
    data_license: z.string().optional(),
    description: z.string().optional(),
    source: SourceMeta
  })
  .strict()

export type BenchmarkT = z.infer<typeof Benchmark>
