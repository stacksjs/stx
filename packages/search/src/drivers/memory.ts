import type { SearchDriver, SearchOptions, SearchResult } from '../types'
import { tokenize } from '../tokenizer'

interface IndexedDocument {
  id: string
  document: Record<string, unknown>
  fields: string[]
  fieldTokens: Map<string, string[]>
}

export class MemorySearchDriver implements SearchDriver {
  name = 'memory'

  // collection → Map<docId, IndexedDocument>
  private documents: Map<string, Map<string, IndexedDocument>> = new Map()
  // collection → Map<token, Set<docId>>
  private invertedIndex: Map<string, Map<string, Set<string>>> = new Map()

  private getCollection(collection: string): Map<string, IndexedDocument> {
    if (!this.documents.has(collection)) {
      this.documents.set(collection, new Map())
    }
    return this.documents.get(collection)!
  }

  private getIndex(collection: string): Map<string, Set<string>> {
    if (!this.invertedIndex.has(collection)) {
      this.invertedIndex.set(collection, new Map())
    }
    return this.invertedIndex.get(collection)!
  }

  async index(collection: string, id: string, document: Record<string, unknown>, fields: string[]): Promise<void> {
    // Remove existing entry first
    await this.remove(collection, id)

    const docs = this.getCollection(collection)
    const index = this.getIndex(collection)
    const fieldTokens = new Map<string, string[]>()

    for (const field of fields) {
      const value = document[field]
      if (value == null)
        continue

      const text = String(value)
      const tokens = tokenize(text)
      fieldTokens.set(field, tokens)

      for (const token of tokens) {
        if (!index.has(token)) {
          index.set(token, new Set())
        }
        index.get(token)!.add(id)
      }
    }

    docs.set(id, { id, document, fields, fieldTokens })
  }

  async remove(collection: string, id: string): Promise<void> {
    const docs = this.getCollection(collection)
    const existing = docs.get(id)
    if (!existing)
      return

    const index = this.getIndex(collection)
    for (const tokens of existing.fieldTokens.values()) {
      for (const token of tokens) {
        const set = index.get(token)
        if (set) {
          set.delete(id)
          if (set.size === 0) {
            index.delete(token)
          }
        }
      }
    }

    docs.delete(id)
  }

  async search(collection: string, query: string, options?: SearchOptions): Promise<SearchResult[]> {
    const queryTokens = tokenize(query)
    if (queryTokens.length === 0)
      return []

    const docs = this.getCollection(collection)
    const index = this.getIndex(collection)
    const limit = options?.limit ?? 20
    const offset = options?.offset ?? 0
    const searchFields = options?.fields

    // Find candidate documents that contain ALL query tokens (AND logic)
    let candidateIds: Set<string> | null = null
    for (const token of queryTokens) {
      const matchingIds = index.get(token)
      if (!matchingIds || matchingIds.size === 0)
        return []

      if (candidateIds === null) {
        candidateIds = new Set(matchingIds)
      }
      else {
        for (const id of candidateIds) {
          if (!matchingIds.has(id)) {
            candidateIds.delete(id)
          }
        }
      }
    }

    if (!candidateIds || candidateIds.size === 0)
      return []

    // Apply filters
    if (options?.filter) {
      for (const id of [...candidateIds]) {
        const doc = docs.get(id)
        if (!doc)
          continue

        for (const [key, value] of Object.entries(options.filter)) {
          if (doc.document[key] !== value) {
            candidateIds.delete(id)
            break
          }
        }
      }
    }

    // Score documents
    const results: SearchResult[] = []
    const totalDocs = docs.size

    for (const id of candidateIds) {
      const doc = docs.get(id)
      if (!doc)
        continue

      let score = 0
      const highlights: Record<string, string[]> = {}

      for (const field of doc.fields) {
        if (searchFields && !searchFields.includes(field))
          continue

        const fieldTokensList = doc.fieldTokens.get(field)
        if (!fieldTokensList || fieldTokensList.length === 0)
          continue

        for (const queryToken of queryTokens) {
          const matchCount = fieldTokensList.filter(t => t === queryToken).length
          if (matchCount > 0) {
            // TF: token frequency in this field
            const tf = matchCount / fieldTokensList.length
            // IDF: inverse document frequency
            const docsWithToken = index.get(queryToken)?.size ?? 1
            const idf = Math.log(1 + totalDocs / docsWithToken)
            score += tf * idf

            // Generate highlights
            const fieldValue = String(doc.document[field] ?? '')
            if (fieldValue) {
              if (!highlights[field])
                highlights[field] = []

              const regex = new RegExp(`\\b\\S*${queryToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\S*\\b`, 'gi')
              const matches = fieldValue.match(regex)
              if (matches) {
                for (const m of matches) {
                  if (!highlights[field].includes(m)) {
                    highlights[field].push(m)
                  }
                }
              }
            }
          }
        }
      }

      if (score > 0) {
        results.push({
          item: doc.document,
          score,
          highlights,
        })
      }
    }

    // Sort by score descending, then apply custom sort if provided
    if (options?.sort) {
      const { field, order } = options.sort
      results.sort((a, b) => {
        const aVal = a.item[field]
        const bVal = b.item[field]
        if (aVal == null && bVal == null)
          return 0
        if (aVal == null)
          return 1
        if (bVal == null)
          return -1
        if (aVal < bVal)
          return order === 'asc' ? -1 : 1
        if (aVal > bVal)
          return order === 'asc' ? 1 : -1
        return 0
      })
    }
    else {
      results.sort((a, b) => b.score - a.score)
    }

    return results.slice(offset, offset + limit)
  }

  async clear(collection: string): Promise<void> {
    this.documents.delete(collection)
    this.invertedIndex.delete(collection)
  }

  async count(collection: string): Promise<number> {
    return this.getCollection(collection).size
  }
}
