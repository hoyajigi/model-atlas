import { appendFileSync } from 'node:fs'
import { loadDataset } from '../lib/dataset.ts'
import { info } from '../lib/log.ts'
import { fetchJson, sleep } from './fetch.ts'

/** Orgs whose new releases we want to catch quickly. */
const TRACKED_ORGS = [
  'Qwen', 'deepseek-ai', 'meta-llama', 'google', 'mistralai', 'openai',
  'zai-org', 'moonshotai', 'MiniMaxAI', 'microsoft', 'nvidia',
  'LGAI-EXAONE', 'kakaocorp', 'naver-hyperclovax',
  'black-forest-labs', 'stabilityai'
]

const RELEVANT_PIPELINES = new Set(['text-generation', 'text-to-image', 'image-text-to-text', 'text-to-video', 'image-to-image'])

/** Quant repacks, base checkpoints, and tooling repos are not new models. */
const NOISE = /(gguf|awq|gptq|fp8|nvfp4|int[48]|mlx|-base$|sae-|-hf$|lora|adapter)/i

interface HfListing {
  id: string
  createdAt: string
  likes?: number
  downloads?: number
  pipeline_tag?: string
}

interface Candidate {
  hf_id: string
  created: string
  pipeline: string
  likes: number
  downloads: number
}

/** Only look at recent releases by default; DISCOVER_ALL=1 scans the whole backlog. */
const WINDOW_DAYS = process.env.DISCOVER_ALL ? Infinity : 30
const MS_PER_DAY = 86_400_000

const isNotable = (m: HfListing, now: number): boolean =>
  RELEVANT_PIPELINES.has(m.pipeline_tag ?? '') &&
  !NOISE.test(m.id) &&
  ((m.likes ?? 0) >= 30 || (m.downloads ?? 0) >= 10_000) &&
  (now - Date.parse(m.createdAt)) / MS_PER_DAY <= WINDOW_DAYS

const main = async (): Promise<void> => {
  const ds = await loadDataset()
  const known = new Set([...ds.models.values()].map((m) => m.hf_id?.toLowerCase()).filter(Boolean))

  const now = Date.now()
  const candidates: Candidate[] = []
  for (const org of TRACKED_ORGS) {
    const listings = await fetchJson<HfListing[]>(
      `https://huggingface.co/api/models?author=${org}&sort=createdAt&direction=-1&limit=20`
    )
    for (const m of listings) {
      if (known.has(m.id.toLowerCase()) || !isNotable(m, now)) continue
      candidates.push({
        hf_id: m.id,
        created: m.createdAt.slice(0, 10),
        pipeline: m.pipeline_tag ?? '',
        likes: m.likes ?? 0,
        downloads: m.downloads ?? 0
      })
    }
    await sleep(300)
  }

  candidates.sort((a, b) => b.created.localeCompare(a.created))
  for (const c of candidates) {
    info(`${c.created}  ${c.hf_id}  [${c.pipeline}]  likes=${c.likes} dl=${c.downloads}`)
  }
  info(`${candidates.length} candidate(s) not yet in the dataset`)

  const githubOutput = process.env.GITHUB_OUTPUT
  if (githubOutput) {
    appendFileSync(githubOutput, `found=${candidates.length > 0}\ncount=${candidates.length}\n`)
  }
}

await main()
