import { describe, expect, test } from 'bun:test'
import { MemorySearchDriver } from '../src/drivers/memory'

describe('MemorySearchDriver', () => {
  test('has correct name', () => {
    const driver = new MemorySearchDriver()
    expect(driver.name).toBe('memory')
  })

  test('indexes and searches documents', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Guide', body: 'Learn TypeScript basics' }, ['title', 'body'])
    await driver.index('posts', '2', { title: 'JavaScript Tutorial', body: 'Learn JavaScript fundamentals' }, ['title', 'body'])

    const results = await driver.search('posts', 'TypeScript')
    expect(results.length).toBe(1)
    expect(results[0].item.title).toBe('TypeScript Guide')
    expect(results[0].score).toBeGreaterThan(0)
  })

  test('returns empty array for no matches', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'Hello World' }, ['title'])

    const results = await driver.search('posts', 'nonexistent')
    expect(results).toEqual([])
  })

  test('returns empty array for empty query', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'Hello World' }, ['title'])

    const results = await driver.search('posts', '')
    expect(results).toEqual([])
  })

  test('removes documents', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Guide' }, ['title'])

    let count = await driver.count('posts')
    expect(count).toBe(1)

    await driver.remove('posts', '1')

    count = await driver.count('posts')
    expect(count).toBe(0)

    const results = await driver.search('posts', 'TypeScript')
    expect(results).toEqual([])
  })

  test('clears collection', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'Post One' }, ['title'])
    await driver.index('posts', '2', { title: 'Post Two' }, ['title'])

    await driver.clear('posts')

    const count = await driver.count('posts')
    expect(count).toBe(0)
  })

  test('counts documents', async () => {
    const driver = new MemorySearchDriver()
    expect(await driver.count('posts')).toBe(0)

    await driver.index('posts', '1', { title: 'One' }, ['title'])
    expect(await driver.count('posts')).toBe(1)

    await driver.index('posts', '2', { title: 'Two' }, ['title'])
    expect(await driver.count('posts')).toBe(2)
  })

  test('multi-word search uses AND logic', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Guide', body: 'Learn programming basics' }, ['title', 'body'])
    await driver.index('posts', '2', { title: 'TypeScript Advanced', body: 'Deep dive into types' }, ['title', 'body'])
    await driver.index('posts', '3', { title: 'JavaScript Guide', body: 'Learn JavaScript' }, ['title', 'body'])

    const results = await driver.search('posts', 'TypeScript guide')
    expect(results.length).toBe(1)
    expect(results[0].item.title).toBe('TypeScript Guide')
  })

  test('supports limit and offset', async () => {
    const driver = new MemorySearchDriver()
    for (let i = 0; i < 10; i++) {
      await driver.index('posts', String(i), { title: `TypeScript Post ${i}`, body: 'TypeScript content' }, ['title', 'body'])
    }

    const limited = await driver.search('posts', 'TypeScript', { limit: 3 })
    expect(limited.length).toBe(3)

    const offset = await driver.search('posts', 'TypeScript', { limit: 3, offset: 3 })
    expect(offset.length).toBe(3)

    // Check no overlap
    const limitedIds = limited.map(r => r.item.title)
    const offsetIds = offset.map(r => r.item.title)
    for (const id of limitedIds) {
      expect(offsetIds).not.toContain(id)
    }
  })

  test('supports field-specific search', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript', body: 'JavaScript content' }, ['title', 'body'])

    const titleOnly = await driver.search('posts', 'TypeScript', { fields: ['title'] })
    expect(titleOnly.length).toBe(1)

    const bodyOnly = await driver.search('posts', 'TypeScript', { fields: ['body'] })
    expect(bodyOnly.length).toBe(0)
  })

  test('supports exact match filters', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Guide', category: 'tutorial' }, ['title'])
    await driver.index('posts', '2', { title: 'TypeScript Advanced', category: 'advanced' }, ['title'])

    const results = await driver.search('posts', 'TypeScript', { filter: { category: 'tutorial' } })
    expect(results.length).toBe(1)
    expect(results[0].item.category).toBe('tutorial')
  })

  test('supports custom sorting', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Alpha', order: 2 }, ['title'])
    await driver.index('posts', '2', { title: 'TypeScript Beta', order: 1 }, ['title'])
    await driver.index('posts', '3', { title: 'TypeScript Charlie', order: 3 }, ['title'])

    const results = await driver.search('posts', 'TypeScript', { sort: { field: 'order', order: 'asc' } })
    expect(results.length).toBe(3)
    expect(results[0].item.order).toBe(1)
    expect(results[1].item.order).toBe(2)
    expect(results[2].item.order).toBe(3)
  })

  test('generates highlights', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Programming Guide' }, ['title'])

    const results = await driver.search('posts', 'TypeScript')
    expect(results.length).toBe(1)
    expect(results[0].highlights).toBeDefined()
    expect(results[0].highlights!.title).toBeDefined()
    expect(results[0].highlights!.title.length).toBeGreaterThan(0)
  })

  test('re-indexing a document updates it', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'Old Title' }, ['title'])
    await driver.index('posts', '1', { title: 'New Title' }, ['title'])

    const count = await driver.count('posts')
    expect(count).toBe(1)

    const oldResults = await driver.search('posts', 'Old')
    expect(oldResults.length).toBe(0)

    const newResults = await driver.search('posts', 'New')
    expect(newResults.length).toBe(1)
  })

  test('handles special characters in query', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'Hello World' }, ['title'])

    // Should not throw
    const results = await driver.search('posts', 'hello.*world')
    expect(results).toBeDefined()
  })

  test('collections are isolated', async () => {
    const driver = new MemorySearchDriver()
    await driver.index('posts', '1', { title: 'TypeScript Guide' }, ['title'])
    await driver.index('pages', '1', { title: 'JavaScript Page' }, ['title'])

    const postResults = await driver.search('posts', 'TypeScript')
    expect(postResults.length).toBe(1)

    const pageResults = await driver.search('pages', 'TypeScript')
    expect(pageResults.length).toBe(0)
  })

  test('remove non-existent document does not throw', async () => {
    const driver = new MemorySearchDriver()
    await driver.remove('posts', 'nonexistent')
    // Should not throw
  })
})
