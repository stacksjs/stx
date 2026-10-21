import { expect, test } from 'bun:test'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { renderTemplate } from '../src/render'

test('standalone native rendering registers page imports before its scoped client script', async () => {
  const root = mkdtempSync(join(tmpdir(), 'stx-native-imports-'))
  try {
    writeFileSync(join(root, 'boot.ts'), 'globalThis.__nativeBoots = (globalThis.__nativeBoots || 0) + 1; export const ready = true')
    writeFileSync(join(root, 'app.stx'), '<html><body><p>Native app</p><script client>import { ready } from "./boot"; globalThis.__nativeReady = ready</script></body></html>')
    const html = await renderTemplate(join(root, 'app.stx'))
    const scripts = [...html.matchAll(/<script\b([^>]*\bdata-stx-scoped\b[^>]*)>([\s\S]*?)<\/script>/g)]
    expect(scripts.some(script => script[1]!.includes('data-stx-modules'))).toBe(true)
    const page: Record<string, unknown> = {}
    for (const [, , code] of scripts) {
      // eslint-disable-next-line no-new-func
      new Function('globalThis', 'window', code!)(page, page)
    }
    expect(page.__nativeReady).toBe(true)
    expect(page.__nativeBoots).toBe(1)
    expect(html).not.toMatch(/<script[^>]*data-stx-modules[^>]*src=/)
  }
  finally { rmSync(root, { recursive: true, force: true }) }
})
