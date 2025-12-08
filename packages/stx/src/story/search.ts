/**
 * STX Story - Search functionality
 * Full-text search across stories and components
 */

import type { AnalyzedComponent, StoryContext } from './types'

/**
 * Search result item
 */
export interface SearchResult {
  /** Result type */
  type: 'story' | 'component' | 'prop' | 'slot'
  /** Display title */
  title: string
  /** Description or context */
  description?: string
  /** Story file ID */
  storyId: string
  /** Variant ID (if applicable) */
  variantId?: string
  /** Match score (higher is better) */
  score: number
  /** Matched text */
  match: string
}

/**
 * Search index entry
 */
interface SearchIndexEntry {
  /** Searchable text (lowercase) */
  text: string
  /** Original text */
  original: string
  /** Entry type */
  type: SearchResult['type']
  /** Story file ID */
  storyId: string
  /** Variant ID */
  variantId?: string
  /** Additional metadata */
  meta?: Record<string, any>
}

/**
 * Search index
 */
let searchIndex: SearchIndexEntry[] = []

/**
 * Build search index from story files
 */
export function buildSearchIndex(ctx: StoryContext): void {
  searchIndex = []

  for (const file of ctx.storyFiles) {
    // Index story title
    searchIndex.push({
      text: file.fileName.toLowerCase(),
      original: file.fileName,
      type: 'story',
      storyId: file.id,
    })

    // Index story path
    searchIndex.push({
      text: file.relativePath.toLowerCase(),
      original: file.relativePath,
      type: 'story',
      storyId: file.id,
    })

    // Index variants
    if (file.story) {
      for (const variant of file.story.variants) {
        searchIndex.push({
          text: variant.title.toLowerCase(),
          original: variant.title,
          type: 'story',
          storyId: file.id,
          variantId: variant.id,
        })
      }
    }
  }
}

/**
 * Build search index from analyzed components
 */
export function buildComponentSearchIndex(components: AnalyzedComponent[]): void {
  for (const component of components) {
    const storyId = component.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    // Index component name
    searchIndex.push({
      text: component.name.toLowerCase(),
      original: component.name,
      type: 'component',
      storyId,
    })

    // Index description
    if (component.description) {
      searchIndex.push({
        text: component.description.toLowerCase(),
        original: component.description,
        type: 'component',
        storyId,
      })
    }

    // Index props
    for (const prop of component.props) {
      searchIndex.push({
        text: prop.name.toLowerCase(),
        original: prop.name,
        type: 'prop',
        storyId,
        meta: { propType: prop.type },
      })

      if (prop.description) {
        searchIndex.push({
          text: prop.description.toLowerCase(),
          original: prop.description,
          type: 'prop',
          storyId,
          meta: { propName: prop.name },
        })
      }
    }

    // Index slots
    for (const slot of component.slots) {
      searchIndex.push({
        text: slot.name.toLowerCase(),
        original: slot.name,
        type: 'slot',
        storyId,
      })
    }

    // Index tags
    if (component.tags) {
      for (const tag of component.tags) {
        searchIndex.push({
          text: tag.toLowerCase(),
          original: tag,
          type: 'component',
          storyId,
          meta: { tag: true },
        })
      }
    }
  }
}

/**
 * Search the index
 */
export function search(query: string, limit = 20): SearchResult[] {
  if (!query || query.length < 2) {
    return []
  }

  const queryLower = query.toLowerCase()
  const results: SearchResult[] = []
  const seen = new Set<string>()

  for (const entry of searchIndex) {
    // Check for match
    const matchIndex = entry.text.indexOf(queryLower)
    if (matchIndex === -1)
      continue

    // Calculate score
    let score = 100

    // Exact match bonus
    if (entry.text === queryLower) {
      score += 50
    }

    // Start of string bonus
    if (matchIndex === 0) {
      score += 30
    }

    // Word boundary bonus
    if (matchIndex === 0 || entry.text[matchIndex - 1] === ' ' || entry.text[matchIndex - 1] === '-') {
      score += 20
    }

    // Type bonuses
    if (entry.type === 'story')
      score += 10
    if (entry.type === 'component')
      score += 5

    // Shorter matches are better
    score -= entry.text.length * 0.5

    // Deduplicate by storyId + variantId
    const key = `${entry.storyId}-${entry.variantId || ''}-${entry.type}`
    if (seen.has(key))
      continue
    seen.add(key)

    results.push({
      type: entry.type,
      title: entry.original,
      storyId: entry.storyId,
      variantId: entry.variantId,
      score,
      match: highlightMatch(entry.original, query),
    })
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

/**
 * Highlight the matched portion of text
 */
function highlightMatch(text: string, query: string): string {
  const index = text.toLowerCase().indexOf(query.toLowerCase())
  if (index === -1)
    return text

  const before = text.slice(0, index)
  const match = text.slice(index, index + query.length)
  const after = text.slice(index + query.length)

  return `${before}<mark>${match}</mark>${after}`
}

/**
 * Get recent searches from localStorage (client-side)
 */
export function getRecentSearches(): string[] {
  // This would be implemented on the client side
  return []
}

/**
 * Clear the search index
 */
export function clearSearchIndex(): void {
  searchIndex = []
}

/**
 * Get search index size
 */
export function getSearchIndexSize(): number {
  return searchIndex.length
}

/**
 * Generate search index JSON for static builds
 */
export function exportSearchIndex(): string {
  return JSON.stringify(searchIndex)
}

/**
 * Import search index from JSON
 */
export function importSearchIndex(json: string): void {
  try {
    searchIndex = JSON.parse(json)
  }
  catch {
    searchIndex = []
  }
}
