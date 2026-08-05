/**
 * `@click="namedHandler"` invokes the handler on every binding path
 * (stacksjs/stx#1824, part 2).
 *
 * The declarative runtime learned this in #1695: a bare function reference is
 * called with `$event`, matching Alpine/Vue/Svelte. Without it the expression
 * falls through to a generic `new Function` and runs as a discarded identifier
 * statement — the click does nothing, with no error.
 *
 * The three IMPERATIVE paths never got that fix, so which behaviour you got
 * depended on which binding path the page happened to take, and that in turn
 * depended on which reactive API the client block happened to call. A page
 * using `state()` bound declaratively and worked; the same page using only
 * plain functions was rebound imperatively and the button did nothing.
 *
 * These tests EXECUTE the emitted code and click the button, rather than
 * asserting on its text. The bug was that generated code parsed fine and did
 * nothing, which is exactly what a string assertion cannot see — and what the
 * existing suite missed, because every fixture used the call form `doThing()`,
 * for which evaluating and invoking are the same thing.
 */
import { describe, expect, it } from 'bun:test'
import { Window } from 'very-happy-dom'
import { defaultConfig } from '../../src/config'
import { asInvocableStatement, processEventDirectives } from '../../src/events'
import { processDirectives } from '../../src/process'

const base = {
  ...defaultConfig,
  partialsDir: '/tmp',
  componentsDir: '/tmp',
  autoShell: true,
} as never

/**
 * Run a rendered page's inline scripts in a DOM, click `#target`, and report
 * whether the handler ran.
 *
 * `window.stx.mount` is stubbed to invoke its callback: the emitted event
 * bindings live inside that callback, and this is testing the bindings, not the
 * runtime that would normally supply mount.
 */
function clickAndReport(html: string): { called: number, errors: string[] } {
  const window = new Window({ url: 'http://localhost/' })
  const errors: string[] = []
  let called = 0

  ;(window as any).stx = { mount: (fn: () => unknown) => fn() }
  ;(window as any).__record = () => { called++ }
  ;(window as any).console = { ...console, error: (...a: unknown[]) => errors.push(String(a[0])) }

  // Scripts are pulled out BEFORE the markup reaches the DOM. very-happy-dom
  // does not parse <script> as raw text, so the `.replace(/&lt;/g, '<')` inside
  // __stx_runHandler makes document.write throw "Invalid tag name".
  //
  // The signals runtime is dropped here too. These pages do get one (#1820
  // guarantees it for anything that mounts), but it would replace the `mount`
  // stub above with the real deferred implementation, which waits for a
  // DOMContentLoaded that never comes. Dropping it isolates what is under test:
  // the imperative binding is the ONLY thing wiring these buttons, since the
  // `@click` attribute is already stripped out of the markup and the runtime
  // has nothing left to bind declaratively.
  const scripts: string[] = []
  const markup = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (_full, attrs: string, body: string) => {
    if (!/\bdata-stx-runtime\b/.test(attrs) && body.trim())
      scripts.push(body)
    return ''
  })

  // processDirectives returns a complete document under autoShell; wrapping one
  // in another <html> makes the parse fail and silently drops the markup.
  const isDocument = /^\s*(?:<!DOCTYPE|<html)/i.test(markup)
  window.document.write(isDocument ? markup : `<!DOCTYPE html><html><body>${markup}</body></html>`)

  // One shared scope for every script, so a function declared by one is visible
  // to the binding emitted by another — what the browser does with two
  // top-level scripts. very-happy-dom has no window.eval.
  try {
    // eslint-disable-next-line no-new-func
    new Function('window', 'document', 'console', scripts.join('\n;\n'))(
      window,
      window.document,
      (window as any).console,
    )
  }
  catch (error) {
    errors.push(String(error))
  }

  const target = window.document.querySelector('#target') as any
  if (!target)
    throw new Error(`no #target in rendered output:\n${window.document.body.innerHTML.slice(0, 500)}`)
  target.click()

  return { called, errors }
}

