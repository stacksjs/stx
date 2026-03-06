export interface SearchableDefinition {
  name: string
  fields: string[]
  weights?: Record<string, number>
  transform?: (doc: Record<string, unknown>) => Record<string, unknown>
}

export interface SearchResult<T = Record<string, unknown>> {
  item: T
  score: number
  highlights?: Record<string, string[]>
}

export interface SearchOptions {
  limit?: number
  offset?: number
  fields?: string[]
  filter?: Record<string, unknown>
  sort?: { field: string, order: 'asc' | 'desc' }
}

export interface SearchConfig {
  driver?: 'memory' | 'sqlite'
  stemming?: boolean
  minWordLength?: number
  stopWords?: string[]
}

export interface SearchDriver {
  name: string
  index(collection: string, id: string, document: Record<string, unknown>, fields: string[]): Promise<void>
  remove(collection: string, id: string): Promise<void>
  search(collection: string, query: string, options?: SearchOptions): Promise<SearchResult[]>
  clear(collection: string): Promise<void>
  count(collection: string): Promise<number>
}
