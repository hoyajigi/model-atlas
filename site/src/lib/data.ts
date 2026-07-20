import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export interface AtlasModel {
  id: string
  name: string
  org: string
  family?: string
  modality: string
  open_weights: boolean
  hf_id?: string
  license?: string
  params?: number
  active_params?: number
  context?: number
  release_date?: string
  benchmarks?: Record<string, { score: number; source: string; as_of: string }>
  source: { url: string; as_of: string }
}

export interface AtlasOffering {
  model_id: string
  model_ref?: string
  name: string
  modality: string
  status: string
  context?: number
  max_output?: number
  pricing?: {
    input_per_mtok?: number
    output_per_mtok?: number
    cache_read_per_mtok?: number
    image?: { unit: string; usd: number; resolution?: string; usd_per_image_1024?: number }
  }
  source: { url: string; as_of: string }
}

export interface AtlasProvider {
  id: string
  name: string
  docs_url?: string
  pricing_url?: string
  models: Record<string, AtlasOffering>
}

export interface AtlasHardware {
  model_ref: string
  quant: string
  hardware: string
  backend?: string
  vram_gb?: number
  tok_per_s?: number
  sec_per_image?: number
  resolution?: string
  steps?: number
  measured_on?: string
}

export interface Atlas {
  models: Record<string, AtlasModel>
  providers: Record<string, AtlasProvider>
  benchmarks: Record<string, { id: string; name: string; category: string; url: string }>
  hardware: AtlasHardware[]
}

const apiPath = fileURLToPath(new URL('../../../dist/api.json', import.meta.url))

export const atlas: Atlas = JSON.parse(readFileSync(apiPath, 'utf8'))

export const fmtParams = (n?: number): string => {
  if (!n) return '—'
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  return `${(n / 1e6).toFixed(0)}M`
}

export const fmtContext = (n?: number): string => {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  return `${Math.round(n / 1024)}K`
}

export const fmtUsd = (n?: number): string => (n === undefined ? '—' : `$${n}`)

export const allOfferings = (): { provider: AtlasProvider; offering: AtlasOffering }[] =>
  Object.values(atlas.providers).flatMap((provider) =>
    Object.values(provider.models).map((offering) => ({ provider, offering }))
  )
