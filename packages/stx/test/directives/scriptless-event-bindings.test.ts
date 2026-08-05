/**
 * An `@click` on a page with no client script still gets wired up
 * (stacksjs/stx#1834).
 *
 * `processEventDirectives` parks its parsed bindings on the context for the
 * client-script pass to inject into that script's scope. That is the right home
 * when a client script exists. When the page has none, nothing ever consumed
 * them: the attribute was stripped from the markup, the element kept its
 * generated id, and the handler was simply gone.
 *
 * No listener, no runtime, no error — on full page load as much as SPA
 * navigation. The attribute was understood and then discarded, which is the
 * worst version of being wrong: nothing in the output hints that stx saw it.
 *
 * `@click` calling into a store or a global is a reasonable thing to write with
 * no local state, and it is the shape the docs encourage for store-backed
 * actions.
 *
 * These tests CLICK the button rather than asserting on the emitted text,
 * because "a script is present" is not the property that matters — the previous
 * bug produced markup that looked plausible and did nothing.
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: true,
} as never

function render(template: string): Promise<string> {
  return processDirectives(template, {}, '/app/page.stx', base, new Set<string>())
}

/**
 * Render, run the emitted scripts, click the button, and report whether the
 * handler ran.
 *
 * Scripts are pulled out with a regex rather than through the DOM:
 * very-happy-dom does not parse `<script>` as raw text, so the entity-decoding
 * regexes inside the emitted runner make `document.write` throw.
 */
async function clickAndCount(template: string): Promise<{ called: number, errors: string[] }> {
  const out = await render(template)
  const window = new Window({ url: 'http://localhost/' })
  const errors: string[] = []
  let called = 0
  ;(globalThis as any).__stxScriptlessProbe = () => { called++ }

  const scripts: string[] = []
  const markup = out.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_full, body: string) => {
    if (body.trim())
      scripts.push(body)
    return ''
  })
  window.document.write(markup)

  try {
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', 'console', scripts.join('\n;\n'))(window, window.document, console)
  }
  catch (error) {
    errors.push(String(error))
  }

  ;(window.document.querySelector('button') as any)?.click()
  delete (globalThis as any).__stxScriptlessProbe
  return { called, errors }
}

describe('a page with no client script', () => {
  it('runs a handler written in the call form', async () => {
    const result = await clickAndCount('<main><button @click="__stxScriptlessProbe()">go</button></main>')

    expect(result.errors).toEqual([])
    expect(result.called).toBe(1)
  })

  it('runs a handler written as a bare reference', async () => {
    // The reference form has to be INVOKED, not evaluated (#1824).
    const result = await clickAndCount('<main><button @click="__stxScriptlessProbe">go</button></main>')

    expect(result.errors).toEqual([])
    expect(result.called).toBe(1)
  })

  it('emits a binding script at all', async () => {
    const out = await render('<main><button @click="doThing()">go</button></main>')

    expect(out).toContain('data-stx-events')
  })

  it('leaves a page with no events alone', async () => {
    // The flush must not manufacture a script out of nothing.
    const out = await render('<main><p>hi</p></main>')

    expect(out).not.toContain('data-stx-events')
  })
})

describe('pages that already had a home for their bindings', () => {
  it('does not double-bind when a client script consumed them', async () => {
    // With a client script present the bindings go into its scope, and the
    // flush must not emit a second copy — that would run every handler twice.
    const out = await render(`<script client>
function doThing() { globalThis.__stxScriptlessProbe() }
</script>
<main><button @click="doThing()">go</button></main>`)

    expect(out).not.toContain('data-stx-events')
  })

  it('leaves a reactive page to the signals runtime', async () => {
    // A template with a reactive context keeps its @click attribute in the
    // markup for the runtime to bind declaratively (#1824), so there is nothing
    // parked and nothing to flush.
    const out = await render(`<script client>
const n = state(0)
</script>
<main><button @click="n.set(n() + 1)">go</button><span :text="n"></span></main>`)

    expect(out).toContain('@click=')
    expect(out).not.toContain('data-stx-events')
  })
})
