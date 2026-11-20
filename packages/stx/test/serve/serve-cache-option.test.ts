/**
 * `cache: false` and the programmatic `serve()` page cache.
 *
 * `serve()` cached every rendered page under the page file's path and mtime
 * and never read the `cache` option, so `cache: false` in the stx options
 * (or the project's stx.config.ts) changed nothing: a page whose server script
 * computes something per request kept returning its first render, and a page
 * whose partial changed kept serving the old one until the page file itself
 * changed.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { serve } from '../../src/serve'

const DIR = path.join(import.meta.dir, 'fixtures-cache-option')
const PAGES = path.join(DIR, 'pages')
const PARTIALS = path.join(DIR, 'partials')

const servers: Array<Awaited<ReturnType<typeof serve>>> = []

async function start(stxOptions: Record<string, unknown> = {}, configDir = DIR): Promise<(page: string) => Promise<string>> {
  const server = await serve({ port: 0, root: PAGES, configDir, watch: false, stxOptions: { partialsDir: PARTIALS, ...stxOptions } })
  servers.push(server)
  const base = server.url.replace(/\/$/, '')
  return async (page: string) => {
    const response = await fetch(`${base}/${page}`)
    const html = await response.text()
    const main = html.match(/<main>([\s\S]*?)<\/main>/)?.[1]
    if (response.status !== 200 || main === undefined)
      throw new Error(`/${page} answered ${response.status}: ${html.slice(0, 200)}`)
    return main
  }
}

/** The page's render count, failing on anything that is not one. */
async function renders(get: (page: string) => Promise<string>): Promise<number> {
  const count = Number(await get('counter'))
  expect(Number.isInteger(count)).toBe(true)
  return count
}

beforeAll(async () => {
  await fs.promises.mkdir(PAGES, { recursive: true })
  await fs.promises.mkdir(PARTIALS, { recursive: true })
  await Bun.write(path.join(PARTIALS, 'note.stx'), '<p>v1</p>')
  await Bun.write(path.join(PAGES, 'with-partial.stx'), `<main>@include('note')</main>`)
  await Bun.write(path.join(PAGES, 'counter.stx'), `<script server>
const renders = globalThis.__stxServeCacheOptionRenders = (globalThis.__stxServeCacheOptionRenders ?? 0) + 1
</script>
<main>{{ renders }}</main>
`)
})

afterAll(async () => {
  for (const server of servers)
    server.stop()
  await fs.promises.rm(DIR, { recursive: true, force: true })
})

describe('serve() with cache: false', () => {
  it('renders every request', async () => {
    const get = await start({ cache: false })
    const first = await renders(get)
    expect(await renders(get)).toBe(first + 1)
  })

  it('serves a changed partial on the next request', async () => {
    const get = await start({ cache: false })
    expect(await get('with-partial')).toBe('<p>v1</p>')
    await Bun.write(path.join(PARTIALS, 'note.stx'), '<p>v2</p>')
    expect(await get('with-partial')).toBe('<p>v2</p>')
  })

  it('still caches by default', async () => {
    const get = await start()
    const first = await renders(get)
    expect(await renders(get)).toBe(first)
  })

  it('follows cache in a config that reloads', async () => {
    const configDir = path.join(DIR, 'reloading-config')
    const config = path.join(configDir, 'stx.config.ts')
    await fs.promises.mkdir(configDir, { recursive: true })
    await Bun.write(config, 'export default { extends: [], cache: false }\n')
    const get = await start({}, configDir)
    const first = await renders(get)
    expect(await renders(get)).toBe(first + 1)

    await Bun.write(config, 'export default { extends: [], cache: true }\n')
    const cached = await renders(get)
    expect(await renders(get)).toBe(cached)

    await Bun.write(config, 'export default { extends: [], cache: false }\n')
    const next = await renders(get)
    expect(await renders(get)).toBe(next + 1)
  })
})
