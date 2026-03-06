import type { CacheDriver } from '../types'
import { existsSync, mkdirSync, readdirSync, rmSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

interface FileEntry {
  value: unknown
  expiresAt: number | null
}

export class FileDriver implements CacheDriver {
  private dir: string
  private defaultTTL: number | undefined

  constructor(dir: string, defaultTTL?: number) {
    this.dir = dir
    this.defaultTTL = defaultTTL

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }
  }

  private keyToPath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_')
    return join(this.dir, `${safeKey}.json`)
  }

  async get<T>(key: string): Promise<T | null> {
    const path = this.keyToPath(key)
    const file = Bun.file(path)

    if (!await file.exists())
      return null

    try {
      const entry: FileEntry = await file.json()

      if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
        unlinkSync(path)
        return null
      }

      return entry.value as T
    }
    catch {
      return null
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const path = this.keyToPath(key)
    const effectiveTTL = ttl ?? this.defaultTTL

    const entry: FileEntry = {
      value,
      expiresAt: effectiveTTL ? Date.now() + effectiveTTL * 1000 : null,
    }

    await Bun.write(path, JSON.stringify(entry))
  }

  async has(key: string): Promise<boolean> {
    const result = await this.get(key)
    return result !== null
  }

  async delete(key: string): Promise<void> {
    const path = this.keyToPath(key)
    if (existsSync(path)) {
      unlinkSync(path)
    }
  }

  async flush(): Promise<void> {
    if (!existsSync(this.dir))
      return

    const files = readdirSync(this.dir)
    for (const file of files) {
      if (file.endsWith('.json')) {
        unlinkSync(join(this.dir, file))
      }
    }
  }
}
