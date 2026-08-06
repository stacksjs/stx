/**
 * A TypeScript generic does not hide a call from auto-import detection
 * (stacksjs/stx#1880) — and a multi-line import does not survive the loaders
 * (stacksjs/stx#1859).
 *
 * Both are one regex each, and both fail the same way: silently, at runtime,
 * with no build error.
 *
 * #1880 — auto-import detection matched `name\s*\(`, and it runs BEFORE
 * transpilation, so `useQuery<Foo>('/api/x')` still carried its type argument
 * and did not look like a call. The name was left out of the `window.stx`
 * destructure while the body still called it, so the page threw
 * `ReferenceError`. It only bit a script touching none of SIGNAL_API_RE's
 * names, since one of those triggers a blanket destructure that rescues the
 * rest — which is why it survived this long.
 *
 * #1859 — the loaders stripped imports with a line-anchored pattern, so a
 * multi-line specifier list survived it, and survived Bun's transpiler too
 * (`import` is legal at a module's top level). It only failed once the body was
 * wrapped in the shared IIFE, where an import is a SyntaxError that takes EVERY
 * store in the bundle with it, reported as a misleading "Store not found".
 */
import { describe, expect, it } from 'bun:test'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { stripModuleImports } from '../../src/store-imports'
import { getStoreScript } from '../../src/store-loader'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: false,
} as never

/** Which names does the emitted client script destructure from window.stx? */
async function destructured(clientBody: string): Promise<string[]> {
  const out = await processDirectives(
    `<script client>\n${clientBody}\n</script><main>x</main>`,
    {},
    '/app/page.stx',
    base,
    new Set<string>(),
  )
  const match = /var \{([^}]*)\} = window\.stx/.exec(out)
  return match ? match[1].split(',').map(s => s.trim()).filter(Boolean) : []
}

describe('generic calls are still calls (#1880)', () => {
  it('destructures a name called with a type argument', async () => {
    expect(await destructured('const q = useQuery<Foo>("/api/x")')).toContain('useQuery')
  })

  it('destructures the same name without one', async () => {
    expect(await destructured('const q = useQuery("/api/x")')).toContain('useQuery')
  })

  it('handles a multi-parameter generic', async () => {
    expect(await destructured('const m = useMutation<Foo, Bar>("/api/x")')).toContain('useMutation')
  })

  it('does not invent a name that is never called', async () => {
    // The detector must still be a detector — `useQuery` in prose or as a bare
    // identifier is not a call.
    expect(await destructured('const label = "call useQuery to fetch"')).not.toContain('useQuery')
  })
})

describe('imports are stripped however they are written (#1859)', () => {
  it('strips a multi-line specifier list', () => {
    const out = stripModuleImports('import {\n  state,\n  derived,\n} from \'stx\'\nexport const x = 1')

    expect(out).not.toMatch(/^\s*import\b/m)
    expect(out).toContain('export const x = 1')
  })

  it('strips a single-line import, as before', () => {
    expect(stripModuleImports('import { state } from \'stx\'\nconst x = 1')).not.toMatch(/^\s*import\b/m)
  })

  it('strips two adjacent imports without swallowing the code between', () => {
    // `[^'"]` is what stops a multi-line match running past its own statement.
    const out = stripModuleImports('import { a } from \'x\'\nimport { b } from \'y\'\nconst keep = 1')

    expect(out).not.toMatch(/^\s*import\b/m)
    expect(out).toContain('const keep = 1')
  })

  it('strips a side-effect import', () => {
    expect(stripModuleImports('import \'./setup\'\nconst x = 1')).not.toMatch(/^\s*import\b/m)
  })

  it('leaves the word import inside a string alone', () => {
    const code = 'const s = \'import { x } from y\'\nconst k = 1'

    expect(stripModuleImports(code)).toBe(code)
  })
})

describe('a store written with a multi-line import still loads (#1859)', () => {
  it('produces a bundle that parses', async () => {
    // The end-to-end failure: the store body reaches the shared IIFE with its
    // import intact and SyntaxErrors, killing every store in the app.
    const dir = await mkdtemp(path.join(tmpdir(), 'stx-store-import-'))
    try {
      await Bun.write(path.join(dir, 'cart.ts'), `import {
  state,
  derived,
} from 'stx'

export const useCart = defineStore('cart', () => {
  const items = state([])
  return { items }
})
`)
      const code = await getStoreScript(dir)

      expect(code).toBeTruthy()
      expect(code).not.toMatch(/^\s*import\b/m)
      expect(() => new Function(code as string)).not.toThrow()
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
