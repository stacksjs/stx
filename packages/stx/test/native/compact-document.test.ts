import { describe, expect, it } from 'bun:test'
import { compactDocument, compactManifest, expandDocument, expandManifest, kindOfBindingName } from '../../src/native/runtime/compact-document'
import { compileScreenSource } from '../../src/native/compiler/render-screen'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

describe('compact route documents', () => {
  it('leaves out the empty fields and restores each one a node had, and only those', () => {
    const document = {
      version: '1.0.0',
      root: {
        type: 'View', props: {}, style: { flex: 1 }, events: {}, children: [
          'text',
          { type: 'Text', props: { hidden: '' }, style: {}, events: {}, children: [], _inlineStyle: {}, _styleSource: '' },
          { type: 'View', props: {}, style: {}, events: { onPress: 'go' }, children: [], _inlineStyle: { color: 'red' }, _styleSource: 'color: red' },
          { type: 'Image', props: {}, children: [] },
        ],
      },
      script: { exports: {}, functions: [], code: '' },
      meta: { source: 'screen.stx', compiledAt: 0 },
    } as any
    const compact = compactDocument(clone(document))
    expect(JSON.stringify(compact).length).toBeLessThan(JSON.stringify(document).length)
    expect(JSON.stringify(compact)).not.toContain('"events":{}')
    expect(expandDocument(clone(compact))).toEqual(document)
    // Each node is given objects of its own: the host changes them.
    const expanded = expandDocument(clone(compact)) as any
    expect(expanded.root.children[1].style).not.toBe(expanded.root.children[2].style)
  })

  it('goes as it is when a node already uses the absent-fields key', () => {
    expect(compactDocument({ root: { type: 'View', props: {}, style: {}, events: {}, children: [], '~': 1 } } as any)).toBeNull()
  })

  it('writes a binding as its name and value when its name gives its kind', () => {
    const manifest = {
      entries: [
        { id: 0, bindings: [{ name: ':if', value: 'open', kind: 'if' }, { name: '@click.stop', value: 'go()', kind: 'event' }] },
        { id: 3, template: true, bindings: [{ name: ':for', value: 'row in rows', kind: 'for' }, { name: 'x-href', value: 'url', kind: 'attr' }] },
        { id: 4, bindings: [{ name: 'x-text', value: 'label', kind: 'text' }, { name: ':disabled', value: '', kind: 'attr' }] },
      ],
    } as any
    const compact = compactManifest(clone(manifest)) as any[]
    expect(compact[2][1][0]).toEqual(['x-text', 'label', 'text'])
    expect(compact[0][1][0]).toEqual([':if', 'open'])
    expect(expandManifest(clone(compact))).toEqual(manifest)
    expect(kindOfBindingName(':class')).toBe('class')
    expect(compactManifest({ entries: [{ id: 0, bindings: [{ name: ':if', value: 'a', kind: 'if', extra: 1 }] }] } as any)).toBeNull()
  })

  it('round-trips a compiled screen', async () => {
    const { document, manifest } = await compileScreenSource(`<script client>const open = state(false); const rows = state([1, 2])</script>
<main class="p-4"><p :if="open" class="text-red-600">{{ open ? 'Open' : 'Shut' }}</p><button @click="open.set(!open())" :disabled="!rows().length">Toggle</button><ul><li :for="row in rows()" :key="row" :text="row"></li></ul></main>`, '/tmp/compact-screen.stx')
    expect(expandDocument(clone(compactDocument(document)))).toEqual(clone(document))
    expect(expandManifest(clone(compactManifest(manifest)))).toEqual(clone(manifest))
  })
})
