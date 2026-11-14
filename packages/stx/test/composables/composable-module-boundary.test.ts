import { requiresAsyncBody } from '../../src/module-syntax'
import { expect, test } from 'bun:test'
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { clearComposableCache, getComposableScript } from '../../src/composable-loader'
import { scanHtmlScriptElements } from '../../src/html-masking'
import { orderPageModules } from '../../src/page-module-order'
import { createTempDir } from '../../src/temp-dir'

test('static prose, URLs, comments and literal binding strings do not execute modules', async () => {
  const root = createTempDir('stx-composable-module-boundary-')
  try {
    await Bun.write(join(root, 'loader.ts'), 'export const support = { url: import.meta.url }')
    clearComposableCache()
    const page = `<html><head><link href="/support.css"></head><body><h1>hq.support</h1><!-- {{ support }} --><div title="support" class="support" :text="'support'"></div></body></html>`
    expect(await getComposableScript(root, page)).toBeNull()
    expect(await getComposableScript(root, '<button @click="support.open()">Open</button>')).toContain('import.meta')
  }
  finally { rmSync(root, { recursive: true, force: true }) }
})

test('module ordering is explicit and classic-only pages are unchanged', () => {
  const page = '<script data-stx-scoped>useCounter()</script>'
  expect(orderPageModules(page)).toBe(page)
  const transformed = orderPageModules('<script data-stx-modules>const url = import.meta.url</script><script data-stx-scoped>start()</script>')
  expect(transformed).toContain('type="module"')
  expect(transformed).toMatch(/await globalThis\.__stxModuleJobs\[[^\n]+\]\.previous/)
  expect(transformed).toContain('globalThis.__stxPageModulesReady||Promise.resolve()).then')
  expect(transformed).toContain('data-stx-module-bootstrap')
  expect(orderPageModules(transformed)).toBe(transformed)
})


test('explicit ESM exports and quoted script attributes retain their module syntax', () => {
  const output = orderPageModules('<script data-stx-scoped type="module" nonce="a&amp;b" data-note="x > y">export const value = await Promise.resolve(import.meta.url);</script>')
  const scripts = scanHtmlScriptElements(output)
  expect(scripts).toHaveLength(2)
  expect(scripts[1]!.attrs).toContain('nonce="a&amp;b"')
  expect(scripts[1]!.attrs).toContain('data-note="x > y"')
  const code = output.slice(scripts[1]!.bodyStart, scripts[1]!.bodyEnd)
  expect(new Bun.Transpiler({loader:'js'}).scan(code).exports).toEqual(['value'])
})


test('minified await calls remain operators only outside real function scopes', () => {
  expect(requiresAsyncBody('var value=await(Promise.resolve(1))')).toBe(true)
  expect(requiresAsyncBody('const value=`${await(Promise.resolve(1))}`')).toBe(true)
  expect(requiresAsyncBody('const run=async()=>await(Promise.resolve(1))')).toBe(false)
  expect(requiresAsyncBody('const object={await(){return 1}};object.await()')).toBe(false)
  expect(requiresAsyncBody('// await(Promise.resolve())\nconst literal="await(Promise.resolve())"')).toBe(false)
})
