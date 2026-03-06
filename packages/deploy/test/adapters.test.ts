import { afterEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { bunServerAdapter } from '../src/adapters/bun-server'
import { staticAdapter } from '../src/adapters/static'
import { defineAdapter } from '../src/adapter'

const TEST_DIR = join(import.meta.dir, '.test-output')

describe('bunServerAdapter', () => {
  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test('creates adapter with name', () => {
    const adapter = bunServerAdapter()
    expect(adapter.name).toBe('bun-server')
  })

  test('generates server script on build', async () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, 'index.html'), '<h1>Hello</h1>')

    const adapter = bunServerAdapter({ port: 8080 })
    const result = await adapter.build({
      entry: 'index.html',
      outDir: TEST_DIR,
      production: true,
    })

    expect(result.outputDir).toBe(TEST_DIR)
    expect(result.entrypoint).toContain('server.ts')
    expect(existsSync(result.entrypoint!)).toBe(true)
  })
})

describe('staticAdapter', () => {
  afterEach(() => {
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true })
  })

  test('creates adapter with name', () => {
    const adapter = staticAdapter()
    expect(adapter.name).toBe('static')
  })

  test('collects files in output directory', async () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, 'index.html'), '<h1>Hello</h1>')
    writeFileSync(join(TEST_DIR, 'about.html'), '<h1>About</h1>')

    const adapter = staticAdapter()
    const result = await adapter.build({
      entry: 'index.html',
      outDir: TEST_DIR,
      production: true,
    })

    expect(result.files).toContain('index.html')
    expect(result.files).toContain('about.html')
  })

  test('generates _redirects for SPA fallback', async () => {
    mkdirSync(TEST_DIR, { recursive: true })
    writeFileSync(join(TEST_DIR, 'index.html'), '<h1>SPA</h1>')

    const adapter = staticAdapter({ fallback: '200.html' })
    await adapter.generateConfig!(TEST_DIR)

    expect(existsSync(join(TEST_DIR, '_redirects'))).toBe(true)
  })
})

describe('defineAdapter', () => {
  test('passes through adapter definition', () => {
    const adapter = defineAdapter({
      name: 'custom',
      async build(config) {
        return { outputDir: config.outDir, files: [] }
      },
    })
    expect(adapter.name).toBe('custom')
  })
})
