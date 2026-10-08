/**
 * The compile-time manifest finds exactly the bindings the runtime finds by
 * walking (stacksjs/stx#1984).
 *
 * `processElement` discovers its work at hydration: recurse over childNodes,
 * read every element's attributes, dispatch on the names. A native host has no
 * attributes to read and no selector to match, and the answer was already known
 * on the server -- so the plan is to compute it once, there.
 *
 * That only holds if the two agree. They classify attributes in different
 * languages (a generated runtime string, and TypeScript), which is exactly the
 * setup where two implementations drift and the symptom is a binding that
 * silently never binds. So this compares them directly, on the one observable
 * the runtime already provides: it REMOVES each directive attribute as it binds
 * it, so whatever is missing afterwards is what it consumed.
 */
import { beforeEach, describe, expect, it } from 'bun:test'
import { extractBindingManifest, classifyAttribute } from '../../src/binding-manifest'
import { generateSignalsRuntimeDev } from '../../src/signals'
import { installNodeConstants, shimAttributes } from '../../test-utils/dom-runtime-shim'

// eslint-disable-next-line ts/no-explicit-any
declare const window: any
// eslint-disable-next-line ts/no-explicit-any
declare const document: any

const settle = (): Promise<void> => new Promise(resolve => setTimeout(resolve, 40))

/** Attribute names, across both shapes this DOM exposes them in. */
// eslint-disable-next-line ts/no-explicit-any
function attrNames(el: any): string[] {
  return Array.from(el.attributes ?? []).map((a: any) => (Array.isArray(a) ? a[0] : a.name))
}

let booted = 0

/** Hydrate markup and report, per element, which attributes the runtime consumed. */
async function consumedByRuntime(
  markup: string,
  scope: Record<string, unknown>,
  atAttrs: Record<string, [string, string][]> = {},
): Promise<Map<string, string[]>> {
  const name = `manifest_${++booted}`
  window[`__stx_setup_${name}`] = () => scope
  document.body.innerHTML = `<main data-stx="__stx_setup_${name}">${markup}</main>`

  // very-happy-dom's parser stops at an `@` name, so those are attached here.
  for (const [key, pairs] of Object.entries(atAttrs)) {
    const el = document.querySelector(`[data-k="${key}"]`)
    for (const [n, v] of pairs) el?.setAttribute(n, v)
  }

  const before = new Map<string, string[]>()
  for (const el of Array.from(document.querySelectorAll('[data-k]')) as any[])
    before.set(el.getAttribute('data-k'), attrNames(el))

  shimAttributes(document.body)
  document.dispatchEvent(new window.Event('DOMContentLoaded'))
  await settle()

  const consumed = new Map<string, string[]>()
  for (const [key, names] of before) {
    const el = document.querySelector(`[data-k="${key}"]`)
    const after = el ? attrNames(el) : []
    consumed.set(key, names.filter(n => !after.includes(n)).sort())
  }
  return consumed
}

/** What the manifest says, keyed the same way. */
function manifestByKey(markup: string): Map<string, string[]> {
  const { manifest } = extractBindingManifest(`<main>${markup}</main>`)
  const out = new Map<string, string[]>()
  for (const entry of manifest.entries) {
    const key = entry.bindings.find(b => b.name === 'data-k')?.value
      ?? (markup.match(new RegExp(`data-k="([^"]+)"[^>]*${MANIFEST_MARK}="${entry.id}"`)) || [])[1]
    out.set(key ?? String(entry.id), entry.bindings.map(b => b.name).sort())
  }
  return out
}
const MANIFEST_MARK = 'data-stx-b'

