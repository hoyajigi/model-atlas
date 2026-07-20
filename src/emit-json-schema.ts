import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { Benchmark, HardwareEntry, Model, Offering, Provider } from './schema/index.ts'
import { info } from './lib/log.ts'

const SCHEMA_DIR = join(process.cwd(), 'schema')

const schemas = {
  model: Model,
  provider: Provider,
  offering: Offering,
  benchmark: Benchmark,
  hardware: HardwareEntry
} as const

const main = async (): Promise<void> => {
  await mkdir(SCHEMA_DIR, { recursive: true })
  for (const [name, schema] of Object.entries(schemas)) {
    const json = zodToJsonSchema(schema, { name })
    await writeFile(join(SCHEMA_DIR, `${name}.schema.json`), JSON.stringify(json, null, 2), 'utf8')
  }
  info(`Emitted ${Object.keys(schemas).length} JSON Schemas to schema/`)
}

await main()
