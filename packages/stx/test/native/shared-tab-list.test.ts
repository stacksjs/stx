import { expect, it } from 'bun:test'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

it('selects shared tabs and preserves selection when their children change (#2089)', async () => {
  const root = createTempDir('stx-shared-tab-list-')
  mkdirSync(join(root, 'components'))
  await Bun.write(join(root, 'stx.config.ts'), 'export default {}')
  for (const name of ['TabList', 'Tab']) {
    await Bun.write(join(root, 'components', `Shared${name}.stx`), Bun.file(join(import.meta.dir, '../../../components/src/ui/tabs', `${name}.stx`)))
  }
  const file = join(root, 'Screen.stx')
  await Bun.write(file, `<script client>
const selected = state('one')
const extra = state(false)
window.selected = selected
window.extra = extra
</script><div>
  <SharedTabList v-model:value="selected">
    <SharedTab value="one">One</SharedTab>
    <SharedTab value="two">Two</SharedTab>
    <SharedTab value="disabled" disabled>Disabled</SharedTab>
    <button :if="extra" type="button" role="tab" data-value="three">Three</button>
    <div role="tablist"><button type="button" role="tab" data-value="nested" aria-selected="false">Nested</button></div>
  </SharedTabList>
  <p :show="selected === 'one'">First panel</p>
  <p :show="selected === 'two'">Second panel</p>
</div>`)
  const { code } = await compileSharedScreenBundle(file, { root })
  const errors: unknown[][] = []
  const phone = mountNativeScreen(code, 'Screen', { globals: { console: { ...console, error: (...args: unknown[]) => errors.push(args) } } })
  await phone.settle()
  const tab = (value: string) => {
    const found = phone.ofType('Button').find(node => node.props['data-value'] === value)
    expect(found).toBeTruthy()
    return found!
  }
  expect(tab('one').props['aria-selected']).toBe('true')
  const panel = (text: string) => {
    const found = phone.all().find(node => node.children.includes(text))
    expect(found).toBeTruthy()
    return found!
  }
  expect(panel('First panel').style.display).not.toBe('none')
  expect(panel('Second panel').style.display).toBe('none')
  phone.press(tab('two'))
  await phone.settle()
  expect(phone.context.selected()).toBe('two')
  expect(tab('two').props['aria-selected']).toBe('true')
  expect(tab('one').props['aria-selected']).toBe('false')
  expect(panel('First panel').style.display).toBe('none')
  expect(panel('Second panel').style.display).not.toBe('none')
  phone.press(tab('disabled'))
  phone.press(tab('nested'))
  await phone.settle()
  expect(phone.context.selected()).toBe('two')
  phone.context.extra.set(true)
  await phone.settle()
  expect(tab('three').props.tabindex).toBe('-1')
  expect(tab('two').props['aria-selected']).toBe('true')
  phone.press(tab('three'))
  await phone.settle()
  expect(phone.context.selected()).toBe('three')
  phone.context.extra.set(false)
  await phone.settle()
  expect(tab('one').props.tabindex).toBe('0')
  expect(phone.context.selected()).toBe('three')
  expect(errors).toEqual([])
}, 30_000)
