import { expect, test } from 'bun:test'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { buildForProduction } from '../../src/production-builder'
import { startProductionServer } from '../../src/production-server'
import { createTempDir } from '../../src/temp-dir'

test('production static, hydrated and streamed fragments carry destination head metadata (#2121)', async () => {
  const root = createTempDir('stx-production-head-')
  let server: Awaited<ReturnType<typeof startProductionServer>> | undefined
  try {
    await Bun.write(path.join(root, 'pages/index.stx'), '<html><head><title>Static</title><meta name="description" content="Static &amp; &quot;quoted&quot;"><link rel="canonical" href="https://example.test/"></head><body><main>Static</main></body></html>')
    await Bun.write(path.join(root, 'pages/item/[id].stx'), `<script server>const title = 'Item ' + (params.id || 'build')</script>
<html><head><title>{{ title }}</title><meta name="description" content="{{ title }}"></head><body><main>{{ title }}</main></body></html>`)
    await Bun.write(path.join(root, 'pages/stream.stx'), `<script server>
const title = 'Stream'
const streamBoundaries = { chunk: async () => '<p>Loaded</p>' }
</script><html><head><title>{{ title }}</title><meta name="description" content="{{ title }}"></head><body><main><div data-suspense="chunk">Loading</div></main></body></html>`)
    const built = await buildForProduction({ root })
    expect(built.pageCount).toBe(3)
    server = await startProductionServer({ outputDir: built.outputDir, port: 0 })
    for (const [route, title] of [['/', 'Static'], ['/item/fresh', 'Item fresh'], ['/stream', 'Stream']]) {
      const response = await fetch(`http://localhost:${server.port}${route}`, { headers: { 'X-STX-Router': 'true' } })
      expect(response.status).toBe(200)
      expect(response.headers.get('X-STX-Fragment')).toBe('true')
      const html = await response.text()
      const metadata = html.match(/^<template data-stx-page-head="1">([\s\S]*?)<\/template>/)?.[1]
      expect(metadata).toBeDefined()
      expect(metadata).toContain(`<title>${title}</title>`)
      expect(metadata).toContain('name="description"')
      expect(metadata).not.toContain('__STX_PLACEHOLDER')
    }
  }
  finally {
    server?.stop()
    await rm(root, { recursive: true, force: true })
  }
}, 30_000)
