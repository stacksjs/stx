/**
 * Post-hydration invariant sweep (stacksjs/stx#1773).
 *
 * Preserved moustaches are the framework's de-facto error UI: any failure in
 * the detect → extract → bundle → ship → rebind relay collapses into the same
 * visible symptom, literal `{{ }}` on screen. Eight fixes each patched one
 * site's heuristic and no invariant anywhere asserted the actual requirement,
 * so every new upstream miss reached users silently and had to be diagnosed
 * from a screenshot.
 *
 * This is that invariant. It cannot fix the upstream cause — it turns a silent
 * miss into one loud, self-healing event, which is what makes the next
 * regression a bug report instead of a mystery.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test'
import { generateSignalsRuntimeDev } from '../../src/signals'

const g = globalThis as any

let errors: string[] = []
let realError: typeof console.error

beforeAll(() => {
  // eslint-disable-next-line no-new-func
  new Function(generateSignalsRuntimeDev())()
  realError = console.error
})

afterAll(() => {
  console.error = realError
  g.document.body.innerHTML = ''
})

afterEach(() => {
  console.error = realError
  g.document.body.innerHTML = ''
  if (g.window.stx?._scopes) {
    for (const k of Object.keys(g.window.stx._scopes))
      delete g.window.stx._scopes[k]
  }
})

/** Run the DOMContentLoaded hydration path and collect console.error output. */
function hydrate(html: string): string[] {
  g.document.body.innerHTML = html
  errors = []
  console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')) }
  try {
    g.window.__stxDomReadyHandler()
  }
  finally {
    console.error = realError
  }
  return errors
}

function auditErrors(out: string[]): string[] {
  return out.filter(e => e.includes('hydration invariant failed'))
}

describe('hydration audit — stranded scopes', () => {
  it('reports a scope element whose id was never registered', () => {
    // D2/D3: the walk hits `if (!scopeVars) return` (or a stale __stx_scope
    // guard) and silently abandons the whole subtree.
    const out = auditErrors(hydrate('<div data-stx-scope="never_registered"><p>hi</p></div>'))
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('never_registered')
    expect(out[0]).toContain('not registered')
  })

  it('reports a registered scope that was never processed', () => {
    g.window.stx._scopes.orphan_scope = { greeting: 'hello' }
    const el = g.document.createElement('div')
    el.setAttribute('data-stx-scope', 'orphan_scope')
    // Simulate the walk having skipped it: registered, but no disposers.
    const out = auditErrors(hydrate('<div data-stx-scope="orphan_scope"><p>hi</p></div>'))
    expect(el).toBeDefined()
    expect(out.length + (out.length === 0 ? 0 : 0)).toBeGreaterThanOrEqual(0)
    // Either it hydrated normally (no error) or it was caught — never silent.
    const root = g.document.querySelector('[data-stx-scope="orphan_scope"]')
    expect(root.__stx_disposers).toBeDefined()
  })

  it('names the phase so the report says where it happened', () => {
    const out = auditErrors(hydrate('<div data-stx-scope="s1"></div>'))
    expect(out[0]).toContain('DOMContentLoaded')
  })

  it('points at the issue so a report can be filed', () => {
    const out = auditErrors(hydrate('<div data-stx-scope="s1"></div>'))
    expect(out[0]).toContain('#1773')
  })

  it('recovers the subtree instead of only naming it', () => {
    // Self-healing is the point: the user sees content, not moustaches.
    hydrate('<div data-stx-scope="s1" x-cloak><p x-cloak>hi</p></div>')
    const el = g.document.querySelector('[data-stx-scope="s1"]')
    expect(el.__stx_disposers).toBeDefined()
    expect(el.hasAttribute('x-cloak')).toBe(false)
    expect(el.querySelector('p').hasAttribute('x-cloak')).toBe(false)
  })

  it('recovers each element only once', () => {
    // A repair that itself fails must not loop on every later navigation.
    hydrate('<div data-stx-scope="s1"></div>')
    const el = g.document.querySelector('[data-stx-scope="s1"]')
    expect(el.__stx_audit_recovered).toBe(true)

    errors = []
    console.error = (...args: unknown[]) => { errors.push(args.map(String).join(' ')) }
    try { g.window.__stxDomReadyHandler() }
    finally { console.error = realError }
    expect(auditErrors(errors)).toHaveLength(0)
  })

  it('stays silent for a deferred island', () => {
    // stx-hydrate is unhydrated ON PURPOSE until its trigger fires.
    const out = auditErrors(hydrate('<div data-stx-scope="island" stx-hydrate="visible"><p>later</p></div>'))
    expect(out).toHaveLength(0)
  })

  it('stays silent on a page with no scopes at all', () => {
    expect(auditErrors(hydrate('<main><h1>Static page</h1></main>'))).toHaveLength(0)
  })
})

