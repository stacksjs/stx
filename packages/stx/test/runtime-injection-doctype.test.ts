/**
 * The runtime tag must never land ahead of the doctype (stacksjs/stx#1899).
 *
 * A start tag before `<!DOCTYPE html>` puts the document in quirks mode. That
 * is invisible to every check a normal suite makes — the page still returns
 * 200, still renders, still logs nothing — so it is pinned here instead.
 *
 * The bug shape: a page with a client script, on a full-document layout whose
 * `<head>` holds no script of its own. `indexOf('<script')` then resolves to
 * the layout comment boundary ahead of the doctype, and the runtime plus the
 * store block that anchors to it get prepended above it.
 *
 * The tests below also pin the behaviour the old rule existed for, because the
 * obvious fix — always inject into `<head>` — breaks it: a layout script can
 * appear before `<head>`, and the runtime has to precede it or that script
 * throws on `window.stx`.
 */
import { describe, expect, it } from 'bun:test'
import { injectSignalsRuntime } from '../src/runtime-injection'

const MODES = ['serve', 'compile'] as const

/** Everything before the doctype, which the parser sees first. */
function beforeDoctype(html: string): string {
  const idx = html.search(/<!doctype\b/i)
  return idx === -1 ? html : html.slice(0, idx)
}

function fullDocument(headExtra = '', bodyExtra = ''): string {
  return `<!-- stx-layout: marketing -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">${headExtra}
  </head>
  <body>
    <main>${bodyExtra}</main>
  </body>
</html>`
}

describe('injectSignalsRuntime — doctype position (#1899)', () => {
  for (const buildMode of MODES) {
    describe(`buildMode: ${buildMode}`, () => {
      it('does not put the runtime above the doctype when the head has no script', async () => {
        const input = fullDocument('', '<script client>const n = state(0)</script>')
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        expect(out).toContain('data-stx-runtime')
        // The whole point: nothing but the layout comment precedes the doctype.
        expect(beforeDoctype(out)).not.toContain('<script')
      })

      it('leaves the doctype as the first tag in the document', async () => {
        const input = fullDocument('', '<script client>const n = state(0)</script>')
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        // First tag of any kind, comments excluded, must be the doctype.
        const firstTag = out.replace(/<!--[\s\S]*?-->/g, '').match(/<[^>]+>/)
        expect(firstTag?.[0].toLowerCase()).toStartWith('<!doctype')
      })

      it('puts the runtime inside <head>, ahead of a script already in the head', async () => {
        const input = fullDocument('\n    <script>window.theme = "dark"</script>')
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        const runtimeAt = out.indexOf('data-stx-runtime')
        const headOpen = out.search(/<head\b/i)
        const headClose = out.indexOf('</head>')
        const themeAt = out.indexOf('window.theme')

        expect(runtimeAt).toBeGreaterThan(headOpen)
        expect(runtimeAt).toBeLessThan(headClose)
        // Ahead of the head's own script, or that script cannot use the runtime.
        expect(runtimeAt).toBeLessThan(themeAt)
      })

      it('still precedes a layout script that sits before <head> — the reason the old rule existed', async () => {
        // The case the original comment was written for: a script between
        // <html> and <head>. That is after the doctype, so the first-script
        // rule still applies and the runtime goes ahead of it.
        const input = `<!DOCTYPE html>
<html><script>window.__early = 1</script><head><meta charset="utf-8"></head><body><main></main></body></html>`
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        expect(out.indexOf('data-stx-runtime')).toBeLessThan(out.indexOf('window.__early'))
        expect(beforeDoctype(out)).not.toContain('<script')
      })

      it('prefers standards mode over runtime-first when a script already precedes the doctype', async () => {
        // Malformed input: the document is heading for quirks mode on its own.
        // The deliberate choice is not to compound it — the runtime goes into
        // <head> rather than being stacked in front, so at least the tag we
        // control is not the one jumping the doctype. Such a script does not
        // get the runtime, which is the trade being made here on purpose.
        const input = `<script>window.__stray = 1</script>
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body><main></main></body></html>`
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        const runtimeAt = out.indexOf('data-stx-runtime')
        expect(runtimeAt).toBeGreaterThan(out.search(/<head\b/i))
        expect(runtimeAt).toBeLessThan(out.indexOf('</head>'))
      })

      it('injects into a fragment that has no doctype at all', async () => {
        const input = `<main><script client>const n = state(0)</script></main>`
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        expect(out).toContain('data-stx-runtime')
        expect(out.indexOf('data-stx-runtime')).toBeLessThan(out.indexOf('const n = state(0)'))
      })

      it('is a no-op when the page already declares the runtime itself', async () => {
        const input = fullDocument('\n    <script data-stx-runtime src="/_stx/runtime.js"></script>')
        const out = await injectSignalsRuntime(input, { buildMode } as any)

        expect(out).toBe(input)
        expect(out.match(/data-stx-runtime/g)).toHaveLength(1)
      })
    })
  }

  it('handles an uppercase DOCTYPE and a doctype with leading whitespace', async () => {
    const input = `\n  <!doctype html>\n<html><head><meta charset="utf-8"></head><body><script client>const n = state(0)</script></body></html>`
    const out = await injectSignalsRuntime(input, { buildMode: 'serve' } as any)

    expect(beforeDoctype(out)).not.toContain('<script')
  })
})
