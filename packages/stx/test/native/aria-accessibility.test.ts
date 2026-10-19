/**
 * HTML accessibility attributes reaching a native host in its own spelling.
 *
 * Craft's iOS and Android renderers read `accessibilityRole`,
 * `accessibilityLabel`, `accessibilityValue` and `accessibilityState`. The
 * translator used to pass `role` and `aria-*` through under their HTML names,
 * which neither host reads, so a shared control that was correct on the web
 * said nothing about its state on a phone.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { accessibilityPatch, applyStaticAccessibility } from '../../src/native/accessibility'
import { translateHtmlToIR } from '../../src/native/compiler/html-to-ir'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

afterEach(unmountAllNativeScreens)

it.each([false, true])('leaves touchable role inference to the host while preserving authored roles (minify=%s)', async (minify) => {
  const controls = ['Pressable', 'TouchableOpacity', 'TouchableHighlight']
  const { code } = await compileNativeScreen(`<script client>
const destination = state('/details')
</script><View>${controls.map(type => `<${type} testID="${type}" :href="destination"><Text>Open</Text></${type}><${type} testID="${type}-authored" href="/details" accessibilityRole="button"><Text>Authored button</Text></${type}>`).join('')}<Button testID="clear" @click="destination.set(null)">Clear destination</Button></View>`, { minify })
  const phone = mountNativeScreen(code, 'Screen')
  await phone.settle()
  for (const type of controls) {
    expect(phone.byTestID(type)!.props.href).toBe('/details')
    expect(phone.byTestID(type)!.props.role).toBeUndefined()
    expect(phone.byTestID(type)!.props.accessibilityRole).toBeUndefined()
    expect(phone.byTestID(`${type}-authored`)!.props.accessibilityRole).toBe('button')
  }
  phone.press(phone.byTestID('clear')!)
  await phone.settle()
  for (const type of controls) {
    expect(phone.byTestID(type)!.props.href).toBeNull()
    expect(phone.byTestID(type)!.props.accessibilityRole).toBeUndefined()
  }
})

describe('static ARIA in the compiled tree', () => {
  it('labels, roles and states a composed button', async () => {
    const { root } = await translateHtmlToIR('<div role="group" aria-label="Filter"><button type="button" role="tab" aria-selected="true" aria-label="All clubs"><span>All</span></button></div>')
    expect(root.props.accessibilityLabel).toBe('Filter')
    // A container role is not announced: Android reads the role aloud.
    expect(root.props.accessibilityRole).toBeUndefined()
    const button = root.children[0] as any
    expect(button.type).toBe('Pressable')
    expect(button.props).toMatchObject({ accessibilityRole: 'tab', accessibilityLabel: 'All clubs', accessibilityState: { selected: true } })
    // The HTML spelling stays, for a component that reads its own state back.
    expect(button.props['aria-selected']).toBe(true)
  })

  it('maps toggle, check, disabled, expanded, busy and value text', () => {
    const props: Record<string, unknown> = {
      'aria-pressed': 'false',
      'aria-checked': 'mixed',
      'aria-disabled': true,
      'aria-expanded': '',
      'aria-busy': 'undefined',
      'aria-valuetext': '3 of 5',
    }
    applyStaticAccessibility(props)
    expect(props.accessibilityState).toEqual({ selected: false, checked: 'mixed', disabled: true, expanded: true })
    expect(props.accessibilityValue).toBe('3 of 5')
  })

  it('keeps an authored native spelling over the ARIA one, key by key', () => {
    const props: Record<string, unknown> = {
      'accessibilityLabel': 'Authored',
      'aria-label': 'From ARIA',
      'accessibilityState': { selected: false },
      'aria-selected': 'true',
      'aria-disabled': 'true',
    }
    applyStaticAccessibility(props)
    expect(props.accessibilityLabel).toBe('Authored')
    expect(props.accessibilityState).toEqual({ selected: false, disabled: true })
  })

  it('takes the first role a host understands from a fallback list', () => {
    expect(accessibilityPatch('role', 'switch checkbox', {})).toEqual({ accessibilityRole: 'switch' })
    expect(accessibilityPatch('role', 'img', {})).toEqual({ accessibilityRole: 'image' })
    expect(accessibilityPatch('role', 'presentation', {})).toEqual({ accessibilityRole: 'none' })
    expect(accessibilityPatch('role', 'radiogroup', {})).toEqual({ accessibilityRole: null })
  })
})

describe('bound ARIA on a running screen', () => {
  it('moves the selected state with the choice, and clears it when the attribute goes', async () => {
    const { code } = await compileNativeScreen(`<script client>
const chosen = state('all')
const busy = state(true)
</script>
<div role="group" aria-label="Show">
  <button type="button" testID="all" :aria-pressed="chosen() === 'all' ? 'true' : 'false'" @click="chosen.set('all')"><span>All</span></button>
  <button type="button" testID="mine" :aria-pressed="chosen() === 'mine' ? 'true' : 'false'" @click="chosen.set('mine')"><span>Mine</span></button>
  <p testID="status" :aria-busy="busy() ? 'true' : null" :aria-label="busy() ? 'Loading' : null" @click="busy.set(false)">Clubs</p>
</div>`, { name: 'AriaProbe' })
    const phone = mountNativeScreen(code, 'AriaProbe')
    await phone.settle()
    const state = (id: string) => (phone.byTestID(id)?.props as any)?.accessibilityState
    expect(state('all')).toEqual({ selected: true })
    expect(state('mine')).toEqual({ selected: false })

    phone.press(phone.byTestID('mine')!)
    await phone.settle()
    expect(state('all')).toEqual({ selected: false })
    expect(state('mine')).toEqual({ selected: true })

    expect(state('status')).toEqual({ busy: true })
    expect((phone.byTestID('status')?.props as any)?.accessibilityLabel).toBe('Loading')
    phone.press(phone.byTestID('status')!)
    await phone.settle()
    expect(state('status') ?? null).toBeNull()
    expect((phone.byTestID('status')?.props as any)?.accessibilityLabel ?? null).toBeNull()
  })
})
