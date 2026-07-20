import { error, info } from './lib/log.ts'
import { loadDataset } from './lib/dataset.ts'

const main = async (): Promise<void> => {
  const ds = await loadDataset()
  info(
    `Loaded ${ds.models.size} models, ${ds.providers.size} providers, ` +
      `${ds.offerings.length} offerings, ${ds.benchmarks.size} benchmarks, ${ds.hardware.length} hardware entries`
  )
  if (ds.errors.length > 0) {
    for (const e of ds.errors) error(e)
    error(`${ds.errors.length} validation error(s)`)
    process.exitCode = 1
    return
  }
  info('OK: all data valid')
}

await main()
