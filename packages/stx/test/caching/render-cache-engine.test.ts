/**
 * A cached render belongs to the stx that produced it.
 *
 * The render cache was checked against the template, its dependencies, the
 * options and a `cacheVersion` that never changes - never against stx itself -
 * so a render survived an upgrade. A stale `.stx/cache` in this repo had the
 * serving suite asserting against SEO output from two releases back while CI,
 * starting clean, passed.
 */
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cacheEngineFingerprint, cacheTemplate, checkCache } from '../../src/caching'

let dir: string
let template: string
let options: any

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'stx-render-cache-'))
  template = join(dir, 'page.stx')
  await writeFile(template, '<h1>{{ title }}</h1>')
  options = { cachePath: join(dir, 'cache'), cacheVersion: '1.0.0' }
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function metaFile(): Promise<string> {
  const { readdir } = await import('node:fs/promises')
  const name = (await readdir(options.cachePath)).find(file => file.endsWith('.meta.json'))!
  return join(options.cachePath, name)
}

describe('the render cache and the stx that filled it', () => {
  it('serves a render made by this stx', async () => {
    await cacheTemplate(template, '<h1>Hi</h1>', new Set(), options)

    expect(await checkCache(template, options)).toBe('<h1>Hi</h1>')
  })

  it('records which stx rendered it', async () => {
    await cacheTemplate(template, '<h1>Hi</h1>', new Set(), options)

    const meta = JSON.parse(await readFile(await metaFile(), 'utf8'))
    expect(meta.engine).toBe(cacheEngineFingerprint())
  })

  it('does not serve a render made by another stx', async () => {
    await cacheTemplate(template, '<h1>Hi</h1>', new Set(), options)
    const file = await metaFile()
    const meta = JSON.parse(await readFile(file, 'utf8'))
    await writeFile(file, JSON.stringify({ ...meta, engine: '0.2.300' }))

    expect(await checkCache(template, options)).toBeNull()
  })

  it('does not serve a render cached before stx recorded itself', async () => {
    // What every entry written by an earlier release looks like.
    await cacheTemplate(template, '<h1>Hi</h1>', new Set(), options)
    const file = await metaFile()
    const { engine: _engine, ...earlier } = JSON.parse(await readFile(file, 'utf8'))
    await writeFile(file, JSON.stringify(earlier))

    expect(await checkCache(template, options)).toBeNull()
  })

  it('names the version, and the source state when run from source', () => {
    const { version } = require('../../package.json')
    expect(cacheEngineFingerprint().startsWith(version)).toBe(true)
    expect(cacheEngineFingerprint()).toMatch(/\+src\.\d+$/)
  })
})
