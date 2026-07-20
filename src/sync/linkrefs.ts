import { basename } from 'node:path'
import { loadDataset } from '../lib/dataset.ts'
import { info, warn } from '../lib/log.ts'
import { readTomlIfExists, writeToml } from '../lib/toml-io.ts'

/** Strip provider path prefixes and non-alphanumerics: "accounts/fireworks/models/qwen3-8b" -> "qwen38b" */
const normalize = (id: string): string => {
  const tail = id.split('/').pop() ?? id
  // -turbo is intentionally NOT stripped: turbo variants are usually distinct distilled models
  return tail.toLowerCase().replace(/(-instruct|-chat|-it|-preview|-latest)+$/g, '').replace(/[^a-z0-9]/g, '')
}

const main = async (): Promise<void> => {
  const ds = await loadDataset()
  const byKey = new Map<string, string[]>()
  for (const [ref, model] of ds.models) {
    const keys = new Set([normalize(model.id), ...(model.hf_id ? [normalize(model.hf_id)] : [])])
    for (const key of keys) byKey.set(key, [...(byKey.get(key) ?? []), ref])
  }

  let linked = 0
  let ambiguous = 0
  for (const { file, offering } of ds.offerings) {
    if (offering.model_ref) continue
    const candidates = byKey.get(normalize(offering.model_id)) ?? []
    const unique = [...new Set(candidates)]
    if (unique.length === 0) continue
    if (unique.length > 1) {
      ambiguous += 1
      warn(`${basename(file)}: ambiguous match ${unique.join(', ')}`)
      continue
    }
    const ref = unique[0]
    const model = ds.models.get(ref ?? '')
    if (!ref || !model) continue
    const compatible =
      model.modality === offering.modality ||
      (model.modality === 'multimodal' && offering.modality === 'text')
    if (!compatible) continue
    const existing = await readTomlIfExists(file)
    if (!existing) continue
    await writeToml(file, { ...existing, model_ref: ref })
    linked += 1
  }
  info(`Linked ${linked} offerings to model entities (${ambiguous} ambiguous skipped)`)
}

await main()
