/**
 * STX Story - Search Index Persistence
 * Cache search index to disk for faster startup
 */

import type { AnalyzedComponent, ServerStoryFile, StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Search index entry
 */
export interface SearchIndexEntry {
  /** Story ID */
  id: string
  /** Component name */
  name: string
  /** File path */
  path: string
  /** Searchable text (name, props, description) */
  searchText: string
  /** Props names */
  props: string[]
  /** Tags/categories */
  tags: string[]
  /** Last modified time */
  mtime: number
}

/**
 * Persisted search index
 */
export interface PersistedSearchIndex {
  /** Index version */
  version: number
  /** Creation timestamp */
  created: number
  /** Last update timestamp */
  updated: number
  /** Index entries */
  entries: SearchIndexEntry[]
}

const INDEX_VERSION = 1
const INDEX_FILE = '.stx/story/search-index.json'

/**
 * Get search index path
 */
function getIndexPath(root: string): string {
  return path.join(root, INDEX_FILE)
}

/**
 * Load search index from disk
 */
export async function loadSearchIndex(ctx: StoryContext): Promise<PersistedSearchIndex | null> {
  const indexPath = getIndexPath(ctx.root)

  try {
    const content = await fs.promises.readFile(indexPath, 'utf-8')
    const index = JSON.parse(content) as PersistedSearchIndex

    // Check version compatibility
    if (index.version !== INDEX_VERSION) {
      return null
    }

    return index
  }
  catch {
    return null
  }
}

/**
 * Save search index to disk
 */
export async function saveSearchIndex(
  ctx: StoryContext,
  entries: SearchIndexEntry[],
): Promise<void> {
  const indexPath = getIndexPath(ctx.root)
  const indexDir = path.dirname(indexPath)

  // Ensure directory exists
  await fs.promises.mkdir(indexDir, { recursive: true })

  const index: PersistedSearchIndex = {
    version: INDEX_VERSION,
    created: Date.now(),
    updated: Date.now(),
    entries,
  }

  await fs.promises.writeFile(indexPath, JSON.stringify(index, null, 2))
}

/**
 * Build persisted search index from story files
 */
export function buildPersistedSearchIndex(
  storyFiles: ServerStoryFile[],
  components: Map<string, AnalyzedComponent>,
): SearchIndexEntry[] {
  const entries: SearchIndexEntry[] = []

  for (const file of storyFiles) {
    const component = components.get(file.fileName)

    // Build searchable text
    const searchParts: string[] = [
      file.fileName.toLowerCase(),
      file.relativePath.toLowerCase(),
    ]

    const props: string[] = []
    const tags: string[] = []

    if (component) {
      // Add description
      if (component.description) {
        searchParts.push(component.description.toLowerCase())
      }

      // Add prop names
      for (const prop of component.props) {
        props.push(prop.name)
        searchParts.push(prop.name.toLowerCase())
        if (prop.description) {
          searchParts.push(prop.description.toLowerCase())
        }
      }

      // Add slot names as tags
      for (const slot of component.slots) {
        tags.push(`slot:${slot.name}`)
      }

      // Add directive usage as tags
      for (const directive of component.directives || []) {
        tags.push(`directive:${directive.name}`)
      }

      // Add dependencies as tags
      for (const dep of component.dependencies) {
        tags.push(`uses:${dep}`)
      }
    }

    entries.push({
      id: file.id,
      name: file.fileName,
      path: file.relativePath,
      searchText: searchParts.join(' '),
      props,
      tags,
      mtime: Date.now(), // Would need actual file mtime
    })
  }

  return entries
}

/**
 * Check if index is stale (any file modified since index was built)
 */
export async function isIndexStale(
  ctx: StoryContext,
  index: PersistedSearchIndex,
): Promise<boolean> {
  for (const entry of index.entries) {
    try {
      const fullPath = path.join(ctx.root, entry.path)
      const stat = await fs.promises.stat(fullPath)

      if (stat.mtimeMs > entry.mtime) {
        return true
      }
    }
    catch {
      // File doesn't exist anymore
      return true
    }
  }

  return false
}

/**
 * Search the index
 */
export function searchIndex(
  index: PersistedSearchIndex,
  query: string,
): SearchIndexEntry[] {
  const lowerQuery = query.toLowerCase()
  const terms = lowerQuery.split(/\s+/).filter(Boolean)

  if (terms.length === 0) {
    return index.entries
  }

  // Score entries
  const scored = index.entries.map((entry) => {
    let score = 0

    for (const term of terms) {
      // Exact name match (highest)
      if (entry.name.toLowerCase() === term) {
        score += 100
      }
      // Name starts with term
      else if (entry.name.toLowerCase().startsWith(term)) {
        score += 50
      }
      // Name contains term
      else if (entry.name.toLowerCase().includes(term)) {
        score += 25
      }
      // Prop name match
      else if (entry.props.some(p => p.toLowerCase().includes(term))) {
        score += 15
      }
      // Tag match
      else if (entry.tags.some(t => t.toLowerCase().includes(term))) {
        score += 10
      }
      // General text match
      else if (entry.searchText.includes(term)) {
        score += 5
      }
    }

    return { entry, score }
  })

  // Filter and sort by score
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.entry)
}

/**
 * Get or build search index
 */
export async function getOrBuildSearchIndex(
  ctx: StoryContext,
  storyFiles: ServerStoryFile[],
  components: Map<string, AnalyzedComponent>,
  forceRebuild = false,
): Promise<SearchIndexEntry[]> {
  if (!forceRebuild) {
    const cached = await loadSearchIndex(ctx)

    if (cached && !(await isIndexStale(ctx, cached))) {
      return cached.entries
    }
  }

  // Build new index
  const entries = buildPersistedSearchIndex(storyFiles, components)

  // Save to disk (don't await, do in background)
  saveSearchIndex(ctx, entries).catch(() => {
    // Ignore save errors
  })

  return entries
}
