import type { Cache, CacheConfig, CacheDriver, TaggedCache } from './types'
import { FileDriver } from './drivers/file'
import { MemoryDriver } from './drivers/memory'
import { SqliteDriver } from './drivers/sqlite'

function createDriver(config: CacheConfig): CacheDriver {
  switch (config.driver) {
    case 'file':
      return new FileDriver(config.path ?? '.cache', config.defaultTTL)
    case 'sqlite':
      return new SqliteDriver(config.path ?? ':memory:', config.defaultTTL)
    case 'memory':
    default:
      return new MemoryDriver(config.maxSize ?? 1000, config.defaultTTL)
  }
}

class TaggedCacheImpl implements TaggedCache {
  private driver: CacheDriver
  private activeTags: string[]
  private tagKeys: Map<string, Set<string>>

  constructor(driver: CacheDriver, tags: string[], tagKeys: Map<string, Set<string>>) {
    this.driver = driver
    this.activeTags = tags
    this.tagKeys = tagKeys
  }

  async get<T>(key: string): Promise<T | null> {
    return this.driver.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.driver.set(key, value, ttl)

    for (const tag of this.activeTags) {
      if (!this.tagKeys.has(tag))
        this.tagKeys.set(tag, new Set())
      this.tagKeys.get(tag)!.add(key)
    }
  }

  async has(key: string): Promise<boolean> {
    return this.driver.has(key)
  }

  async delete(key: string): Promise<void> {
    await this.driver.delete(key)

    for (const [, keys] of this.tagKeys) {
      keys.delete(key)
    }
  }

  async flush(): Promise<void> {
    for (const tag of this.activeTags) {
      await this.flushTag(tag)
    }
  }

  async flushTag(tag: string): Promise<void> {
    const keys = this.tagKeys.get(tag)
    if (!keys)
      return

    for (const key of keys) {
      await this.driver.delete(key)
    }

    this.tagKeys.delete(tag)
  }
}

class CacheImpl implements Cache {
  private driver: CacheDriver
  private tagKeys = new Map<string, Set<string>>()

  constructor(driver: CacheDriver) {
    this.driver = driver
  }

  async get<T>(key: string): Promise<T | null> {
    return this.driver.get<T>(key)
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    return this.driver.set(key, value, ttl)
  }

  async has(key: string): Promise<boolean> {
    return this.driver.has(key)
  }

  async delete(key: string): Promise<void> {
    return this.driver.delete(key)
  }

  async flush(): Promise<void> {
    return this.driver.flush()
  }

  async remember<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null)
      return cached

    const value = await factory()
    await this.set(key, value, ttl)
    return value
  }

  tags(...tags: string[]): TaggedCache {
    return new TaggedCacheImpl(this.driver, tags, this.tagKeys)
  }
}

export function createCache(config?: Partial<CacheConfig>): Cache {
  const fullConfig: CacheConfig = {
    driver: config?.driver ?? 'memory',
    path: config?.path,
    maxSize: config?.maxSize ?? 1000,
    defaultTTL: config?.defaultTTL,
  }

  const driver = createDriver(fullConfig)
  return new CacheImpl(driver)
}
