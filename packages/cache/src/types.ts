export interface CacheConfig {
  driver: 'memory' | 'file' | 'sqlite'
  path?: string
  maxSize?: number
  defaultTTL?: number
}

export interface CacheDriver {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  has(key: string): Promise<boolean>
  delete(key: string): Promise<void>
  flush(): Promise<void>
}

export interface Cache extends CacheDriver {
  remember<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T>
  tags(...tags: string[]): TaggedCache
}

export interface TaggedCache extends CacheDriver {
  flushTag(tag: string): Promise<void>
}
