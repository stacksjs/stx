/**
 * Auto-layout resolution is gated on the page being a DOCUMENT, anchored
 * (stacksjs/stx#1792, part one item 1).
 *
 * The gate was an unanchored `/<!DOCTYPE\s/i` over the whole template, so a
 * doctype inside a code sample, a docs page or an install snippet tripped it.
 * When it tripped, layoutPath stayed empty, both layout lookups were skipped,
 * and the page was returned as-is — no layout, no `stx-layout` marker for the
 * router, and no warning anywhere.
 *
 * Opting out of the layout system looked identical to never having had one,
 * which is how a whole marketing site ended up hand-rolling 24 documents with a
 * correct, complete layout sitting unused on disk.
 *
 * The same anchored scanner also closes the opposite hole: the old test had no
 * `<html>` arm, so a real document that merely omitted its doctype WAS wrapped,
 * splicing its own `<html>` into the layout's `<main>`.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

let dir: string

beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stx-layout-gate-'))
  fs.mkdirSync(path.join(dir, 'layouts'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'layouts', 'default.stx'),
    '<div class="LAYOUT-CHROME">@yield("content")</div>',
  )
})

afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

async function applied(template: string): Promise<boolean> {
  const out = await processDirectives(template, {}, path.join(dir, 'page.stx'), {
    ...defaultConfig,
    autoShell: false,
    defaultLayout: 'default',
    layoutsDir: path.join(dir, 'layouts'),
    partialsDir: dir,
    componentsDir: dir,
  } as never, new Set<string>())
  return out.includes('LAYOUT-CHROME')
}

describe('auto-layout gate', () => {
  it('applies the layout to an ordinary page', async () => {
    expect(await applied('<main>body</main>')).toBe(true)
  })

  it('applies the layout to a page that prints a doctype in a code sample', async () => {
    // A docs page showing a DOCTYPE is not a document.
    expect(await applied('<main><pre>&lt;!DOCTYPE html&gt;</pre></main>')).toBe(true)
  })

  it('applies the layout when a doctype appears mid-page as text', async () => {
    expect(await applied('<main>put <!DOCTYPE html> at the top</main>')).toBe(true)
  })

  it('skips the layout for a page that really is a document', async () => {
    // The implicit opt-out this heuristic exists for, still honoured.
    expect(await applied('<!DOCTYPE html>\n<html><body>x</body></html>')).toBe(false)
  })

  it('skips the layout for a document that omits its doctype', async () => {
    // The opposite hole: the old gate had no <html> arm, so this WAS wrapped —
    // the page's own <html> spliced into the layout's <main>.
    expect(await applied('<html><body>x</body></html>')).toBe(false)
  })

  it('still honours the explicit @nolayout opt-out', async () => {
    expect(await applied('@nolayout\n<main>body</main>')).toBe(false)
  })
})
