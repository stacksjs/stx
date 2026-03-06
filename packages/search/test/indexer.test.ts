import { describe, expect, test } from 'bun:test'
import { SearchIndex, createSearchIndex, defineSearchable } from '../src/indexer'

describe('defineSearchable', () => {
  test('creates a searchable definition', () => {
    const def = defineSearchable('posts', {
      fields: ['title', 'body'],
      weights: { title: 2, body: 1 },
    })

    expect(def.name).toBe('posts')
    expect(def.fields).toEqual(['title', 'body'])
    expect(def.weights).toEqual({ title: 2, body: 1 })
  })

  test('handles definition without weights', () => {
    const def = defineSearchable('users', {
      fields: ['name', 'email'],
    })

    expect(def.name).toBe('users')
    expect(def.fields).toEqual(['name', 'email'])
    expect(def.weights).toBeUndefined()
  })

  test('handles transform function', () => {
    const transform = (doc: Record<string, unknown>) => ({
      ...doc,
      fullName: `${doc.first} ${doc.last}`,
    })

    const def = defineSearchable('users', {
      fields: ['fullName'],
      transform,
    })

    expect(def.transform).toBe(transform)
  })
})

describe('SearchIndex', () => {
  test('creates with default memory driver', () => {
    const index = new SearchIndex()
    expect(index.driver.name).toBe('memory')
  })

  test('registers searchable definitions', () => {
    const index = new SearchIndex()
    const def = defineSearchable('posts', { fields: ['title'] })
    index.register(def)
    expect(index.definitions.has('posts')).toBe(true)
  })

  test('adds and searches documents', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('posts', { fields: ['title', 'body'] }))

    await index.addDocument('posts', '1', { title: 'TypeScript Guide', body: 'Learn TypeScript' })
    await index.addDocument('posts', '2', { title: 'JavaScript Tutorial', body: 'Learn JavaScript' })

    const results = await index.search('posts', 'TypeScript')
    expect(results.length).toBe(1)
    expect(results[0].item.title).toBe('TypeScript Guide')
  })

  test('adds multiple documents at once', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('posts', { fields: ['title'] }))

    await index.addDocuments('posts', [
      { id: '1', title: 'First Post' },
      { id: '2', title: 'Second Post' },
      { id: '3', title: 'Third Post' },
    ])

    const count = await index.count('posts')
    expect(count).toBe(3)
  })

  test('removes documents', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('posts', { fields: ['title'] }))

    await index.addDocument('posts', '1', { title: 'TypeScript Guide' })
    await index.removeDocument('posts', '1')

    const results = await index.search('posts', 'TypeScript')
    expect(results.length).toBe(0)
  })

  test('clears collection', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('posts', { fields: ['title'] }))

    await index.addDocument('posts', '1', { title: 'One' })
    await index.addDocument('posts', '2', { title: 'Two' })

    await index.clear('posts')
    expect(await index.count('posts')).toBe(0)
  })

  test('applies transform function', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('users', {
      fields: ['fullName'],
      transform: doc => ({
        ...doc,
        fullName: `${doc.first} ${doc.last}`,
      }),
    }))

    await index.addDocument('users', '1', { first: 'John', last: 'Doe' })

    const results = await index.search('users', 'John')
    expect(results.length).toBe(1)
  })

  test('weighted fields score higher', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('posts', {
      fields: ['title', 'body'],
      weights: { title: 10, body: 1 },
    }))

    // Document with match in title (high weight)
    await index.addDocument('posts', '1', { title: 'TypeScript programming', body: 'Some random content' })
    // Document with match in body (low weight)
    await index.addDocument('posts', '2', { title: 'Random title here', body: 'TypeScript programming content' })

    const results = await index.search('posts', 'TypeScript')
    expect(results.length).toBe(2)
    // Title match should score higher
    expect(results[0].item.title).toBe('TypeScript programming')
  })

  test('works without registered definition', async () => {
    const index = new SearchIndex()

    // No definition registered, should use all document keys as fields
    await index.addDocument('posts', '1', { title: 'Hello World', body: 'Content here' })

    const results = await index.search('posts', 'Hello')
    expect(results.length).toBe(1)
  })

  test('counts documents in collection', async () => {
    const index = new SearchIndex()
    index.register(defineSearchable('posts', { fields: ['title'] }))

    expect(await index.count('posts')).toBe(0)

    await index.addDocument('posts', '1', { title: 'One' })
    expect(await index.count('posts')).toBe(1)
  })
})

describe('createSearchIndex', () => {
  test('creates a SearchIndex instance', () => {
    const index = createSearchIndex()
    expect(index).toBeInstanceOf(SearchIndex)
  })

  test('passes config to constructor', () => {
    const index = createSearchIndex({ driver: 'memory' })
    expect(index.driver.name).toBe('memory')
  })

  test('throws for sqlite driver', () => {
    expect(() => createSearchIndex({ driver: 'sqlite' })).toThrow()
  })
})
