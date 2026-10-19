import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { defaultConfig } from '../../src/config'
import { processDirectives } from '../../src/process'
import { createTempDir } from '../../src/temp-dir'
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
