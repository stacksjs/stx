import type { Collection } from './collection'
import type { ContentItem, QueryOptions } from './types'

const registry = new Map<string, Collection>()

/**
 * Register a collection in the global registry.
 */
export function registerCollection(collection: Collection): void {
  registry.set(collection.definition.name, collection)
}

/**
 * Get a single content item by collection name and slug.
 */
export async function getContent(collectionName: string, slug: string): Promise<ContentItem | undefined> {
  const collection = registry.get(collectionName)
  if (!collection) return undefined
  return collection.getBySlug(slug)
}

/**
 * Get all content items from a collection.
 */
export async function getAllContent(collectionName: string, options?: QueryOptions): Promise<ContentItem[]> {
  const collection = registry.get(collectionName)
  if (!collection) return []
  return collection.getAll(options)
}

/**
 * Query content items from a collection with filtering/sorting/pagination.
 */
export async function queryContent(collectionName: string, options: QueryOptions): Promise<ContentItem[]> {
  const collection = registry.get(collectionName)
  if (!collection) return []
  return collection.query(options)
}

/**
 * Clear all registered collections.
 */
export function resetCollections(): void {
  registry.clear()
}
