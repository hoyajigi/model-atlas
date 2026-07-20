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

interface HfConfig {
  num_hidden_layers?: number
  hidden_size?: number
  num_attention_heads?: number
  num_key_value_heads?: number
  head_dim?: number
  vocab_size?: number
  max_position_embeddings?: number
  num_experts?: number
  n_routed_experts?: number
  num_local_experts?: number
  num_experts_per_tok?: number
  text_config?: HfConfig
}

/** config.json is public for most models (gated repos 401 -> null). */
const fetchConfig = async (hfId: string): Promise<HfConfig | null> => {
  try {
    return await fetchJson<HfConfig>(`https://huggingface.co/${hfId}/resolve/main/config.json`)
  } catch {
    return null
  }
}

/** Multimodal configs nest the LLM under text_config; prefer whichever level has layer counts. */
const textConfig = (config: HfConfig): HfConfig =>
  config.num_hidden_layers !== undefined || !config.text_config ? config : config.text_config

const toArchitecture = (config: HfConfig | null): Record<string, number> | undefined => {
  if (!config) return undefined
  const c = textConfig(config)
  const headDim = c.head_dim ?? (c.hidden_size && c.num_attention_heads ? c.hidden_size / c.num_attention_heads : undefined)
  const arch = {
    n_layers: c.num_hidden_layers,
    hidden_size: c.hidden_size,
    n_heads: c.num_attention_heads,
    n_kv_heads: c.num_key_value_heads,
    head_dim: headDim && Number.isInteger(headDim) ? headDim : undefined,
    vocab_size: c.vocab_size,
    moe_experts: c.num_experts ?? c.n_routed_experts ?? c.num_local_experts,
    moe_active_experts: c.num_experts_per_tok
  }
  const present = Object.fromEntries(Object.entries(arch).filter(([, v]) => v !== undefined)) as Record<string, number>
  return Object.keys(present).length > 0 ? present : undefined
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

const toModel = (seed: Seed, hf: HfModel, config: HfConfig | null, asOf: string): Record<string, unknown> =>
  compact({
    id: seed.id,
    name: hf.id.split('/')[1] ?? seed.id,
    org: seed.org,
    family: seed.family,
    modality: seed.modality ?? modalityOf(hf),
    open_weights: true,
    hf_id: hf.id,
    license: licenseOf(hf),
    params: hf.safetensors?.total,
    active_params: seed.active_params,
    context: seed.context ?? (config ? textConfig(config).max_position_embeddings : undefined),
    architecture: toArchitecture(config),
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
  const config = await fetchConfig(seed.hf_id)
  const path = join(DATA_DIR, 'models', seed.org, `${seed.id}.toml`)
  const existing = await readTomlIfExists(path)
  const model = preserveFields(toModel(seed, hf, config, asOf), existing, [
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