describe('the manifest agrees with what the runtime consumes', () => {
  beforeEach(() => {
    installNodeConstants()
    globalThis.MutationObserver = window.MutationObserver
    // eslint-disable-next-line no-new-func
    new Function(generateSignalsRuntimeDev())()
  })

  it('finds the same bindings on a mixed tree', async () => {
    const markup
      = '<p data-k="text" :text="label"></p>'
      + '<div data-k="show" :show="open"></div>'
      + '<div data-k="cls" x-class="cls"></div>'
      + '<img data-k="src" x-src="u">'
      + '<div data-k="attr" :title="label"></div>'
      + '<div data-k="html" :html="raw"></div>'

    const consumed = await consumedByRuntime(markup, {
      label: window.stx.state('L'),
      open: window.stx.state(true),
      cls: window.stx.state('c'),
      u: window.stx.state('/x.png'),
      raw: window.stx.state('<b>r</b>'),
    })

    // Every element the runtime took something from is in the manifest, with
    // the same attribute names.
    const { manifest } = extractBindingManifest(`<main>${markup}</main>`)
    const fromManifest = manifest.entries.flatMap(e => e.bindings.map(b => b.name)).sort()
    const fromRuntime = [...consumed.values()].flat().filter(Boolean).sort()

    expect(fromManifest).toEqual(fromRuntime)
  })

  it('finds event bindings, which the runtime also consumes', async () => {
    const markup = '<button data-k="btn">go</button>'
    const consumed = await consumedByRuntime(markup, { go: () => {} }, { btn: [['@click', 'go()']] })
    expect(consumed.get('btn')).toEqual(['@click'])

    const { manifest } = extractBindingManifest('<main><button @click="go()">go</button></main>')
    expect(manifest.entries[0].bindings.map(b => b.name)).toEqual(['@click'])
  })

  it('records no binding for an escaped :: attribute', async () => {
    const markup = '<div data-k="esc" ::literal="kept"></div>'
    const { manifest } = extractBindingManifest(`<main>${markup}</main>`)
    expect(manifest.entries).toEqual([])

    // The runtime agrees it is not a binding, and it now renders the escaped
    // attribute: `::literal` is replaced by a literal `:literal`, the way
    // `@@if` renders `@if`. It used to be swallowed by the event catch-all --
    // a name starting with two colons starts with one -- which bound an event
    // named `:literal` and removed the attribute, so the author got neither a
    // binding nor their attribute. `escaped-colon-attr.test.ts` owns that
    // behaviour; this file only cares that the manifest and the runtime agree
    // it is not a binding.
    const consumed = await consumedByRuntime(markup, {})
    expect(consumed.get('esc')).toEqual(['::literal'])
  })

  it('marks a :for element as a template, since its rows do not exist yet', () => {
    const { manifest } = extractBindingManifest(
      '<ul><li :for="row in rows" :key="row.id" :text="row.name"></li></ul>',
    )
    expect(manifest.entries).toHaveLength(1)
    expect(manifest.entries[0].template).toBe(true)
    // The row template's own bindings are recorded; each clone binds from them.
    expect(manifest.entries[0].bindings.map(b => b.kind).sort()).toEqual(['attr', 'for', 'text'])
  })

  it('stamps an id the runtime can resolve without searching the tree', () => {
    const { html, manifest } = extractBindingManifest('<p :text="a"></p><p :text="b"></p>')
    expect(manifest.entries.map(e => e.id)).toEqual([0, 1])
    expect(html).toContain('data-stx-b="0"')
    expect(html).toContain('data-stx-b="1"')
  })
})

describe('classifyAttribute', () => {
  it('routes each directive to the binder that consumes it', () => {
    expect(classifyAttribute(':text')).toBe('text')
    expect(classifyAttribute('x-text')).toBe('text')
    expect(classifyAttribute(':show')).toBe('show')
    expect(classifyAttribute(':if')).toBe('if')
    expect(classifyAttribute(':for')).toBe('for')
    expect(classifyAttribute('@click')).toBe('event')
    expect(classifyAttribute('@click.stop')).toBe('event')
    expect(classifyAttribute(':title')).toBe('attr')
    expect(classifyAttribute('x-src')).toBe('attr')
    expect(classifyAttribute('x-bind:href')).toBe('attr')
    expect(classifyAttribute('ref')).toBe('ref')
  })

  it('is not fooled by what only looks like a binding', () => {
    expect(classifyAttribute('::literal')).toBeNull()
    expect(classifyAttribute('class')).toBeNull()
    expect(classifyAttribute('data-k')).toBeNull()
    expect(classifyAttribute('x-cloak')).toBeNull()
  })
})
