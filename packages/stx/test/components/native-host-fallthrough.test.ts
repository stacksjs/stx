import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
import type { STXNode } from '../../src/native/compiler/ir'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'

async function render(component: string, usage: string, native: boolean) {
  const root = createTempDir('stx-native-fallthrough-')
  await Bun.write(join(root, 'components/Control.stx'), component)
  return processDirectives(usage, { __stx_inject_css: false }, join(root, 'Screen.stx'), {
    ...defaultConfig, root, componentsDir: join(root, 'components'), cache: false, _nativeHostAttrs: native,
  }, new Set())
}

it('forwards unconsumed native host props and classes without requiring data-native', async () => {
  const html = await render('<button data-class="keep" class=bg-red-500><slot /></button>',
    '<Control testID="save" accessibilityLabel="Save changes" :enabled="false" class="text-[15px]">Save</Control>', true)
  expect(html).toContain('data-class="keep"')
  expect(html).toContain('class="bg-red-500 text-[15px]"')
  const { root } = await translateHtmlToIR(html)
  expect(root.type).toBe('Button')
  expect(root.props).toMatchObject({ testID: 'save', accessibilityLabel: 'Save changes', enabled: false })
  expect(root.style).toMatchObject({ fontSize: 15, backgroundColor: '#ef4444' })
})

it('keeps consumed API props private and does not append a consumed class twice', async () => {
  const html = await render(`<script server>
const variant = $props.variant
const classes = $props.class
</script><button class="{{ classes }}">{{ variant }}</button>`,
  '<Control variant="primary" testID="save" class="p-4" />', true)
  expect(html).toContain('class="p-4"')
  expect(html).not.toContain('variant="primary"')
  expect(html).not.toContain('p-4 p-4')
  expect((await translateHtmlToIR(html)).root.props.testID).toBe('save')
})

it('does not broaden ordinary browser attribute forwarding', async () => {
  const html = await render('<button><slot /></button>', '<Control testID="native-only" id="web" data-extra="yes">Save</Control>', false)
  expect(html).not.toContain('testID="native-only"')
  expect(html).toContain('id="web"')
  expect(html).toContain('data-extra="yes"')
})

it('forwards native attributes to an explicitly designated physical control, not its layout wrapper', async () => {
  const component = '<div data-layout="yes"><input type="hidden" /><button data-stx-native-host-root class="p-2">Save</button></div>'
  const html = await render(component, '<Control testID="save" accessibilityLabel="Save changes" class="text-[15px]" />', true)
  const { root } = await translateHtmlToIR(html)
  expect(root.props.testID).toBeUndefined()
  const control = root.children.find(child => typeof child !== 'string' && child.type === 'Button')
  expect(control).toMatchObject({ props: { testID: 'save', accessibilityLabel: 'Save changes' }, style: { fontSize: 15, padding: 8 } })
  const browser = await render(component, '<Control id="web" />', false)
  expect(browser).toMatch(/<div[^>]*id="web"/)
})

it('does not select markers in comments, quoted attributes, raw scripts or nested component scopes', async () => {
  const html = await render(`<div title="data-stx-native-host-root > not an attribute">
<!-- <button data-stx-native-host-root>wrong</button> -->
<script>const example = '<button data-stx-native-host-root>wrong</button>'</script>
<div data-stx-component-wrapper><button data-stx-native-host-root>Nested</button></div>
<button data-stx-native-host-root title="a > b">Owned</button>
</div>`, '<Control testID="owned" />', true)
  const { root } = await translateHtmlToIR(html)
  // The component's script gives it a scope boundary on a native compile,
  // which may wrap its root: look through the tree, not just its children.
  const nodes = (node: STXNode): STXNode[] => [node, ...node.children.flatMap(child => typeof child === 'string' ? [] : nodes(child))]
  expect(nodes(root).filter(node => node.props.testID !== undefined).map(node => node.props.title)).toEqual(['a > b'])
  const nested = nodes(root).find(node => node.type === 'Button' && node.children.includes('Nested'))
  expect(nested?.props.testID).toBeUndefined()
  const owned = nodes(root).find(node => node.type === 'Button' && node.props.title === 'a > b')
  expect(owned).toMatchObject({ props: { testID: 'owned', title: 'a > b' } })
  const onlyNested = await render('<div><div data-stx-component-wrapper><button data-stx-native-host-root>Nested</button></div></div>',
    '<Control testID="outer" />', true)
  expect((await translateHtmlToIR(onlyNested)).root.props.testID).toBe('outer')
})

it('does not let a stateless child target capture its parent attributes', async () => {
  const root = createTempDir('stx-native-target-owner-')
  await Bun.write(join(root, 'components/Child.stx'), '<div><button data-stx-native-host-root>Child</button></div>')
  await Bun.write(join(root, 'components/Parent.stx'), '<section><Child testID="child" /></section>')
  const html = await processDirectives('<Parent testID="parent" />', { __stx_inject_css: false }, join(root, 'Screen.stx'), {
    ...defaultConfig, root, componentsDir: join(root, 'components'), cache: false, _nativeHostAttrs: true,
  }, new Set())
  const tree = (await translateHtmlToIR(html)).root
  expect(tree.props.testID).toBe('parent')
  const child = tree.children[0]
  expect(typeof child).not.toBe('string')
  if (typeof child === 'string') throw new Error('Expected child wrapper')
  expect(child.props.testID).toBeUndefined()
  expect(child.children[0]).toMatchObject({ props: { testID: 'child' } })
})
