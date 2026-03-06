import type { SearchConfig, SearchOptions, SearchResult } from './types'
import { SearchIndex } from './indexer'

let globalIndex: SearchIndex | null = null

function getGlobalIndex(): SearchIndex {
  if (!globalIndex) {
    globalIndex = new SearchIndex()
  }
  return globalIndex
}

export function configureSearch(config: SearchConfig): void {
  globalIndex = new SearchIndex(config)
}

export async function search(query: string, options?: SearchOptions & { collections?: string[] }): Promise<SearchResult[]> {
  const index = getGlobalIndex()
  const collections = options?.collections

  if (!collections || collections.length === 0) {
    return []
  }

  const { collections: _collections, ...searchOptions } = options ?? {}
  const allResults: SearchResult[] = []

  for (const collection of collections) {
    const results = await index.search(collection, query, searchOptions)
    allResults.push(...results)
  }

  // Sort combined results by score
  allResults.sort((a, b) => b.score - a.score)

  const limit = options?.limit ?? 20
  const offset = options?.offset ?? 0
  return allResults.slice(offset, offset + limit)
}

export { getGlobalIndex as _getGlobalIndex }
