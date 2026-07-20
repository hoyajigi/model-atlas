import { join } from 'node:path'
import { DATA_DIR } from '../lib/dataset.ts'
import { info, warn } from '../lib/log.ts'
import { readTomlIfExists, writeToml } from '../lib/toml-io.ts'
import { Model } from '../schema/index.ts'
import { compact, fetchJson, today } from './fetch.ts'
import { preserveFields } from './preserve.ts'
import { LLM_SEEDS, T2I_SEEDS, type Seed } from './seeds.ts'

interface HfModel {
  id: string
  downloads?: number
  likes?: number
  gated?: boolean | string
  tags?: string[]
  pipeline_tag?: string
  createdAt?: string
  cardData?: { license?: string }
  safetensors?: { total?: number }
}

const licenseOf = (hf: HfModel): string | undefined => {
  if (hf.cardData?.license) return hf.cardData.license
  const tag = hf.tags?.find((t) => t.startsWith('license:'))
  return tag?.slice('license:'.length)
}

const modalityOf = (hf: HfModel): string => {
  const byTag: Record<string, string> = {
    'text-generation': 'text',
    'image-text-to-text': 'multimodal',
    'text-to-image': 'text-to-image',
    'text-to-video': 'text-to-video'
  }
  return byTag[hf.pipeline_tag ?? ''] ?? 'text'
}

const toModel = (seed: Seed, hf: HfModel, asOf: string): Record<string, unknown> =>
  compact({
    id: seed.id,
    name: hf.id.split('/')[1] ?? seed.id,
    org: seed.org,
    family: seed.family,
    modality: modalityOf(hf),
    open_weights: true,
    hf_id: hf.id,
    license: licenseOf(hf),
    params: hf.safetensors?.total,
    active_params: seed.active_params,
    context: seed.context,
    release_date: hf.createdAt?.slice(0, 10),
    hf_downloads_30d: hf.downloads,
    hf_likes: hf.likes,
    gated: hf.gated !== false && hf.gated !== undefined ? true : undefined,
    source: { url: `https://huggingface.co/${hf.id}`, as_of: asOf, note: 'synced from HF Hub API' }
  })

const syncSeed = async (seed: Seed, asOf: string): Promise<boolean> => {
  let hf: HfModel
  try {
    hf = await fetchJson<HfModel>(`https://huggingface.co/api/models/${seed.hf_id}`)
  } catch (err) {
    warn(`${seed.hf_id}: ${err instanceof Error ? err.message : String(err)}`)
    return false
  }
  const path = join(DATA_DIR, 'models', seed.org, `${seed.id}.toml`)
  const existing = await readTomlIfExists(path)
  const model = preserveFields(toModel(seed, hf, asOf), existing, [
    'benchmarks', 'vram_gb', 'quants', 'knowledge_cutoff', 'modalities'
  ])
  const parsed = Model.safeParse(model)
  if (!parsed.success) {
    warn(`${seed.hf_id}: invalid — ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`)
    return false
  }
  await writeToml(path, model)
  return true
}

const main = async (): Promise<void> => {
  const asOf = today()
  const seeds = [...LLM_SEEDS, ...T2I_SEEDS]
  const results = await Promise.all(seeds.map((s) => syncSeed(s, asOf)))
  const ok = results.filter(Boolean).length
  info(`Synced ${ok}/${seeds.length} models from HF Hub`)
  if (ok === 0) process.exitCode = 1
}

await main()
