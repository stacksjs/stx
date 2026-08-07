/**
 * Codemods for adopting stx primitives an app hand-rolled around (#1843).
 *
 * The issue proposes both rewrites as "mechanical and safe". The tests that
 * matter here are the ones proving they are not, and that the tool refuses
 * rather than guessing.
 */
import { describe, expect, it } from 'bun:test'
import { codemodSource } from '../src/codemod'

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
