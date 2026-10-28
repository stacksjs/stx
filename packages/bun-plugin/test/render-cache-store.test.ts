import { afterAll, describe, expect, it } from 'bun:test'
import { readdir, rm, utimes } from 'node:fs/promises'
import path from 'node:path'
import { createTempDir } from '../../stx/src/temp-dir'
import { createRenderCacheStore, renderInputsFingerprint, restampBuildId } from '../src/render-cache-store'

/**
 * The render cache kept across restarts (stacksjs/stx#2133): an entry is used
 * only while what its signature does not cover is unchanged.
 */

const dirs: string[] = []
afterAll(async () => {
  await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
})

async function project() {
  const root = createTempDir('stx-render-store-')
  dirs.push(root)
  await Bun.write(path.join(root, 'functions/format.ts'), 'export const a = 1')
  await Bun.write(path.join(root, 'public/logo.png'), 'png')
  await Bun.write(path.join(root, 'bun.lock'), 'lock v1')
  const inputs = { roots: [path.join(root, 'functions'), path.join(root, 'public')], files: [path.join(root, 'bun.lock')], extra: { option: 'a' } }
  let buildId = 'build-1'
  const store = () => createRenderCacheStore({ dir: path.join(root, 'cache'), inputs: () => inputs, buildId: () => buildId })
  return { root, inputs, store, setBuildId: (id: string) => { buildId = id } }
}

const entry = {
  html: '<html><head>\n  <meta name="stx-build" content="build-1"><title>t</title></head><body>shell</body></html>',
  signature: new Map([['/views/index.stx', 123]]),
  status: 200,
  headers: { 'x-page': 'yes' },
}

// A later mtime, so the change is visible however coarse the filesystem clock.
async function touch(file: string, content: string): Promise<void> {
  await Bun.write(file, content)
  const later = new Date(Date.now() + 5_000)
  await utimes(file, later, later)
}

describe('render cache store', () => {
  it('gives a later process what an earlier one kept', async () => {
    const { store } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())

    const kept = await store().read('/views/index.stx')
    expect(kept?.html).toBe(entry.html)
    expect([...kept!.signature]).toEqual([...entry.signature])
    expect(kept?.status).toBe(200)
    expect(kept?.headers).toEqual({ 'x-page': 'yes' })
  })

  it('puts the reading process\'s build id in the page', async () => {
    const { store, setBuildId } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())

    setBuildId('build-2')
    const kept = await store().read('/views/index.stx')
    expect(kept?.html).toContain('<meta name="stx-build" content="build-2">')
    expect(kept?.html).not.toContain('build-1')
  })

  it('misses, and forgets the entry, once a watched file changed while nothing ran', async () => {
    const { root, store } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())

    await touch(path.join(root, 'functions/format.ts'), 'export const a = 2')
    expect(await store().read('/views/index.stx')).toBeUndefined()
    expect(await readdir(path.join(root, 'cache'))).toEqual([])
  })

  it('misses once a process-lifetime input changed: a lockfile, or a new file where there was none', async () => {
    const { root, inputs, store } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())
    await touch(path.join(root, 'bun.lock'), 'lock v2')
    expect(await store().read('/views/index.stx')).toBeUndefined()

    inputs.files.push(path.join(root, '.env.local'))
    const second = store()
    await second.write('/views/index.stx', entry, await second.begin())
    expect(await store().read('/views/index.stx')).toBeDefined()
    await Bun.write(path.join(root, '.env.local'), 'APP_NAME=Other')
    expect(await store().read('/views/index.stx')).toBeUndefined()
  })

  it('misses once the serve options differ', async () => {
    const { inputs, store } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())
    inputs.extra = { option: 'b' }
    expect(await store().read('/views/index.stx')).toBeUndefined()
  })

  it('ignores a change the watcher would ignore too', async () => {
    // An image under a watched root does not clear the in-memory cache, so it
    // must not throw away the kept one either.
    const { root, store } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())
    await touch(path.join(root, 'public/logo.png'), 'png v2')
    expect(await store().read('/views/index.stx')).toBeDefined()
  })

  it('keeps nothing rendered across a source change', async () => {
    const { store } = await project()
    const live = store()
    const ticket = await live.begin()
    live.invalidate()
    await live.write('/views/index.stx', entry, ticket)
    expect(await store().read('/views/index.stx')).toBeUndefined()
  })

  it('takes the fingerprint before the render, so a change during it can only cost a miss', async () => {
    // The render reads format.ts after the ticket was taken, and the edit
    // lands before the watcher reports it. The entry is written with the
    // older fingerprint, which no longer matches the files.
    const { root, store } = await project()
    const live = store()
    const ticket = await live.begin()
    await touch(path.join(root, 'functions/format.ts'), 'export const a = 3')
    await live.write('/views/index.stx', entry, ticket)
    expect(await store().read('/views/index.stx')).toBeUndefined()
  })

  it('answers only for the key it was written under', async () => {
    const { store } = await project()
    const first = store()
    await first.write('/views/index.stx', entry, await first.begin())
    expect(await store().read('/views/other.stx')).toBeUndefined()
  })
})

describe('render inputs fingerprint', () => {
  it('skips dependency and hidden directories under a root', async () => {
    const { root, inputs } = await project()
    const before = await renderInputsFingerprint(inputs)
    await Bun.write(path.join(root, 'functions/node_modules/x/index.js'), 'x')
    await Bun.write(path.join(root, 'functions/.cache/state.json'), '{}')
    expect(await renderInputsFingerprint(inputs)).toBe(before)
    await Bun.write(path.join(root, 'functions/extra.ts'), 'export {}')
    expect(await renderInputsFingerprint(inputs)).not.toBe(before)
  })

  it('counts a hidden file, which the watcher reacts to as well', async () => {
    // Stacks keeps the dashboard's discovered models in `.discovered-models.json`.
    const { root, inputs } = await project()
    const before = await renderInputsFingerprint(inputs)
    await Bun.write(path.join(root, 'functions/.discovered-models.json'), '{}')
    expect(await renderInputsFingerprint(inputs)).not.toBe(before)
  })

  it('counts the files of a root that itself sits under a hidden directory', async () => {
    const outer = createTempDir('stx-render-store-')
    dirs.push(outer)
    const root = path.join(outer, '.config', 'app', 'functions')
    await Bun.write(path.join(root, 'format.ts'), 'export const a = 1')
    const inputs = { roots: [root], files: [], extra: null }
    const before = await renderInputsFingerprint(inputs)
    await touch(path.join(root, 'format.ts'), 'export const a = 2')
    expect(await renderInputsFingerprint(inputs)).not.toBe(before)
  })
})

describe('restampBuildId', () => {
  it('replaces only the meta the rendering process wrote', () => {
    const html = '<head>\n  <meta name="stx-build" content="old"></head><body>old</body>'
    expect(restampBuildId(html, 'old', 'new')).toBe('<head>\n  <meta name="stx-build" content="new"></head><body>old</body>')
    expect(restampBuildId(html, 'other', 'new')).toBe(html)
  })
})
