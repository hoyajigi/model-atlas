import { basename, dirname, join, relative, sep } from 'node:path'
import type { z } from 'zod'
import { Benchmark, HardwareEntry, Model, Offering, Provider } from '../schema/index.ts'
import type { BenchmarkT, HardwareEntryT, ModelT, OfferingT, ProviderT } from '../schema/index.ts'
import { listTomlFiles, readToml } from './toml-io.ts'

export const DATA_DIR = join(process.cwd(), 'data')

export interface LoadedOffering {
  provider: string
  file: string
  offering: OfferingT
}

export interface Dataset {
  models: Map<string, ModelT>
  providers: Map<string, ProviderT>
  offerings: LoadedOffering[]
  benchmarks: Map<string, BenchmarkT>
  hardware: HardwareEntryT[]
  errors: string[]
}

const parseWith = <S extends z.ZodTypeAny>(schema: S, data: Record<string, unknown>, file: string, errors: string[]): z.output<S> | null => {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  errors.push(`${file}: ${details}`)
  return null
}

const loadModels = async (errors: string[]): Promise<Map<string, ModelT>> => {
  const models = new Map<string, ModelT>()
  for (const file of await listTomlFiles(join(DATA_DIR, 'models'))) {
    const model = parseWith(Model, await readToml(file), file, errors)
    if (!model) continue
    const rel = relative(join(DATA_DIR, 'models'), file)
    const expected = `${model.org}${sep}${model.id}.toml`
    if (rel !== expected) errors.push(`${file}: path should be models/${model.org}/${model.id}.toml`)
    models.set(`${model.org}/${model.id}`, model)
  }
  return models
}

const loadProviders = async (errors: string[]): Promise<{ providers: Map<string, ProviderT>; offerings: LoadedOffering[] }> => {
  const providers = new Map<string, ProviderT>()
  const offerings: LoadedOffering[] = []
  for (const file of await listTomlFiles(join(DATA_DIR, 'providers'))) {
    const providerDir = basename(file) === 'provider.toml' ? basename(dirname(file)) : basename(dirname(dirname(file)))
    if (basename(file) === 'provider.toml') {
      const provider = parseWith(Provider, await readToml(file), file, errors)
      if (!provider) continue
      if (provider.id !== providerDir) errors.push(`${file}: provider id "${provider.id}" != directory "${providerDir}"`)
      providers.set(provider.id, provider)
      continue
    }
    const offering = parseWith(Offering, await readToml(file), file, errors)
    if (offering) offerings.push({ provider: providerDir, file, offering })
  }
  return { providers, offerings }
}

const loadBenchmarks = async (errors: string[]): Promise<Map<string, BenchmarkT>> => {
  const benchmarks = new Map<string, BenchmarkT>()
  for (const file of await listTomlFiles(join(DATA_DIR, 'benchmarks'))) {
    const bench = parseWith(Benchmark, await readToml(file), file, errors)
    if (bench) benchmarks.set(bench.id, bench)
  }
  return benchmarks
}

const loadHardware = async (errors: string[]): Promise<HardwareEntryT[]> => {
  const entries: HardwareEntryT[] = []
  for (const file of await listTomlFiles(join(DATA_DIR, 'hardware'))) {
    const entry = parseWith(HardwareEntry, await readToml(file), file, errors)
    if (entry) entries.push(entry)
  }
  return entries
}

const checkIntegrity = (ds: Dataset): void => {
  for (const { file, offering, provider } of ds.offerings) {
    if (offering.model_ref && !ds.models.has(offering.model_ref)) {
      ds.errors.push(`${file}: model_ref "${offering.model_ref}" not found in data/models/`)
    }
    if (!ds.providers.has(provider)) {
      ds.errors.push(`${file}: no provider.toml for provider directory "${provider}"`)
    }
  }
  for (const entry of ds.hardware) {
    if (!ds.models.has(entry.model_ref)) {
      ds.errors.push(`hardware entry for "${entry.model_ref}" (${entry.quant}/${entry.hardware}): model_ref not found`)
    }
  }
  for (const [key, model] of ds.models) {
    for (const suite of Object.keys(model.benchmarks ?? {})) {
      if (!ds.benchmarks.has(suite)) {
        ds.errors.push(`models/${key}: benchmark suite "${suite}" not defined in data/benchmarks/`)
      }
    }
  }
}

export const loadDataset = async (): Promise<Dataset> => {
  const errors: string[] = []
  const [models, providerData, benchmarks, hardware] = await Promise.all([
    loadModels(errors),
    loadProviders(errors),
    loadBenchmarks(errors),
    loadHardware(errors)
  ])
  const dataset: Dataset = { models, ...providerData, benchmarks, hardware, errors }
  checkIntegrity(dataset)
  return dataset
}
