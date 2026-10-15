import { describe, expect, it } from 'bun:test'
import { rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { processInlineAssets } from '../src/inline-assets'
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

      expect(out).toContain('<script>')
      expect(out).not.toContain('import.meta')
    }
    finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
