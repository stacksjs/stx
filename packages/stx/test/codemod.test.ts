/**
 * Codemods for adopting stx primitives an app hand-rolled around (#1843).
 *
 * The issue proposes both rewrites as "mechanical and safe". The tests that
 * matter here are the ones proving they are not, and that the tool refuses
 * rather than guessing.
 */
import { describe, expect, it } from 'bun:test'
import { codemodSource, formatCodemodFindings } from '../src/codemod'

const run = (src: string, rules?: Array<'confirm' | 'tooltip'>) =>
  codemodSource(src, { file: 'a.stx', rules })

describe('confirm() is not a safe blind rewrite (#1843)', () => {
  it('refuses a synchronous call site', () => {
    // THE bug this guards. `if (stxConfirm(m))` is always true — a Promise is
    // truthy — so a blind rewrite turns "Delete this account?" into an
    // unconditional yes.
    const src = `function del() { if (confirm('Delete?')) { drop() } }`
    const { code, findings } = run(src, ['confirm'])

    expect(code).toBe(src)
    expect(findings[0].applied).toBeFalse()
    expect(findings[0].reason).toContain('always true')
  })

  it('rewrites inside an async function', () => {
    const { code, findings } = run(`async function del() { if (confirm('Delete?')) { drop() } }`, ['confirm'])
    expect(code).toContain('await stxConfirm(')
    expect(findings[0].applied).toBeTrue()
  })

  it('rewrites inside an async arrow', () => {
    // The common shape in a template: @click="async () => { … }"
    const { code } = run(`const h = async () => { if (confirm('x')) drop() }`, ['confirm'])
    expect(code).toContain('await stxConfirm(')
  })

  it('leaves window.confirm and other property access alone', () => {
    // `window.confirm(...)` is an explicit choice of the native dialog.
    const src = `async function f() { window.confirm('x'); this.confirm('y') }`
    expect(run(src, ['confirm']).code).toBe(src)
  })

  it('does not touch an already-migrated call', () => {
    const src = `async function f() { await stxConfirm('x') }`
    const { code, findings } = run(src, ['confirm'])
    expect(code).toBe(src)
    expect(findings).toEqual([])
  })

  it('reports the site even when it will not rewrite it', () => {
    // Reporting is the primary value — the app in #1843 had five of these and
    // did not know the primitive existed.
    const { findings } = run(`function a() { confirm('1') }\nfunction b() { confirm('2') }`, ['confirm'])
    expect(findings).toHaveLength(2)
    expect(findings.map(f => f.line)).toEqual([1, 2])
    expect(findings.every(f => !f.applied)).toBeTrue()
  })
})

describe('title= keeps its accessible description (#1843)', () => {
  it('adds x-tooltip and KEEPS title', () => {
    // `title` is announced by screen readers; x-tooltip sets no role and no
    // aria-*. Replacing one with the other is an a11y regression dressed up
    // as an upgrade.
    const { code } = run(`<button title="Save now">S</button>`, ['tooltip'])
    expect(code).toContain('x-tooltip="Save now"')
    expect(code).toContain('title="Save now"')
  })

  it('leaves an element that already has x-tooltip', () => {
    const src = `<button x-tooltip="Save" title="Save">S</button>`
    const { code, findings } = run(src, ['tooltip'])
    expect(code).toBe(src)
    expect(findings[0].reason).toBe('already has x-tooltip')
  })

  it('skips an empty title', () => {
    const src = `<button title="">S</button>`
    expect(run(src, ['tooltip']).code).toBe(src)
  })

  it('does not touch a <title> ELEMENT', () => {
    // Inside <svg> that element IS the accessible name; it is not an attribute
    // and must not be rewritten.
    const src = `<svg><title>Chart</title></svg>`
    expect(run(src, ['tooltip']).code).toBe(src)
  })

  it('handles single quotes', () => {
    const { code } = run(`<a title='Go home'>h</a>`, ['tooltip'])
    expect(code).toContain(`x-tooltip='Go home'`)
    expect(code).toContain(`title='Go home'`)
  })

  it('rewrites several on one element without corrupting the tag', () => {
    const { code } = run(`<a class="x" title="T" href="/y">z</a>`, ['tooltip'])
    expect(code).toContain('class="x"')
    expect(code).toContain('href="/y"')
    expect(code).toContain('x-tooltip="T"')
  })
})

describe('rule selection and reporting (#1843)', () => {
  it('runs both rules by default', () => {
    const { findings } = run(`<button title="T">x</button>\nfunction f(){ confirm('y') }`)
    expect(new Set(findings.map(f => f.rule))).toEqual(new Set(['confirm', 'tooltip']))
  })

  it('runs only what is asked for', () => {
    const { findings } = run(`<button title="T">x</button>\nfunction f(){ confirm('y') }`, ['tooltip'])
    expect(findings.every(f => f.rule === 'tooltip')).toBeTrue()
  })

  it('is a no-op on a file with neither', () => {
    const src = `const a = 1\n<p>hi</p>`
    const { code, findings } = run(src)
    expect(code).toBe(src)
    expect(findings).toEqual([])
  })
})

