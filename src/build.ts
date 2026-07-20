import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { rmSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { info } from './lib/log.ts'
import { loadDataset, type Dataset } from './lib/dataset.ts'

const DIST = join(process.cwd(), 'dist')

const toApiJson = (ds: Dataset): Record<string, unknown> => ({
  $schema: 'https://github.com/model-atlas/model-atlas',
  version: 1,
  models: Object.fromEntries(ds.models),
  providers: Object.fromEntries(
    [...ds.providers].map(([id, provider]) => [
      id,
      {
        ...provider,
        models: Object.fromEntries(
          ds.offerings.filter((o) => o.provider === id).map((o) => [o.offering.model_id, o.offering])
        )
      }
    ])
  ),
  benchmarks: Object.fromEntries(ds.benchmarks),
  hardware: ds.hardware
})

const buildSqlite = (ds: Dataset, path: string): void => {
  rmSync(path, { force: true })
  const db = new DatabaseSync(path)
  db.exec(`
    CREATE TABLE models (ref TEXT PRIMARY KEY, org TEXT, id TEXT, name TEXT, modality TEXT,
      open_weights INTEGER, params INTEGER, license TEXT, json TEXT);
    CREATE TABLE providers (id TEXT PRIMARY KEY, name TEXT, json TEXT);
    CREATE TABLE offerings (provider TEXT, model_id TEXT, model_ref TEXT, modality TEXT, status TEXT,
      input_per_mtok REAL, output_per_mtok REAL, json TEXT, PRIMARY KEY (provider, model_id));
    CREATE TABLE hardware (model_ref TEXT, quant TEXT, hardware TEXT, engine TEXT, gpus INTEGER,
      concurrency INTEGER, vram_gb REAL, tok_per_s REAL, sec_per_image REAL, json TEXT);
  `)
  const insertModel = db.prepare('INSERT INTO models VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const [ref, m] of ds.models) {
    insertModel.run(ref, m.org, m.id, m.name, m.modality, m.open_weights ? 1 : 0, m.params ?? null, m.license ?? null, JSON.stringify(m))
  }
  const insertProvider = db.prepare('INSERT INTO providers VALUES (?, ?, ?)')
  for (const [id, p] of ds.providers) insertProvider.run(id, p.name, JSON.stringify(p))
  const insertOffering = db.prepare('INSERT INTO offerings VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  for (const { provider, offering: o } of ds.offerings) {
    insertOffering.run(provider, o.model_id, o.model_ref ?? null, o.modality, o.status,
      o.pricing?.input_per_mtok ?? null, o.pricing?.output_per_mtok ?? null, JSON.stringify(o))
  }
  const insertHw = db.prepare('INSERT INTO hardware VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
  for (const h of ds.hardware) {
    insertHw.run(h.model_ref, h.quant, h.hardware, h.engine, h.gpus, h.concurrency,
      h.vram_gb ?? null, h.tok_per_s ?? null, h.sec_per_image ?? null, JSON.stringify(h))
  }
  db.close()
}

const main = async (): Promise<void> => {
  const ds = await loadDataset()
  if (ds.errors.length > 0) {
    throw new Error(`Dataset invalid (${ds.errors.length} errors) — run \`npm run validate\` first`)
  }
  await mkdir(DIST, { recursive: true })
  await writeFile(join(DIST, 'api.json'), JSON.stringify(toApiJson(ds), null, 2), 'utf8')
  buildSqlite(ds, join(DIST, 'atlas.sqlite'))
  info(`Built dist/api.json and dist/atlas.sqlite (${ds.models.size} models, ${ds.offerings.length} offerings)`)
}

await main()
