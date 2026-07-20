import { join } from 'node:path'
import { DATA_DIR } from '../lib/dataset.ts'
import { info, warn } from '../lib/log.ts'
import { readTomlIfExists, writeToml } from '../lib/toml-io.ts'
import { Offering, Provider } from '../schema/index.ts'
import { compact, fetchJson, fileSlug, today } from './fetch.ts'
import { preserveFields, preserveImagePricing } from './preserve.ts'

const API_URL = 'https://models.dev/api.json'

/** Providers we mirror from models.dev (MIT-licensed data). */
const PROVIDER_ALLOWLIST = [
  'anthropic', 'openai', 'google', 'deepseek', 'mistral', 'xai',
  'groq', 'togetherai', 'fireworks-ai', 'moonshotai', 'zai', 'alibaba'
]

interface UpstreamModel {
  id: string
  name: string
  family?: string
  status?: string
  attachment?: boolean
  reasoning?: boolean
  tool_call?: boolean
  structured_output?: boolean
  knowledge?: string
  release_date?: string
  modalities?: { input?: string[]; output?: string[] }
  limit?: { context?: number; output?: number }
  cost?: { input?: number; output?: number; cache_read?: number; cache_write?: number }
}

interface UpstreamProvider {
  id: string
  name: string
  doc?: string
  api?: string
  models: Record<string, UpstreamModel>
}

const toModality = (m: UpstreamModel): string => {
  const input = m.modalities?.input ?? ['text']
  const output = m.modalities?.output ?? ['text']
  if (output.includes('image')) return 'text-to-image'
  if (output.includes('video')) return 'text-to-video'
  if (output.includes('embedding')) return 'embedding'
  if (input.includes('audio') && !input.includes('text')) return 'audio'
  return 'text'
}

/** models.dev fills limits with 0 for image/audio models — treat as unknown. */
const positiveOrUndefined = (n?: number): number | undefined => (n && n > 0 ? n : undefined)

const toStatus = (status?: string): 'active' | 'deprecated' | 'retired' =>
  status === 'deprecated' || status === 'retired' ? status : 'active'

const toOffering = (m: UpstreamModel, asOf: string): Record<string, unknown> => {
  const hasCost = m.cost && (m.cost.input !== undefined || m.cost.output !== undefined)
  return compact({
    model_id: m.id,
    name: m.name,
    modality: toModality(m),
    status: toStatus(m.status),
    context: positiveOrUndefined(m.limit?.context),
    max_output: positiveOrUndefined(m.limit?.output),
    knowledge_cutoff: m.knowledge,
    release_date: m.release_date,
    pricing: hasCost
      ? {
          input_per_mtok: m.cost?.input,
          output_per_mtok: m.cost?.output,
          cache_read_per_mtok: m.cost?.cache_read,
          cache_write_per_mtok: m.cost?.cache_write
        }
      : undefined,
    capabilities: {
      tool_call: m.tool_call,
      reasoning: m.reasoning,
      structured_output: m.structured_output,
      vision: m.modalities?.input?.includes('image'),
      pdf_input: m.modalities?.input?.includes('pdf'),
      caching: m.cost?.cache_read !== undefined
    },
    source: { url: 'https://models.dev', as_of: asOf, note: 'synced from models.dev (MIT)' }
  })
}

const syncProvider = async (p: UpstreamProvider, asOf: string): Promise<number> => {
  const dir = join(DATA_DIR, 'providers', p.id)
  const provider = compact({
    id: p.id,
    name: p.name,
    api_base: p.api,
    docs_url: p.doc,
    source: { url: 'https://models.dev', as_of: asOf, note: 'synced from models.dev (MIT)' }
  })
  Provider.parse(provider)
  await writeToml(join(dir, 'provider.toml'), provider)

  let count = 0
  for (const m of Object.values(p.models)) {
    const path = join(dir, 'models', `${fileSlug(m.id)}.toml`)
    const existing = await readTomlIfExists(path)
    const generated = toOffering(m, asOf)
    const offering = preserveImagePricing(preserveFields(generated, existing, ['model_ref']), existing)
    const parsed = Offering.safeParse(offering)
    if (!parsed.success) {
      warn(`${p.id}/${m.id}: skipped — ${parsed.error.issues[0]?.message}`)
      continue
    }
    await writeToml(path, offering)
    count += 1
  }
  return count
}

const main = async (): Promise<void> => {
  const asOf = today()
  const upstream = await fetchJson<Record<string, UpstreamProvider>>(API_URL)
  for (const id of PROVIDER_ALLOWLIST) {
    const provider = upstream[id]
    if (!provider) {
      warn(`provider "${id}" not found in models.dev`)
      continue
    }
    const count = await syncProvider(provider, asOf)
    info(`${id}: ${count} offerings`)
  }
}

await main()
