import { info, warn } from '../lib/log.ts'
import { loadDataset } from '../lib/dataset.ts'
import { fetchJson } from './fetch.ts'

const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'

/** Our provider id -> LiteLLM's litellm_provider value */
const PROVIDER_MAP: Record<string, string> = {
  anthropic: 'anthropic',
  openai: 'openai',
  google: 'gemini',
  deepseek: 'deepseek',
  mistral: 'mistral',
  xai: 'xai',
  groq: 'groq',
  togetherai: 'together_ai',
  'fireworks-ai': 'fireworks_ai',
  moonshotai: 'moonshot',
  alibaba: 'dashscope'
}

interface LiteLlmEntry {
  litellm_provider?: string
  input_cost_per_token?: number
  output_cost_per_token?: number
}

type LiteLlmDb = Record<string, LiteLlmEntry>

const findEntry = (db: LiteLlmDb, provider: string, modelId: string): LiteLlmEntry | undefined => {
  const litellmProvider = PROVIDER_MAP[provider]
  if (!litellmProvider) return undefined
  const candidates = [modelId, `${litellmProvider}/${modelId}`]
  for (const key of candidates) {
    const entry = db[key]
    if (entry && entry.litellm_provider === litellmProvider) return entry
  }
  return undefined
}

const relDiff = (a: number, b: number): number => (b === 0 ? (a === 0 ? 0 : 1) : Math.abs(a - b) / b)

const main = async (): Promise<void> => {
  const [db, ds] = await Promise.all([fetchJson<LiteLlmDb>(LITELLM_URL), loadDataset()])
  let checked = 0
  let mismatches = 0
  for (const { provider, offering } of ds.offerings) {
    const pricing = offering.pricing
    if (!pricing?.input_per_mtok || !pricing?.output_per_mtok) continue
    const entry = findEntry(db, provider, offering.model_id)
    if (!entry?.input_cost_per_token || !entry?.output_cost_per_token) continue
    checked += 1
    const upstreamInput = entry.input_cost_per_token * 1e6
    const upstreamOutput = entry.output_cost_per_token * 1e6
    if (relDiff(pricing.input_per_mtok, upstreamInput) > 0.01 || relDiff(pricing.output_per_mtok, upstreamOutput) > 0.01) {
      mismatches += 1
      warn(
        `${provider}/${offering.model_id}: ours $${pricing.input_per_mtok}/$${pricing.output_per_mtok} ` +
          `vs litellm $${upstreamInput.toFixed(2)}/$${upstreamOutput.toFixed(2)} per Mtok`
      )
    }
  }
  info(`Cross-checked ${checked} offerings against LiteLLM: ${mismatches} pricing mismatch(es)`)
}

await main()
