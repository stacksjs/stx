import type { SearchableDefinition, SearchConfig, SearchDriver, SearchOptions, SearchResult } from './types'
import { MemorySearchDriver } from './drivers/memory'

export function defineSearchable(name: string, definition: Omit<SearchableDefinition, 'name'>): SearchableDefinition {
  return { name, ...definition }
}

export class SearchIndex {
  driver: SearchDriver
  definitions: Map<string, SearchableDefinition> = new Map()

  constructor(config?: SearchConfig) {
    if (config?.driver === 'sqlite') {
      throw new Error('SQLite driver requires explicit initialization. Use SqliteSearchDriver directly.')
    }
    this.driver = new MemorySearchDriver()
  }

  register(definition: SearchableDefinition): void {
    this.definitions.set(definition.name, definition)
  }

  async addDocument(collection: string, id: string, document: Record<string, unknown>): Promise<void> {
    const definition = this.definitions.get(collection)
    const fields = definition?.fields ?? Object.keys(document)
    let doc = document

    if (definition?.transform) {
      doc = definition.transform(doc)
    }

    // Apply weights by repeating tokens in weighted fields
    // The driver handles actual indexing
    await this.driver.index(collection, id, doc, fields)
  }

  async addDocuments(collection: string, documents: Array<{ id: string } & Record<string, unknown>>): Promise<void> {
    for (const doc of documents) {
      const { id, ...rest } = doc
      await this.addDocument(collection, id, rest)
    }
  }

  async removeDocument(collection: string, id: string): Promise<void> {
    await this.driver.remove(collection, id)
  }

  async search(collection: string, query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const definition = this.definitions.get(collection)
    const results = await this.driver.search(collection, query, options)

    // Apply field weights to scores if defined
    if (definition?.weights) {
      for (const result of results) {
        let weightedScore = 0
        const highlights = result.highlights ?? {}

        for (const [field, matchedSnippets] of Object.entries(highlights)) {
          const weight = definition.weights[field] ?? 1
          if (matchedSnippets.length > 0) {
            weightedScore += result.score * weight
          }
        }

        // If we calculated weighted scores, use them; otherwise keep original
        if (weightedScore > 0) {
          result.score = weightedScore
        }
      }

      // Re-sort by weighted score
      results.sort((a, b) => b.score - a.score)
    }

    return results
  }

  async clear(collection: string): Promise<void> {
    await this.driver.clear(collection)
  }

  async count(collection: string): Promise<number> {
    return this.driver.count(collection)
  }
}

export function createSearchIndex(config?: SearchConfig): SearchIndex {
  return new SearchIndex(config)
}
