import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'
import type { NativeMutationOperation } from '../../src/native/bridge/protocol'
import { projectAccessibility } from '../../src/native/accessibility'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { createDocument } from '../../src/native/compiler/ir'
import { materializeNativeBindingTree } from '../../src/native/runtime/binding-tree'
import { createNativeHost } from '../../src/native/runtime/native-host'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('projects static ARIA fields without converting false or mixed into true', async () => {
  const { root } = await translateHtmlToIR('<button role="switch" aria-label="Alerts" aria-checked="false" aria-disabled="true" aria-valuetext="Off"><span>Toggle</span></button>')
  expect(root.props).toMatchObject({
    accessibilityLabel: 'Alerts',
    accessibilityRole: 'switch',
    accessibilityState: { checked: false, disabled: true },
    accessibilityValue: 'Off',
  })
  expect(root._accessibilitySource).toEqual({})
  expect(projectAccessibility({ 'aria-checked': 'mixed', 'aria-selected': 'false', 'aria-hidden': true })).toEqual({
    accessibilityState: { checked: 'mixed', selected: false },
  })
})

it('retains explicit native overrides and clears removed ARIA fields after adopting compiled IR', async () => {
  const { root } = await translateHtmlToIR(`<div role="switch" aria-label="Web label" aria-checked="true"
    accessibilityLabel="Native label" accessibilityState='{"disabled":true,"checked":false}'></div>`)
  const operations: NativeMutationOperation[] = []
  const host = createNativeHost({ send: batch => operations.push(...batch), schedule: () => {} })
  const node = host.adopt({ __stxId: 'control' }, root.type, null, root)
  expect(host.snapshot(node).props).toMatchObject({
    accessibilityLabel: 'Native label',
    accessibilityState: { checked: false, disabled: true },
  })
  host.setAttribute(node, 'aria-selected', true)
  expect(host.snapshot(node).props.accessibilityState).toEqual({ checked: false, disabled: true, selected: true })
  host.removeAttribute(node, 'accessibility-state')
  expect(host.snapshot(node).props.accessibilityState).toEqual({ checked: true, selected: true })
  host.removeAttribute(node, 'accessibility-label')
  expect(host.snapshot(node).props.accessibilityLabel).toBe('Web label')
  host.removeAttribute(node, 'aria-label')
  host.removeAttribute(node, 'role')
  host.removeAttribute(node, 'aria-checked')
  host.removeAttribute(node, 'aria-selected')
  host.flush()
  const updates = operations.filter(op => op.op === 'updateNode')
  expect(updates.length).toBeGreaterThan(0)
  expect(updates.at(-1)).toMatchObject({
    patch: { props: { accessibilityState: null } },
  })
  expect(updates.some(op => op.patch.props?.accessibilityLabel === null)).toBe(true)
  expect(updates.some(op => op.patch.props?.accessibilityRole === null)).toBe(true)
  expect(host.snapshot(node).props.accessibilityState).toBeUndefined()
  host.dispose()
})

it('does not expose generated native fields as authored binding attributes', async () => {
  const { root } = await translateHtmlToIR('<button aria-label="Original" accessibilityRole="switch">Toggle</button>')
  const host = createNativeHost({ send() {}, schedule() {} })
  const tree = materializeNativeBindingTree(createDocument(root, { exports: {}, functions: [], code: '' }), { entries: [] }, host)
  expect(host.getAttribute(tree.root, 'aria-label')).toBe('Original')
  expect(host.getAttribute(tree.root, 'accessibilityLabel')).toBeNull()
  expect(host.getAttribute(tree.root, 'accessibilityRole')).toBe('switch')
  host.setAttribute(tree.root, 'aria-label', 'Updated')
  expect(host.snapshot(tree.root).props.accessibilityLabel).toBe('Updated')
  host.dispose()
})

describe.each([false, true])('ARIA on native controls (minify=%s)', (minify) => {
  it('translates the actual shared Switch state and labels on newly cloned rows', async () => {
    const toggle = join(import.meta.dir, '../../../components/src/ui/switch/Switch.stx')
    const { code } = await compileNativeScreen(`@import('Switch', '${toggle}')
<script client>
const checked = state(false)
const rows = state([{ id: 1, label: 'First' }])
window.probe = { checked, rows }
</script><div><Switch :checked="checked" @change="checked.set($event)"/>
<button :for="row in rows" :key="row.id" :test-id="'row-' + row.id" :aria-label="row.label" role="switch" :aria-checked="checked"><span>Toggle</span></button></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      // The shared Switch is the platform switch natively, announced by its ARIA state.
      const toggle = phone.ofType('Switch')[0]!
      expect(toggle.props.accessibilityState).toMatchObject({ checked: false })
      phone.press(toggle, 'onValueChange', { value: true })
      await phone.settle()
      expect(toggle.props.accessibilityState).toMatchObject({ checked: true })
      expect(phone.byTestID('row-1')!.props.accessibilityState).toEqual({ checked: true })
      phone.context.probe.rows.set([{ id: 2, label: 'Second' }])
      await phone.settle()
      expect(phone.byTestID('row-2')!.props).toMatchObject({
        accessibilityLabel: 'Second', accessibilityRole: 'switch', accessibilityState: { checked: true },
      })
      phone.context.probe.checked.set(false)
      await phone.settle()
      expect(phone.byTestID('row-2')!.props.accessibilityState).toEqual({ checked: false })
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)

  it('projects initial, reactive, and recreated controls without losing explicit overrides', async () => {
    const { code } = await compileNativeScreen(`<script client>
const label = state('Alerts')
const checked = state(false)
const disabled = state(false)
const shown = state(true)
window.probe = { label, checked, disabled, shown }
</script><div><button :if="shown" testID="toggle" role="switch"
  :aria-label="label" :aria-checked="checked" :aria-disabled="disabled"
  accessibilityState='{"selected":true}'><span>Toggle</span></button></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      expect(phone.byTestID('toggle')!.props).toMatchObject({
        accessibilityLabel: 'Alerts', accessibilityRole: 'switch',
        accessibilityState: { checked: false, disabled: false, selected: true },
      })
      phone.context.probe.label.set('Notifications')
      phone.context.probe.checked.set(true)
      phone.context.probe.disabled.set(true)
      await phone.settle()
      expect(phone.byTestID('toggle')!.props).toMatchObject({
        accessibilityLabel: 'Notifications',
        accessibilityState: { checked: true, disabled: true, selected: true },
      })
      phone.context.probe.shown.set(false)
      await phone.settle()
      phone.context.probe.label.set('Recreated')
      phone.context.probe.checked.set(false)
      phone.context.probe.shown.set(true)
      await phone.settle()
      expect(phone.byTestID('toggle')!.props).toMatchObject({
        accessibilityLabel: 'Recreated',
        accessibilityState: { checked: false, disabled: true, selected: true },
      })
      phone.context.probe.label.set(null)
      await phone.settle()
      expect(phone.byTestID('toggle')!.props.accessibilityLabel).toBeNull()
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)
})
