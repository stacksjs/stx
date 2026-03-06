import { afterAll, afterEach, beforeAll, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { localDriver } from '../src/drivers/local'
import { MemoryDriver } from '../src/drivers/memory'
import { createStorage } from '../src/storage'

// ─── Memory Driver ──────────────────────────────────────────────────────────

describe('MemoryDriver', () => {
  let driver: MemoryDriver

  afterEach(() => {
    driver = new MemoryDriver()
  })

  // Re-init before each implicit use
  function mem(): MemoryDriver {
    if (!driver) driver = new MemoryDriver()
    return driver
  }

  test('has correct name', () => {
    expect(new MemoryDriver().name).toBe('memory')
  })

  test('put stores content and returns path', async () => {
    const d = new MemoryDriver()
    const result = await d.put('test.txt', 'hello world')
    expect(result).toBe('test.txt')
  })

  test('get retrieves stored content', async () => {
    const d = new MemoryDriver()
    await d.put('test.txt', 'hello world')
    const content = await d.get('test.txt')
    expect(content).not.toBeNull()
    expect(content!.toString()).toBe('hello world')
  })

  test('get returns null for nonexistent file', async () => {
    const d = new MemoryDriver()
    const content = await d.get('nonexistent.txt')
    expect(content).toBeNull()
  })

  test('put handles Buffer content', async () => {
    const d = new MemoryDriver()
    const buf = Buffer.from([0x00, 0x01, 0x02, 0xFF])
    await d.put('binary.bin', buf)
    const content = await d.get('binary.bin')
    expect(content).not.toBeNull()
    expect(content!.length).toBe(4)
    expect(content![0]).toBe(0x00)
    expect(content![3]).toBe(0xFF)
  })

  test('exists returns true for stored files', async () => {
    const d = new MemoryDriver()
    await d.put('exists.txt', 'data')
    expect(await d.exists('exists.txt')).toBe(true)
  })

  test('exists returns false for missing files', async () => {
    const d = new MemoryDriver()
    expect(await d.exists('missing.txt')).toBe(false)
  })

  test('delete removes a file', async () => {
    const d = new MemoryDriver()
    await d.put('to-delete.txt', 'data')
    const deleted = await d.delete('to-delete.txt')
    expect(deleted).toBe(true)
    expect(await d.exists('to-delete.txt')).toBe(false)
  })

  test('delete returns false for missing files', async () => {
    const d = new MemoryDriver()
    const deleted = await d.delete('missing.txt')
    expect(deleted).toBe(false)
  })

  test('list returns all files sorted by path', async () => {
    const d = new MemoryDriver()
    await d.put('c.txt', 'c')
    await d.put('a.txt', 'a')
    await d.put('b.txt', 'b')

    const files = await d.list()
    expect(files.length).toBe(3)
    expect(files[0].path).toBe('a.txt')
    expect(files[1].path).toBe('b.txt')
    expect(files[2].path).toBe('c.txt')
  })

  test('list filters by prefix', async () => {
    const d = new MemoryDriver()
    await d.put('images/a.png', 'a')
    await d.put('images/b.png', 'b')
    await d.put('docs/c.txt', 'c')

    const files = await d.list('images/')
    expect(files.length).toBe(2)
    expect(files[0].path).toBe('images/a.png')
  })

  test('list returns file metadata', async () => {
    const d = new MemoryDriver()
    await d.put('test.json', '{"key":"value"}')

    const files = await d.list()
    expect(files.length).toBe(1)
    expect(files[0].size).toBe(15)
    expect(files[0].lastModified).toBeInstanceOf(Date)
    expect(files[0].contentType).toBe('application/json')
  })

  test('url returns memory:// URL', () => {
    const d = new MemoryDriver()
    expect(d.url('test.txt')).toBe('memory://test.txt')
  })

  test('signedUrl returns URL with expiry', async () => {
    const d = new MemoryDriver()
    const url = await d.signedUrl('test.txt', 7200)
    expect(url).toContain('memory://test.txt')
    expect(url).toContain('expires=7200')
  })

  test('copy duplicates a file', async () => {
    const d = new MemoryDriver()
    await d.put('original.txt', 'content')

    const result = await d.copy('original.txt', 'copy.txt')
    expect(result).toBe('copy.txt')

    const original = await d.get('original.txt')
    const copy = await d.get('copy.txt')
    expect(original!.toString()).toBe('content')
    expect(copy!.toString()).toBe('content')
  })

  test('copy throws for nonexistent source', async () => {
    const d = new MemoryDriver()
    expect(d.copy('missing.txt', 'dest.txt')).rejects.toThrow('File not found: missing.txt')
  })

  test('move transfers a file', async () => {
    const d = new MemoryDriver()
    await d.put('source.txt', 'content')

    const result = await d.move('source.txt', 'dest.txt')
    expect(result).toBe('dest.txt')
    expect(await d.exists('source.txt')).toBe(false)
    expect((await d.get('dest.txt'))!.toString()).toBe('content')
  })

  test('clear removes all files', async () => {
    const d = new MemoryDriver()
    await d.put('a.txt', 'a')
    await d.put('b.txt', 'b')
    d.clear()
    expect((await d.list()).length).toBe(0)
  })

  test('content type detection', async () => {
    const d = new MemoryDriver()
    await d.put('image.png', 'data')
    await d.put('page.html', 'data')
    await d.put('style.css', 'data')
    await d.put('noext', 'data')

    const files = await d.list()
    const byPath = Object.fromEntries(files.map(f => [f.path, f.contentType]))
    expect(byPath['image.png']).toBe('image/png')
    expect(byPath['page.html']).toBe('text/html')
    expect(byPath['style.css']).toBe('text/css')
    expect(byPath['noext']).toBeUndefined()
  })
})

// ─── Local Driver ───────────────────────────────────────────────────────────

describe('LocalDriver', () => {
  const tempRoot = join(tmpdir(), `stx-storage-test-${Date.now()}`)

  beforeAll(() => {
    mkdirSync(tempRoot, { recursive: true })
  })

  afterAll(() => {
    if (existsSync(tempRoot)) {
      rmSync(tempRoot, { recursive: true, force: true })
    }
  })

  test('has correct name', () => {
    const d = localDriver({ root: tempRoot })
    expect(d.name).toBe('local')
  })

  test('put writes file and returns URL', async () => {
    const d = localDriver({ root: tempRoot, urlPrefix: '/files' })
    const url = await d.put('hello.txt', 'hello world')
    expect(url).toBe('/files/hello.txt')
    expect(existsSync(join(tempRoot, 'hello.txt'))).toBe(true)
  })

  test('put creates nested directories', async () => {
    const d = localDriver({ root: tempRoot })
    await d.put('nested/deep/file.txt', 'data')
    expect(existsSync(join(tempRoot, 'nested/deep/file.txt'))).toBe(true)
  })

  test('get retrieves file content', async () => {
    const d = localDriver({ root: tempRoot })
    await d.put('read-test.txt', 'read me')
    const content = await d.get('read-test.txt')
    expect(content).not.toBeNull()
    expect(content!.toString()).toBe('read me')
  })

  test('get returns null for missing file', async () => {
    const d = localDriver({ root: tempRoot })
    const content = await d.get('does-not-exist.txt')
    expect(content).toBeNull()
  })

  test('exists checks file existence', async () => {
    const d = localDriver({ root: tempRoot })
    await d.put('check-exists.txt', 'data')
    expect(await d.exists('check-exists.txt')).toBe(true)
    expect(await d.exists('nope.txt')).toBe(false)
  })

  test('delete removes a file', async () => {
    const d = localDriver({ root: tempRoot })
    await d.put('to-remove.txt', 'data')
    const deleted = await d.delete('to-remove.txt')
    expect(deleted).toBe(true)
    expect(existsSync(join(tempRoot, 'to-remove.txt'))).toBe(false)
  })

  test('delete returns false for missing file', async () => {
    const d = localDriver({ root: tempRoot })
    const deleted = await d.delete('already-gone.txt')
    expect(deleted).toBe(false)
  })

  test('list returns files sorted by path', async () => {
    const subDir = join(tempRoot, 'list-test')
    mkdirSync(subDir, { recursive: true })
    const d = localDriver({ root: subDir })

    await d.put('c.txt', 'c')
    await d.put('a.txt', 'a')
    await d.put('b.txt', 'b')

    const files = await d.list()
    expect(files.length).toBe(3)
    expect(files[0].path).toBe('a.txt')
    expect(files[1].path).toBe('b.txt')
    expect(files[2].path).toBe('c.txt')
  })

  test('list returns file metadata', async () => {
    const subDir = join(tempRoot, 'meta-test')
    mkdirSync(subDir, { recursive: true })
    const d = localDriver({ root: subDir })

    await d.put('data.json', '{"key":"val"}')
    const files = await d.list()
    expect(files.length).toBe(1)
    expect(files[0].size).toBe(13)
    expect(files[0].lastModified).toBeInstanceOf(Date)
    expect(files[0].contentType).toBe('application/json')
  })

  test('url returns prefixed path', () => {
    const d = localDriver({ root: tempRoot, urlPrefix: '/assets' })
    expect(d.url('image.png')).toBe('/assets/image.png')
  })

  test('url uses default /storage prefix', () => {
    const d = localDriver({ root: tempRoot })
    expect(d.url('file.txt')).toBe('/storage/file.txt')
  })

  test('copy duplicates a file', async () => {
    const subDir = join(tempRoot, 'copy-test')
    mkdirSync(subDir, { recursive: true })
    const d = localDriver({ root: subDir })

    await d.put('original.txt', 'copy me')
    await d.copy!('original.txt', 'copied.txt')

    expect(await d.exists('original.txt')).toBe(true)
    expect((await d.get('copied.txt'))!.toString()).toBe('copy me')
  })

  test('move transfers a file', async () => {
    const subDir = join(tempRoot, 'move-test')
    mkdirSync(subDir, { recursive: true })
    const d = localDriver({ root: subDir })

    await d.put('src.txt', 'move me')
    await d.move!('src.txt', 'dst.txt')

    expect(await d.exists('src.txt')).toBe(false)
    expect((await d.get('dst.txt'))!.toString()).toBe('move me')
  })
})

// ─── createStorage ──────────────────────────────────────────────────────────

describe('createStorage', () => {
  test('returns the driver as-is', () => {
    const memory = new MemoryDriver()
    const storage = createStorage(memory)
    expect(storage).toBe(memory)
    expect(storage.name).toBe('memory')
  })

  test('returned driver is fully functional', async () => {
    const storage = createStorage(new MemoryDriver())
    await storage.put('test.txt', 'works')
    const content = await storage.get('test.txt')
    expect(content!.toString()).toBe('works')
  })
})