describe('the async check does not over-reach (#1843)', () => {
  it('refuses a sync callback nested inside an async function', () => {
    // The subtle case the conservative walk exists for: the enclosing function
    // is async, but the call sits in a synchronous callback. Rewriting there
    // reintroduces the always-true bug one level down.
    const src = `async function f() { items.map(x => { if (confirm('x')) drop(x) }) }`
    const { code, findings } = run(src, ['confirm'])
    expect(code).toBe(src)
    expect(findings[0].applied).toBeFalse()
  })

  it('refuses when a statement boundary separates async from the call', () => {
    const src = `async function a() {}\nfunction b() { confirm('x') }`
    expect(run(src, ['confirm']).code).toBe(src)
  })
})

/**
 * The report-only rules (#1843 ask 2).
 *
 * The two rewrite rules above cover two rows of an eleven-row table. The rest
 * of that table cannot be rewritten safely — `location.pathname.match(…)`
 * becomes `useRouteParam('id')` only if you know the route's parameter name,
 * and a hand `fetch` becomes `useFetch` only by restructuring the component —
 * so these report and never edit.
 *
 * Reporting is most of the value regardless: #1843's finding is that these
 * primitives are delivered and used ZERO times, so the gap is knowing they
 * exist, not typing the replacement.
 *
 * Every "does not fire" case below came from running the detectors over the
 * example corpus and finding a real false positive. A detector that fires on
 * ordinary code gets the whole tool muted, which costs the same as not
 * shipping it.
 */
describe('report-only detectors (#1843 ask 2)', () => {
  function findings(src: string, rule: any) {
    return codemodSource(src, { rules: [rule], file: 'a.stx' }).findings
  }

  it('never edits, whatever it finds', () => {
    const src = `const p = location.pathname.match(/x/)\nnavigator.clipboard.writeText('a')`
    expect(codemodSource(src).code).toBe(src)
  })

  it('flags hand-parsed route params', () => {
    const found = findings(`const id = location.pathname.match(/\\/judges\\/(\\d+)/)`, 'route-params')
    expect(found).toHaveLength(1)
    expect(found[0].reason).toContain('useRouteParam')
  })

  it('flags URLSearchParams filter state', () => {
    expect(findings(`const q = new URLSearchParams(location.search)`, 'search-params')).toHaveLength(1)
  })

  it('flags a full-page redirect', () => {
    expect(findings(`window.location.assign('/dashboard')`, 'navigate')).toHaveLength(1)
    expect(findings(`location.href = '/dashboard'`, 'navigate')).toHaveLength(1)
  })

  it('does NOT flag a mailto or an external URL', () => {
    // navigate() cannot handle these, so `location.href` is the correct code.
    expect(findings(`location.href = 'mailto:a@b.c'`, 'navigate')).toEqual([])
    expect(findings(`location.href = 'https://example.com'`, 'navigate')).toEqual([])
    expect(findings(`location.href = \`tel:\${n}\``, 'navigate')).toEqual([])
  })

  it('flags a hand-rolled AbortController', () => {
    expect(findings(`const c = new AbortController()`, 'fetch')).toHaveLength(1)
  })

  it('flags an interval that polls the network', () => {
    expect(findings(`setInterval(() => { fetch('/api/notifications') }, 30000)`, 'polling')).toHaveLength(1)
  })

  it('does NOT flag an interval that is just a timer', () => {
    // A file-wide "does it fetch anywhere" check reported `setInterval(updateClock,
    // 1000)` in a large file. The check is local to the interval now.
    expect(findings(`setInterval(updateClock, 1000)`, 'polling')).toEqual([])
    expect(findings(`fetch('/a')\nsetInterval(updateClock, 1000)`, 'polling')).toEqual([])
  })

  it('flags a hand-held debounce timer, but only with a setTimeout to match', () => {
    expect(findings(`let t\nt = setTimeout(go, 300)\nclearTimeout(t)`, 'debounce')).toHaveLength(1)
    expect(findings(`clearTimeout(someHandleFromElsewhere)`, 'debounce')).toEqual([])
  })

  it('flags a document-level click listener', () => {
    expect(findings(`document.addEventListener('click', close)`, 'click-outside')).toHaveLength(1)
  })

  it('flags focus by query', () => {
    expect(findings(`document.getElementById('name').focus()`, 'focus')).toHaveLength(1)
  })

  it('flags clipboard and share', () => {
    expect(findings(`navigator.clipboard.writeText(x)`, 'clipboard')).toHaveLength(1)
    expect(findings(`navigator.share({ url })`, 'clipboard')).toHaveLength(1)
  })

  it('flags the void-touch watcher hack', () => {
    const src = `effect(() => { void a(); void b(); recompute() })`
    expect(findings(src, 'watch')).toHaveLength(1)
  })

  it('reports adoption suggestions separately from declined rewrites', () => {
    // A rewrite that was declined needs a decision; a report-only hit is a
    // suggestion. Rolling them together made every finding look like a chore.
    const out = formatCodemodFindings(codemodSource(
      `function f() { if (confirm('x')) go() }\nnavigator.clipboard.writeText(y)`,
    ).findings, false)

    expect(out).toContain('Needs a human')
    expect(out).toContain('An stx primitive already covers this')
  })
})
