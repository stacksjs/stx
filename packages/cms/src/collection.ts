import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { extractExcerpt, parseFrontmatter } from './frontmatter'
import { fileNameToSlug } from './slug'
import type { CollectionDefinition, ContentItem, QueryOptions } from './types'

/**
 * Create a CollectionDefinition from a name and partial config.
 */
export function defineCollection(name: string, config: Omit<CollectionDefinition, 'name'>): CollectionDefinition {
  return {
    name,
    extensions: ['.md', '.stx'],
    slugField: 'filename',
    sortBy: 'date',
    sortOrder: 'desc',
    ...config,
  }
}

export class Collection {
  definition: CollectionDefinition
  items: ContentItem[]

  constructor(definition: CollectionDefinition) {
    this.definition = {
      extensions: ['.md', '.stx'],
      slugField: 'filename',
      sortBy: 'date',
      sortOrder: 'desc',
      ...definition,
    }
    this.items = []
  }

  /**
   * Scan the collection directory and parse all matching files.
   */
  async load(): Promise<void> {
    const dir = this.definition.directory
    const extensions = this.definition.extensions!

    let files: string[]
    try {
      const entries = await readdir(dir)
      files = entries.filter(f => extensions.some(ext => f.endsWith(ext)))
    }
    catch {
      return
    }

    this.items = []

    for (const file of files) {
      const filePath = join(dir, file)
      const raw = await readFile(filePath, 'utf-8')
      const { data, content } = parseFrontmatter(raw)

      const slug = this.definition.slugField === 'filename'
        ? fileNameToSlug(file)
        : String(data[this.definition.slugField!] || fileNameToSlug(file))

      const item: ContentItem = {
        slug,
        title: data.title as string | undefined,
        date: data.date instanceof Date ? data.date : undefined,
        data,
        content,
        filePath,
        collection: this.definition.name,
        excerpt: extractExcerpt(content),
      }

      if (this.definition.schema) {
        this.validateItem(item)
      }

      this.items.push(item)
    }

    this.sortItems()
  }

  /**
   * Manually add an item to the collection (useful for testing).
   */
  addItem(item: ContentItem): void {
    this.items.push(item)
  }

  /**
   * Get all items, optionally filtered/sorted/paginated.
   */
  getAll(options?: QueryOptions): ContentItem[] {
    return this.query(options || {})
  }

  /**
   * Get a single item by slug.
   */
  getBySlug(slug: string): ContentItem | undefined {
    return this.items.find(item => item.slug === slug)
  }

  /**
   * Query items with filtering, sorting, and pagination.
   */
  query(options: QueryOptions): ContentItem[] {
    let results = [...this.items]

    // Apply filter (exact match on data fields)
    if (options.filter) {
      for (const [key, value] of Object.entries(options.filter)) {
        results = results.filter((item) => {
          const itemValue = item.data[key]
          if (Array.isArray(itemValue)) {
            return itemValue.includes(value)
          }
          return itemValue === value
        })
      }
    }

    // Apply where predicate
    if (options.where) {
      results = results.filter(options.where)
    }

    // Apply sort
    if (options.sort) {
      const { field, order } = options.sort
      results.sort((a, b) => {
        const aVal = field === 'slug' ? a.slug : field === 'title' ? a.title : field === 'date' ? a.date : a.data[field]
        const bVal = field === 'slug' ? b.slug : field === 'title' ? b.title : field === 'date' ? b.date : b.data[field]
        if (aVal == null && bVal == null) return 0
        if (aVal == null) return 1
        if (bVal == null) return -1
        if (aVal < bVal) return order === 'asc' ? -1 : 1
        if (aVal > bVal) return order === 'asc' ? 1 : -1
        return 0
      })
    }

    // Apply offset
    if (options.offset) {
      results = results.slice(options.offset)
    }

    // Apply limit
    if (options.limit !== undefined) {
      results = results.slice(0, options.limit)
    }

    return results
  }

  /**
   * Return the total number of items.
   */
  count(): number {
    return this.items.length
  }

  /**
   * Check if an item with the given slug exists.
   */
  has(slug: string): boolean {
    return this.items.some(item => item.slug === slug)
  }

  /**
   * Get all unique tags across all items.
   */
  getTags(): string[] {
    const tags = new Set<string>()
    for (const item of this.items) {
      const itemTags = item.data.tags
      if (Array.isArray(itemTags)) {
        for (const tag of itemTags) {
          tags.add(String(tag))
        }
      }
    }
    return [...tags]
  }

  /**
   * Get all items that have the given tag.
   */
  getByTag(tag: string): ContentItem[] {
    return this.items.filter((item) => {
      const tags = item.data.tags
      return Array.isArray(tags) && tags.includes(tag)
    })
  }

  private sortItems(): void {
    const field = this.definition.sortBy || 'date'
    const order = this.definition.sortOrder || 'desc'

    this.items.sort((a, b) => {
      const aVal = field === 'slug' ? a.slug : field === 'title' ? a.title : field === 'date' ? a.date : a.data[field]
      const bVal = field === 'slug' ? b.slug : field === 'title' ? b.title : field === 'date' ? b.date : b.data[field]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  }

  private validateItem(item: ContentItem): void {
    const schema = this.definition.schema!
    for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
      const value = item.data[fieldName]

      // Apply default if missing
      if (value === undefined && fieldDef.default !== undefined) {
        item.data[fieldName] = fieldDef.default
      }

      // Check required
      if (fieldDef.required && item.data[fieldName] === undefined) {
        throw new Error(`Missing required field "${fieldName}" in ${item.filePath || item.slug}`)
      }
    }
  }
}

/**
 * Create a Collection instance from a definition.
 */
export function createCollection(definition: CollectionDefinition): Collection {
  return new Collection(definition)
}
