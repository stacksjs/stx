import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import { clearComposableCache, getComposableScript } from '../../src/composable-loader'
import { processDirectives } from '../../src/process'

// Regression: stacksjs/stx#1780
//
// `import { useThing } from '@composables'` was already rewritten by
// store-imports.ts into `const { useThing } = window.__composables` — a plain
// destructure in the page's own scope, exactly where template directives can
// see it. But NOTHING populated window.__composables: there was no
// composablesDir, no loader, no auto-discovery. The destructure therefore
// unpacked `undefined`, and every binding referencing a composable silently did
// nothing — @click never fired, @show never flipped, with no console error, no
// build warning and no runtime exception.
//
// The practical consequence was that client logic could not be shared between
// pages at all, so the same block got copy-pasted from page to page (and two
// pages in the reporter's dashboard ended up shipping delete buttons with no
// confirmation, because there was no single place to get it right).
//
// composable-loader.ts now discovers the directory and emits a
// <script data-stx-composables> bundle that fills window.__composables.
describe('stx#1780: composables directory populates window.__composables', () => {
  let dir: string

  beforeAll(async () => {
    dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-composables-'))
    await Bun.write(
      path.join(dir, 'use-op-confirm.ts'),
      `import { state } from 'stx'\n`
      + `export function useOpConfirm(opts: { endpoint: string }) {\n`
      + `  const pending = state<string | null>(null)\n`
      + `  function askOp(op: string) { pending.set(op) }\n`
      + `  return { pending, askOp, endpoint: opts.endpoint }\n`
      + `}\n`
      + `export const CONFIRM_WORD = 'DELETE'\n`,
    )
    // Must be ignored by discovery.
    await Bun.write(path.join(dir, 'index.ts'), `export * from './use-op-confirm'\n`)
    await Bun.write(path.join(dir, 'types.ts'), `export interface Nope { a: string }\n`)
    clearComposableCache()
  })

  afterAll(async () => {
    clearComposableCache()
    await fs.promises.rm(dir, { recursive: true, force: true })
  })

  it('emits a bundle that registers every exported binding', async () => {
    const code = await getComposableScript(dir)
    expect(code).not.toBeNull()

    // The bundle must run standalone and populate the global.
    const win: any = {}
    // eslint-disable-next-line no-new-func
    expect(() => new Function('window', code!)(win)).not.toThrow()
    expect(Object.keys(win.__composables).sort()).toEqual(['CONFIRM_WORD', 'useOpConfirm'])
    expect(typeof win.__composables.useOpConfirm).toBe('function')
  })

  it('strips TypeScript annotations so the bundle is valid browser JS', async () => {
    const code = await getComposableScript(dir)
    // A leaked annotation (`opts: { endpoint: string }`) would be a syntax error
    // in the browser — the transpiler must have removed it.
    expect(code).not.toContain(': string')
    expect(code).not.toContain('interface ')
  })

  it('skips index.ts and types.ts', async () => {
    const code = await getComposableScript(dir)
    expect(code).not.toContain('Composable: index')
    expect(code).not.toContain('Composable: types')
  })

  it('returns null for a directory with no composables', async () => {
    const empty = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'stx-empty-'))
    try {
      expect(await getComposableScript(empty)).toBeNull()
    }
    finally {
      await fs.promises.rm(empty, { recursive: true, force: true })
    }
  })

  it('renders a page whose @composables import reaches the template scope', async () => {
    const page = `<script client>\n`
      + `import { useOpConfirm } from '@composables'\n`
      + `const { pending, askOp } = useOpConfirm({ endpoint: '/api/x' })\n`
      + `</script>\n`
      + `<button @click="askOp('backup:run')">Back up</button>\n`
      + `<div @show="pending() !== null">confirm</div>`

    const out = await processDirectives(page, {}, 'page.stx', { composablesDir: dir, debug: false } as any, new Set())

    // 1. The bundle is injected...
    expect(out).toContain('<script data-stx-composables>')
    // 2. ...the import compiled to a destructure of the global...
    expect(out).toMatch(/const \{\s*useOpConfirm\s*\} = window\.__composables/)
    // 3. ...and the names the directives reference are returned from the page
    //    setup, which is what puts them in the template scope. Without this the
    //    button renders but the click does nothing.
    expect(out).toMatch(/return \{[^}]*\bpending\b[^}]*\baskOp\b[^}]*\}/)
  })

  it('injects composables after the stores tag so a composable can use a store', async () => {
    const page = `<script client>\nimport { useOpConfirm } from '@composables'\nconst { pending } = useOpConfirm({ endpoint: '/x' })\n</script>\n<div @show="pending()">x</div>`
    const out = await processDirectives(page, {}, 'page.stx', { composablesDir: dir, debug: false } as any, new Set())

    const runtimeIdx = out.indexOf('<script data-stx-scoped>')
    const composablesIdx = out.indexOf('<script data-stx-composables>')
    // Composables must land after the signals runtime — they call state()/derived().
    expect(runtimeIdx).toBeGreaterThanOrEqual(0)
    expect(composablesIdx).toBeGreaterThan(runtimeIdx)
  })
})
