import { describe, expect, it } from 'bun:test'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { processInlineAssets } from '../src/inline-assets'
import { processDirectives } from '../src/process'
import { createTempDir } from '../src/temp-dir'

/**
 * What gets inlined is a classic `<script>`, where `import.meta` is a
 * SyntaxError — a parse error, so the whole script dies and every other
 * script on the page dies with it. The page still renders its server HTML,
 * which is what makes the failure so hard to read from the outside.
 */
describe('inlining browser code into a classic script', () => {
  it('refuses code that still references import.meta', async () => {
    const dir = createTempDir('stx-inline-')
    try {
      await writeFile(join(dir, 'boom.ts'), 'export const where = import.meta.url\n')
      const html = '<script src="./boom.ts"></script>'

      await expect(processInlineAssets(html, join(dir, 'page.stx'), new Set()))
        .rejects.toThrow(/import\.meta/)
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('inlines ordinary browser code untouched', async () => {
    const dir = createTempDir('stx-inline-ok-')
    try {
      await writeFile(join(dir, 'fine.ts'), 'export const n: number = 41 + 1\n')
      const html = '<script src="./fine.ts"></script>'
      const out = await processInlineAssets(html, join(dir, 'page.stx'), new Set())

      expect(out).toContain('<script data-stx-inlined="./fine.ts">')
      expect(out).not.toContain('import.meta')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('keeps a module script a module, with its own attributes', async () => {
    const dir = createTempDir('stx-inline-module-')
    try {
      await writeFile(join(dir, 'mod.ts'), 'export const where = import.meta.url\nconsole.log(where)\n')
      const out = await processInlineAssets('<script type="module" src="./mod.ts" nonce="n"></script>', join(dir, 'page.stx'), new Set())

      expect(out).toMatch(/<script type="module" nonce="n" data-stx-inlined="\.\/mod\.ts">/)
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  // The client-script pass skips `<script src>`: a file is not the view's own
  // code. Inlining removed the `src`, so the bundle was wrapped as the page's
  // scope after the view's real block, and every component slot rendered
  // after it read the minifier's names instead of the page's.
  it('leaves an inlined file out of the page scope', async () => {
    const dir = createTempDir('stx-inline-scope-')
    try {
      await writeFile(join(dir, 'helper.ts'), 'function a(n: number) { return n + 1 }\n;(window as any).helper = a\n')
      const page = join(dir, 'page.stx')
      const out = await processDirectives(
        `<p :text="greeting()"></p>\n<script client>\nconst greeting = state('hello')\n</script>\n<script type="module" src="./helper.ts"></script>`,
        {},
        page,
        { debug: false } as any,
        new Set(),
      )

      const inlined = out.match(/<script type="module" data-stx-inlined="\.\/helper\.ts">([\s\S]*?)<\/script>/)
      expect(inlined?.[1]).toContain('helper')
      // The view's block is the only page setup, and the file is not in it.
      expect(out.match(/function __stx_setup_/g)?.length).toBe(1)
      const scoped = [...out.matchAll(/<script[^>]*data-stx-scoped[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).join('\n')
      expect(scoped).not.toContain('.helper')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