describe('asInvocableStatement', () => {
  it('invokes a bare identifier', () => {
    expect(asInvocableStatement('doThing'))
      .toBe(`if (typeof doThing === 'function' && !doThing._isSignal) doThing($event);`)
  })

  it('leaves a call expression alone', () => {
    expect(asInvocableStatement('doThing()')).toBe('doThing()')
    expect(asInvocableStatement('doThing(1, 2)')).toBe('doThing(1, 2)')
  })

  it('leaves anything that is not a plain identifier alone', () => {
    // A dotted path would need `obj` to exist before `typeof obj.fn` could be
    // asked, so the runtime does not handle it either and neither does this.
    for (const expr of ['obj.fn', 'count = count + 1', 'open = !open', 'a ? b() : c()', ''])
      expect(asInvocableStatement(expr)).toBe(expr)
  })

  it('excludes signals, which are themselves functions', () => {
    // Without the _isSignal guard, `@click="count"` would READ the signal
    // rather than do nothing. The runtime makes the same exclusion.
    expect(asInvocableStatement('count')).toContain('!count._isSignal')
  })
})

describe('the generated event script is one script element', () => {
  it('emits no raw closing tag before its own end', () => {
    // A browser ends a script element at the FIRST closing tag it sees. This
    // script carried one inside a comment — as an EXAMPLE of what must never
    // appear in it — so it self-terminated 723 characters in, and the 1206
    // characters after that, __stx_runHandler and every listener included, were
    // emitted as page text. The imperative path could not work in a browser at
    // all, and dumped its own source onto the page.
    //
    // Undetectable from the server: the string is valid, the tests parsed it as
    // JS, and only an HTML parser disagrees.
    const closeTag = `</${'script'}>`
    for (const template of [
      '<button @click="a()">go</button>',
      '<button @click.debounce.300="a">go</button>',
      '<div @mounted="a()" @unmounted="b()">x</div>',
    ]) {
      const out = processEventDirectives(template, {}, '/tmp/p.stx')
      expect(out.split(closeTag)).toHaveLength(2)
    }
  })
})

describe('the reference form actually fires', () => {
  it('runs the handler on the imperative client-script path', async () => {
    // A client block of plain functions: no signal API and no bound attribute,
    // so it takes the imperative path rather than the declarative one.
    const out = await processDirectives(`<script client>
function doThing() { window.__record() }
</script>
<button id="target" @click="doThing">go</button>`, {}, '/app/p.stx', base, new Set<string>())

    const { called, errors } = clickAndReport(out)

    expect(errors).toEqual([])
    expect(called).toBe(1)
  })

  it('still runs the handler in the call form', async () => {
    const out = await processDirectives(`<script client>
function doThing() { window.__record() }
</script>
<button id="target" @click="doThing()">go</button>`, {}, '/app/p.stx', base, new Set<string>())

    const { called, errors } = clickAndReport(out)

    expect(errors).toEqual([])
    expect(called).toBe(1)
  })

  it('runs the handler on the standalone events.ts path', () => {
    // Reached when the template has no reactive context at all, so the handler
    // resolves as a global rather than out of a setup closure.
    //
    // The handler is installed on globalThis rather than declared in a script,
    // because __stx_runHandler evaluates through `new Function`, which always
    // resolves against the real global scope. In a browser a top-level
    // `function doThing()` IS that global; the harness has to model it, not a
    // lexical binding it would never actually see.
    let called = 0
    ;(globalThis as any).__stxRefFormHandler = () => { called++ }

    try {
      const out = processEventDirectives(
        '<button id="target" @click="__stxRefFormHandler">go</button>',
        {},
        '/tmp/p.stx',
      )

      expect(clickAndReport(out).errors).toEqual([])
      expect(called).toBe(1)
    }
    finally {
      delete (globalThis as any).__stxRefFormHandler
    }
  })

  it('passes the event to the handler', async () => {
    const out = await processDirectives(`<script client>
function doThing(e) { if (e && e.type === 'click') window.__record() }
</script>
<button id="target" @click="doThing">go</button>`, {}, '/app/p.stx', base, new Set<string>())

    expect(clickAndReport(out).called).toBe(1)
  })

  it('does nothing, quietly, when the name is not a function', async () => {
    // The typeof guard is what keeps this from throwing. A handler naming
    // something undeclared should be inert, not a TypeError on every click.
    const out = await processDirectives(`<script client>
const notAFunction = 42
</script>
<button id="target" @click="notAFunction">go</button>`, {}, '/app/p.stx', base, new Set<string>())

    const { called, errors } = clickAndReport(out)

    expect(called).toBe(0)
    expect(errors).toEqual([])
  })
})
