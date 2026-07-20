import { join } from 'node:path'
import { DATA_DIR, loadDataset } from '../lib/dataset.ts'
import { info, warn } from '../lib/log.ts'
import { writeToml } from '../lib/toml-io.ts'
import { HardwareEntry } from '../schema/index.ts'
import { compact, fetchJson, sleep } from './fetch.ts'

const API = 'https://inferencex.semianalysis.com/api/v1/benchmarks'

/** InferenceX display-model name -> our model ref ("org/id"). Only solid matches. */
const MODEL_MAP: Record<string, string> = {
  'gpt-oss-120b': 'openai/gpt-oss-120b',
  'DeepSeek-R1-0528': 'deepseek/deepseek-r1-0528',
  'Llama-3.3-70B-Instruct-FP8': 'meta/llama-3.3-70b-instruct',
  'Qwen-3.5-397B-A17B': 'qwen/qwen3.5-397b-a17b'
}

interface IxRow {
  hardware: string
  framework: string
  precision: string
  benchmark_type: string
  is_multinode: boolean
  disagg: boolean
  isl: number
  osl: number
  conc: number
  num_decode_gpu: number
  num_prefill_gpu: number
  image?: string
  date?: string
  run_url?: string
  metrics: { output_tput_per_gpu?: number; median_ttft?: number }
}

const gpusOf = (r: IxRow): number => Math.max(r.num_decode_gpu, r.num_prefill_gpu, 1)

const engineVersion = (image?: string): string | undefined => {
  const tag = image?.split(':').pop()
  return tag && tag !== 'latest' ? tag : undefined
}

const round = (n: number, digits = 1): number => Math.round(n * 10 ** digits) / 10 ** digits

/** One entry per (hardware, engine, precision, seq shape): the throughput-optimal point. */
const bestPerGroup = (rows: IxRow[]): Map<string, IxRow> => {
  const best = new Map<string, IxRow>()
  for (const r of rows) {
    if (r.benchmark_type !== 'single_turn' || r.is_multinode || r.disagg) continue
    if (!r.metrics.output_tput_per_gpu) continue
    const key = `${r.hardware}|${r.framework}|${r.precision}|${r.isl}|${r.osl}`
    const seen = best.get(key)
    if (!seen || r.metrics.output_tput_per_gpu > (seen.metrics.output_tput_per_gpu ?? 0)) best.set(key, r)
  }
  return best
}

const toEntry = (modelRef: string, r: IxRow, asOf: string): Record<string, unknown> =>
  compact({
    model_ref: modelRef,
    quant: r.precision,
    hardware: r.hardware,
    gpus: gpusOf(r),
    engine: r.framework,
    engine_version: engineVersion(r.image),
    concurrency: r.conc,
    seq_in: r.isl,
    seq_out: r.osl,
    tok_per_s: round((r.metrics.output_tput_per_gpu ?? 0) * gpusOf(r)),
    ttft_ms: r.metrics.median_ttft ? round(r.metrics.median_ttft * 1000) : undefined,
    measured_on: r.date?.slice(0, 10),
    source: {
      url: r.run_url ?? 'https://inferencex.semianalysis.com',
      as_of: asOf,
      note: 'InferenceX by SemiAnalysis (Apache-2.0), throughput-optimal point per config'
    }
  })

const main = async (): Promise<void> => {
  const ds = await loadDataset()
  const asOf = new Date().toISOString().slice(0, 10)
  let written = 0
  for (const [display, modelRef] of Object.entries(MODEL_MAP)) {
    const model = ds.models.get(modelRef)
    if (!model) {
      warn(`${modelRef}: not in dataset, skipping InferenceX ingest for "${display}"`)
      continue
    }
    const rows = await fetchJson<IxRow[]>(`${API}?model=${encodeURIComponent(display)}`)
    let count = 0
    for (const r of bestPerGroup(rows).values()) {
      const entry = toEntry(modelRef, r, asOf)
      const parsed = HardwareEntry.safeParse(entry)
      if (!parsed.success) {
        warn(`${display} ${r.hardware}/${r.framework}: ${parsed.error.issues[0]?.message}`)
        continue
      }
      const file = `${r.hardware}-${r.framework}-${r.precision}-${r.isl}-${r.osl}.toml`
      await writeToml(join(DATA_DIR, 'hardware', model.id, file), entry)
      count += 1
    }
    info(`${display}: ${count} configs ingested`)
    written += count
    await sleep(1000)
  }
  info(`InferenceX: ${written} hardware entries total`)
}

await main()
