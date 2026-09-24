import { describe, expect, it } from 'bun:test'
import { useServerData, withServerData, serverDataTag } from '../src/server-data'
import { extractVariables } from '../src/variable-extractor'
import { processDirectives } from '../src/process'
import { extractContainerContent, stripDocumentWrapper } from '../src/app-shell'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderTemplate } from '../src/render'

describe('request-scoped server data', () => {
  it('deduplicates a key inside one request but isolates concurrent requests', async () => {
    const contexts = [{}, {}]
    let calls = 0
    const results = await Promise.all(contexts.map((context, user) => withServerData(context, async () => {
      const load = async () => { calls++; await Bun.sleep(user ? 1 : 10); return { user } }
      return Promise.all([useServerData('private', load), useServerData('private', load)])
    })))
    expect(calls).toBe(2)
    expect(results).toEqual([[{ user: 0 }, { user: 0 }], [{ user: 1 }, { user: 1 }]])
    expect(serverDataTag(contexts[0])).toContain('"user":0')
    expect(serverDataTag(contexts[0])).not.toContain('"user":1')
    expect(serverDataTag(contexts[1])).toContain('"user":1')
  })

  it('does not retain failed loads, and permits retry within the request', async () => {
    const context = {}
    await withServerData(context, async () => {
      await expect(useServerData('x', () => { throw new Error('private failure') })).rejects.toThrow('private failure')
      expect(serverDataTag(context)).toBe('')
      expect(await useServerData('x', () => null)).toBeNull()
    })
    expect(serverDataTag(context)).toContain('"x":null')
    expect(serverDataTag(context)).not.toContain('private failure')
    await expect(useServerData('x', () => 1)).rejects.toThrow('<script server>')
  })

  it('rejects non-JSON values and escapes HTML/script delimiters', async () => {
    const context = {}
    await withServerData(context, async () => {
      for (const value of [undefined, { x: undefined }, NaN, 1n, () => 0])
        await expect(useServerData('bad', () => value)).rejects.toThrow('JSON-serializable')
      await useServerData('__proto__', () => ({ value: '</script><script>bad()</script>\u2028' }))
    })
    const tag = serverDataTag(context)
    expect(tag.match(/<script/g)).toHaveLength(1)
    expect(tag.match(/<\/script>/g)).toHaveLength(1)
    const values = JSON.parse(tag.slice(tag.indexOf('>') + 1, tag.lastIndexOf('<')))
    expect(Object.hasOwn(values, '__proto__')).toBe(true)
    expect(values.__proto__.value).toBe('</script><script>bad()</script>\u2028')
  })

  it('binds imported and bare APIs to the same context across script extraction', async () => {
    const context: Record<string, unknown> = { calls: 0 }
    await extractVariables(`import { useServerData as load } from 'stx'
const first = await load('x', () => 42)`, context, '/tmp/server-data.stx')
    await extractVariables(`const second = await useServerData('x', () => 999)`, context, '/tmp/server-data.stx')
    expect(context.first).toBe(42)
    expect(context.second).toBe(42)
  })

  it('injects data before client readers and retains it in both fragment paths', async () => {
    const html = await processDirectives(`<!doctype html><html><head></head><body>
<script server>const answer = await useServerData('answer', () => 42)</script>
<script client>window.clientOnly = 'not executed server-side'</script>
<main>{{ answer }}</main></body></html>`, {}, '/tmp/server-data.stx', { cache: false, debug: false }, new Set())
    expect(html).toContain('<main>42</main>')
    expect(html.indexOf('data-stx-server-data')).toBeLessThan(html.indexOf('window.clientOnly'))
    expect(extractContainerContent(html)).toContain('"answer":42')
    expect(stripDocumentWrapper(html)).toContain('"answer":42')
    expect((globalThis as any).clientOnly).toBeUndefined()
  })

  it('shares one request across an explicit page/layout render and emits one final payload', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'stx-data-layout-'))
    try {
      await Bun.write(join(dir, 'page.stx'), `<script server>const result = await useServerData('shared', () => 'page')</script><main>{{ result }}</main>`)
      await Bun.write(join(dir, 'layout.stx'), `<script server>
const result = await useServerData('shared', () => 'layout')
const extra = await useServerData('extra', () => 2)
</script><html><head></head><body><header>{{ result }}</header>{!! content !!}</body></html>`)
      const html = await renderTemplate(join(dir, 'page.stx'), { layout: join(dir, 'layout.stx'), injectCSS: false })
      expect(html).toContain('<header>page</header>')
      expect(html.match(/<script\b[^>]*\sdata-stx-server-data(?=[\s=>])/g)).toHaveLength(1)
      expect(html).toContain('"extra":2')
      expect(html).toContain('"shared":"page"')
    }
    finally { rmSync(dir, { recursive: true, force: true }) }
  })
})
