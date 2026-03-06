import { afterEach, describe, expect, test } from 'bun:test'
import { Collection } from '../src/collection'
import { getAllContent, getContent, queryContent, registerCollection, resetCollections } from '../src/content'
import type { ContentItem } from '../src/types'

function makeItem(overrides: Partial<ContentItem> = {}): ContentItem {
  return {
    slug: 'test-post',
    title: 'Test Post',
    date: new Date('2025-01-15T00:00:00.000Z'),
    data: { title: 'Test Post', tags: ['javascript'] },
    content: 'Test content',
    filePath: '/posts/test-post.md',
    collection: 'posts',
    excerpt: 'Test content',
    ...overrides,
  }
}

describe('content registry', () => {
  afterEach(() => {
    resetCollections()
  })

  test('registerCollection and getContent', async () => {
    const col = new Collection({ name: 'posts', directory: './posts' })
    col.addItem(makeItem({ slug: 'hello' }))
    registerCollection(col)

    const item = await getContent('posts', 'hello')
    expect(item).toBeDefined()
    expect(item!.slug).toBe('hello')
  })

  test('getContent returns undefined for unknown collection', async () => {
    const item = await getContent('unknown', 'slug')
    expect(item).toBeUndefined()
  })

  test('getContent returns undefined for unknown slug', async () => {
    const col = new Collection({ name: 'posts', directory: './posts' })
    col.addItem(makeItem({ slug: 'existing' }))
    registerCollection(col)

    const item = await getContent('posts', 'nonexistent')
    expect(item).toBeUndefined()
  })

  test('getAllContent returns all items', async () => {
    const col = new Collection({ name: 'posts', directory: './posts' })
    col.addItem(makeItem({ slug: 'a' }))
    col.addItem(makeItem({ slug: 'b' }))
    registerCollection(col)

    const items = await getAllContent('posts')
    expect(items).toHaveLength(2)
  })

  test('getAllContent returns empty for unknown collection', async () => {
    const items = await getAllContent('unknown')
    expect(items).toEqual([])
  })

  test('getAllContent with options', async () => {
    const col = new Collection({ name: 'posts', directory: './posts' })
    col.addItem(makeItem({ slug: 'a' }))
    col.addItem(makeItem({ slug: 'b' }))
    col.addItem(makeItem({ slug: 'c' }))
    registerCollection(col)

    const items = await getAllContent('posts', { limit: 2 })
    expect(items).toHaveLength(2)
  })

  test('queryContent with filter', async () => {
    const col = new Collection({ name: 'posts', directory: './posts' })
    col.addItem(makeItem({ slug: 'a', data: { category: 'tech', tags: [] } }))
    col.addItem(makeItem({ slug: 'b', data: { category: 'life', tags: [] } }))
    registerCollection(col)

    const items = await queryContent('posts', { filter: { category: 'tech' } })
    expect(items).toHaveLength(1)
    expect(items[0].slug).toBe('a')
  })

  test('queryContent returns empty for unknown collection', async () => {
    const items = await queryContent('unknown', { limit: 5 })
    expect(items).toEqual([])
  })

  test('resetCollections clears registry', async () => {
    const col = new Collection({ name: 'posts', directory: './posts' })
    col.addItem(makeItem())
    registerCollection(col)

    expect(await getAllContent('posts')).toHaveLength(1)

    resetCollections()

    expect(await getAllContent('posts')).toEqual([])
  })
})
