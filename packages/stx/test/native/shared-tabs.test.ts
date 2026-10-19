import { describe, expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

describe.each([false, true])('shared Tabs (minify=%s)', (minify) => {
  it('keeps legacy prop-mode instances independent with unique panel associations', async () => {
    const root = createTempDir('stx-shared-prop-tabs-')
    mkdirSync(join(root, 'components'))
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(join(root, 'components/SharedTabs.stx'), Bun.file(join(import.meta.dir, '../../../components/src/ui/tabs/Tabs.stx')))
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script server>
const tabs = [{ label: 'One', content: '<p>One</p>' }, { label: 'Two', content: '<p>Two</p>' }]
</script><div><SharedTabs :tabs="tabs" /><SharedTabs :tabs="tabs" defaultTab="1" /></div>`)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    const tabs = () => phone.ofType('Button').filter(node => node.props.role === 'tab')
    const panels = () => phone.all().filter(node => node.props.role === 'tabpanel')
    expect(tabs()).toHaveLength(4)
    expect(panels()).toHaveLength(4)
    expect(new Set(tabs().map(node => node.props.id)).size).toBe(4)
    expect(new Set(panels().map(node => node.props.id)).size).toBe(4)
    for (const tab of tabs()) {
      const panel = panels().find(node => node.props.id === tab.props['aria-controls'])
      expect(panel).toBeTruthy()
      expect(panel!.props['aria-labelledby']).toBe(tab.props.id)
    }
    expect(panels().map(node => node.style.display === 'none')).toEqual([false, true, true, false])
    phone.press(tabs()[1]!)
    await phone.settle()
    expect(panels().map(node => node.style.display === 'none')).toEqual([true, false, true, false])
    phone.press(tabs()[2]!)
    await phone.settle()
    expect(panels().map(node => node.style.display === 'none')).toEqual([true, false, false, true])
    expect(errors).toEqual([])
  }, 30_000)

  it('selects panels, isolates nested tabs, and retains selection and panel state as children change', async () => {
    const root = createTempDir('stx-shared-tabs-')
    mkdirSync(join(root, 'components'))
    await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
    for (const name of ['Tabs', 'TabPanel'])
      await Bun.write(join(root, 'components', `Shared${name}.stx`), Bun.file(join(import.meta.dir, '../../../components/src/ui/tabs', `${name}.stx`)))
    const file = join(root, 'Screen.stx')
    await Bun.write(file, `<script client>
const first = state(true)
const extra = state(false)
const present = state(true)
const note = state('Draft')
window.probe = { first, extra, present, note }
</script><div><SharedTabs :if="present">
  <SharedTabPanel :if="first" label="One"><p>First content</p></SharedTabPanel>
  <SharedTabPanel label="Two">
    <input testID="note" x-model="note" />
    <SharedTabs><SharedTabPanel label="Inner A">A</SharedTabPanel><SharedTabPanel label="Inner B">B</SharedTabPanel></SharedTabs>
  </SharedTabPanel>
  <SharedTabPanel :if="extra" label="Three"><p>Third content</p></SharedTabPanel>
</SharedTabs></div>`)
    const { code } = await compileSharedScreenBundle(file, { root, minify })
    const errors: unknown[][] = []
    const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
    await phone.settle()
    const panel = (label: string) => {
      const node = phone.all().find(node => node.props['data-label'] === label)
      expect(node, `panel ${label}`).toBeTruthy()
      return node!
    }
    const tab = (label: string) => {
      const node = phone.ofType('Button').find(node => node.props['aria-controls'] === panel(label).props.id)
      expect(node, `tab ${label}`).toBeTruthy()
      return node!
    }
    expect(phone.ofType('Button').filter(node => node.props.role === 'tab')).toHaveLength(4)
    expect(tab('One').props['aria-selected']).toBe('true')
    expect(panel('One').style.display).not.toBe('none')
    expect(panel('Two').style.display).toBe('none')
    phone.press(tab('Two'))
    await phone.settle()
    expect(panel('One').style.display).toBe('none')
    expect(panel('Two').style.display).not.toBe('none')
    phone.type(phone.byTestID('note')!, 'Saved draft')
    phone.press(tab('Inner B'))
    await phone.settle()
    expect(tab('Two').props['aria-selected']).toBe('true')
    expect(tab('Inner B').props['aria-selected']).toBe('true')
    const selectedId = tab('Two').id
    const inputId = phone.byTestID('note')!.id
    phone.context.probe.extra.set(true)
    await phone.settle()
    expect(tab('Two').id).toBe(selectedId)
    expect(tab('Three').props['aria-selected']).toBe('false')
    phone.context.probe.first.set(false)
    await phone.settle()
    expect(tab('Two').id).toBe(selectedId)
    expect(tab('Two').props['aria-selected']).toBe('true')
    expect(panel('Two').style.display).not.toBe('none')
    expect(phone.byTestID('note')!.id).toBe(inputId)
    expect(phone.byTestID('note')!.props.value).toBe('Saved draft')
    phone.press(tab('Three'))
    await phone.settle()
    phone.context.probe.extra.set(false)
    await phone.settle()
    expect(tab('Two').props['aria-selected']).toBe('true')
    expect(panel('Two').style.display).not.toBe('none')
    expect(phone.context.probe.note()).toBe('Saved draft')
    phone.context.probe.present.set(false)
    await phone.settle()
    expect(phone.ofType('Button').filter(node => node.props.role === 'tab')).toHaveLength(0)
    phone.context.probe.present.set(true)
    await phone.settle()
    expect(tab('Two').props['aria-selected']).toBe('true')
    phone.unmount()
    expect(errors).toEqual([])
  }, 30_000)
})
