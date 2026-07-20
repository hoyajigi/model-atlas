import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parse, stringify } from 'smol-toml'

export const readToml = async (path: string): Promise<Record<string, unknown>> => {
  try {
    const raw = await readFile(path, 'utf8')
    return parse(raw)
  } catch (err) {
    throw new Error(`Failed to read TOML at ${path}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

export const writeToml = async (path: string, data: Record<string, unknown>): Promise<void> => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${stringify(data)}\n`, 'utf8')
}

/** Recursively list all .toml files under a directory. Returns [] if missing. */
export const listTomlFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) return listTomlFiles(path)
      return entry.name.endsWith('.toml') ? [path] : []
    })
  )
  return nested.flat().sort()
}
