import { join } from 'node:path'
import { DATA_DIR, loadDataset } from '../lib/dataset.ts'
import { info, warn } from '../lib/log.ts'
import { readTomlIfExists, writeToml } from '../lib/toml-io.ts'
import { fetchJson, sleep } from './fetch.ts'

const DATASET = 'lmarena-ai/leaderboard-dataset'
const DATASET_URL = `https://huggingface.co/datasets/${DATASET}`
const ROWS_API = `https://datasets-server.huggingface.co/rows?dataset=${encodeURIComponent(DATASET)}`

interface ArenaRow {
  model_name: string
  rating: number
  category: string
  leaderboard_publish_date: string
}

interface RowsResponse {
  num_rows_total: number
  rows: { row: ArenaRow }[]
}

/** "FLUX.1-dev (fp16) [web-search]" -> "flux1dev" for fuzzy matching */
const normalize = (name: string): string =>
  name
    .toLowerCase()
    .replace(/\s*[([].*?[)\]]\s*/g, '')
    .replace(/[^a-z0-9]/g, '')

const fetchLeaderboard = async (config: string): Promise<Map<string, ArenaRow>> => {
  const ratings = new Map<string, ArenaRow>()
  const pageSize = 100
  let offset = 0
  let total = Infinity
  while (offset < total) {
    const page = await fetchJson<RowsResponse>(`${ROWS_API}&config=${config}&split=latest&offset=${offset}&length=${pageSize}`)
    total = page.num_rows_total
    for (const { row } of page.rows) {
      if (row.category !== 'overall') continue
      const key = normalize(row.model_name)
      const seen = ratings.get(key)
      if (!seen || row.rating > seen.rating) ratings.set(key, row)
    }
    offset += pageSize
    await sleep(500)
  }
  return ratings
}

const SUITE_BY_MODALITY: Record<string, { suite: string; config: string }> = {
  text: { suite: 'lmarena-text', config: 'text' },
  multimodal: { suite: 'lmarena-text', config: 'text' },
  'text-to-image': { suite: 'lmarena-t2i', config: 'text_to_image' }
}

const main = async (): Promise<void> => {
  const ds = await loadDataset()
  const leaderboards = new Map<string, Map<string, ArenaRow>>()
  for (const { config } of Object.values(SUITE_BY_MODALITY)) {
    if (!leaderboards.has(config)) leaderboards.set(config, await fetchLeaderboard(config))
  }

  let matched = 0
  for (const [ref, model] of ds.models) {
    const target = SUITE_BY_MODALITY[model.modality]
    if (!target) continue
    const row = leaderboards.get(target.config)?.get(normalize(model.id)) ?? leaderboards.get(target.config)?.get(normalize(model.name))
    if (!row) continue
    const path = join(DATA_DIR, 'models', `${ref}.toml`)
    const existing = await readTomlIfExists(path)
    if (!existing) {
      warn(`${ref}: TOML not found for benchmark update`)
      continue
    }
    const benchmarks = {
      ...(existing.benchmarks as Record<string, unknown> | undefined),
      [target.suite]: {
        score: Math.round(row.rating * 10) / 10,
        source: DATASET_URL,
        as_of: row.leaderboard_publish_date
      }
    }
    await writeToml(path, { ...existing, benchmarks })
    matched += 1
  }
  info(`LMArena: updated ${matched}/${ds.models.size} models with Elo ratings`)
}

await main()