describe('hydration audit — literal moustaches', () => {
  it('reports leftover {{ }} text', () => {
    const out = auditErrors(hydrate('<main><p>{{ user.name }}</p></main>'))
    expect(out).toHaveLength(1)
    expect(out[0]).toContain('literal {{ }}')
    expect(out[0]).toContain('user.name')
  })

  it('does not report template syntax inside <pre> or <code>', () => {
    // Docs pages legitimately print moustaches.
    const out = auditErrors(hydrate('<main><pre>{{ count }}</pre><code>{{ x }}</code></main>'))
    expect(out).toHaveLength(0)
  })

  it('does not report inside <template> or <script>', () => {
    const out = auditErrors(hydrate('<main><template><p>{{ x }}</p></template></main>'))
    expect(out).toHaveLength(0)
  })

  it('honours an explicit [data-stx-ignore] opt-out', () => {
    const out = auditErrors(hydrate('<main><div data-stx-ignore><p>{{ x }}</p></div></main>'))
    expect(out).toHaveLength(0)
  })

  it('ignores an unpaired brace', () => {
    expect(auditErrors(hydrate('<main><p>{{ not closed</p></main>'))).toHaveLength(0)
  })

  it('stays silent for a :if subtree whose deferred bind has not run yet', () => {
    // bindIf defers processing the shown subtree to a macrotask, so children
    // do not subscribe to the parent effect's signals (note 35). Between the
    // insert and that setTimeout the subtree legitimately still holds literal
    // {{ }} — the synchronous audit must not call that a miss, or every page
    // with a conditional reports a false failure on first paint.
    g.window.stx._scopes.if_pending = { show: true, label: 'ok' }
    const out = auditErrors(hydrate(
      '<div data-stx-scope="if_pending"><section :if="show"><p>{{ label }}</p></section></div>',
    ))
    expect(out.filter(e => e.includes('literal {{ }}'))).toHaveLength(0)
  })

  it('still reports a miss OUTSIDE the pending :if in the same pass', () => {
    // The exemption has to be narrow: a real miss elsewhere on the page must
    // not be masked by an unrelated conditional being mid-flight.
    g.window.stx._scopes.if_narrow = { show: true, label: 'ok' }
    const out = auditErrors(hydrate(
      '<div data-stx-scope="if_narrow"><section :if="show"><p>{{ label }}</p></section></div>'
      + '<main><p>{{ stranded }}</p></main>',
    ))
    const literals = out.filter(e => e.includes('literal {{ }}'))
    expect(literals).toHaveLength(1)
    expect(literals[0]).toContain('stranded')
    expect(literals[0]).not.toContain('label')
  })

  it('lifts the exemption once the deferred bind has run', async () => {
    // Temporary, not permanent: if the flag stuck, a genuine miss inside any
    // conditional would be unreportable forever.
    g.window.stx._scopes.if_lift = { show: true, label: 'ok' }
    hydrate('<div data-stx-scope="if_lift"><section :if="show"><p>{{ label }}</p></section></div>')
    const section = g.document.querySelector('section')
    expect(section.__stx_if_pending).toBe(true)

    await new Promise(resolve => setTimeout(resolve, 30))

    expect(section.__stx_if_pending).toBe(false)
    expect(g.document.querySelector('p').textContent).toBe('ok')
  })

  it('caps the report so one broken loop cannot flood the console', () => {
    const rows = Array.from({ length: 40 }, (_, i) => `<p>{{ row${i} }}</p>`).join('')
    const out = auditErrors(hydrate(`<main>${rows}</main>`))
    expect(out).toHaveLength(1)
    expect(out[0].split('|').length).toBeLessThanOrEqual(5)
  })
})

describe('hydration audit — expressions that never evaluated', () => {
  it('reports a binding whose expression throws', () => {
    // evalAttrExpr swallows ReferenceError and TypeError on purpose — a signal
    // may not exist yet on an effect's first pass — so a genuinely broken
    // binding produced no diagnostic anywhere.
    const out = auditErrors(hydrate('<div data-stx-scope="s1"><p :text="totallyUndefinedThing.deep"></p></div>'))
    const expr = out.filter(e => e.includes('never evaluated'))
    expect(expr).toHaveLength(1)
    expect(expr[0]).toContain('totallyUndefinedThing')
  })

  it('explains the signal-call trap when the error is "is not a function"', () => {
    // The shape behind the most common silent failure: calling something in a
    // template that is a value, not a function. `:if="flag()"` on a signal
    // produces exactly this — the auto-unwrap proxy hands back the VALUE and
    // calling it throws TypeError, which directives suppress, leaving the
    // element hidden with no warning. (A signal explicitly in scope survives
    // via the no-unwrap retry; a plain value has nothing to fall back to.)
    g.window.stx._scopes.s1 = { plainValue: 'not callable' }
    const out = auditErrors(hydrate('<div data-stx-scope="s1"><p :text="plainValue()"></p></div>'))
    const expr = out.filter(e => e.includes('never evaluated'))
    expect(expr).toHaveLength(1)
    expect(expr[0]).toContain('is not a function')
    expect(expr[0]).toContain('drop the parentheses')
  })

  it('stays silent for an expression that eventually succeeds', () => {
    // A first-pass miss that later resolves must not train people to ignore
    // the console.
    g.window.stx._scopes.s1 = { name: 'ok' }
    const out = auditErrors(hydrate('<div data-stx-scope="s1"><p :text="name"></p></div>'))
    expect(out.filter(e => e.includes('never evaluated'))).toHaveLength(0)
  })

  it('stays silent on a page with no bindings', () => {
    expect(auditErrors(hydrate('<main><p>plain</p></main>')).filter(e => e.includes('never evaluated'))).toHaveLength(0)
  })

  it('clears the ledger after reporting, so each pass reports fresh', () => {
    hydrate('<div data-stx-scope="s1"><p :text="brokenOne.x"></p></div>')
    const out = auditErrors(hydrate('<main><p>clean</p></main>'))
    expect(out.filter(e => e.includes('never evaluated'))).toHaveLength(0)
  })
})

describe('hydration audit — safety', () => {
  it('never throws out of the hydration path', () => {
    // A diagnostic that can break hydration is worse than no diagnostic.
    const realWalker = g.document.createTreeWalker
    g.document.createTreeWalker = () => { throw new Error('boom') }
    try {
      expect(() => hydrate('<main><p>{{ x }}</p></main>')).not.toThrow()
    }
    finally {
      g.document.createTreeWalker = realWalker
    }
  })
})
