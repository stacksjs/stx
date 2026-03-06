import { describe, expect, test } from 'bun:test'
import { _getGlobalIndex, configureSearch, search } from '../src/search'
import { defineSearchable } from '../src/indexer'

describe('search', () => {
  test('returns empty for no collections', async () => {
    const results = await search('hello')
    expect(results).toEqual([])
  })

  test('searches across collections', async () => {
    configureSearch({ driver: 'memory' })
    const index = _getGlobalIndex()

    const postsDef = defineSearchable('posts', { fields: ['title', 'body'] })
    const pagesDef = defineSearchable('pages', { fields: ['title', 'content'] })
    index.register(postsDef)
    index.register(pagesDef)

    await index.addDocument('posts', '1', { title: 'TypeScript Guide', body: 'Learn TypeScript' })
    await index.addDocument('pages', '1', { title: 'TypeScript Page', content: 'TypeScript reference' })

    const results = await search('TypeScript', { collections: ['posts', 'pages'] })
    expect(results.length).toBe(2)
  })

  test('respects limit across collections', async () => {
    configureSearch({ driver: 'memory' })
    const index = _getGlobalIndex()

    index.register(defineSearchable('posts', { fields: ['title'] }))
    index.register(defineSearchable('pages', { fields: ['title'] }))

    for (let i = 0; i < 5; i++) {
      await index.addDocument('posts', `p${i}`, { title: `TypeScript Post ${i}` })
      await index.addDocument('pages', `pg${i}`, { title: `TypeScript Page ${i}` })
    }

    const results = await search('TypeScript', { collections: ['posts', 'pages'], limit: 3 })
    expect(results.length).toBe(3)
  })

  test('sorts combined results by score', async () => {
    configureSearch({ driver: 'memory' })
    const index = _getGlobalIndex()

    index.register(defineSearchable('posts', { fields: ['title'] }))

    await index.addDocument('posts', '1', { title: 'TypeScript TypeScript TypeScript' })
    await index.addDocument('posts', '2', { title: 'TypeScript basics' })

    const results = await search('TypeScript', { collections: ['posts'] })
    expect(results.length).toBe(2)
    expect(results[0].score).toBeGreaterThanOrEqual(results[1].score)
  })
})

describe('configureSearch', () => {
  test('resets global index', async () => {
    configureSearch({ driver: 'memory' })
    const index1 = _getGlobalIndex()

    configureSearch({ driver: 'memory' })
    const index2 = _getGlobalIndex()

    // Should be different instances
    expect(index1).not.toBe(index2)
  })
})
