import { expect, it } from 'bun:test'
import { join } from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'

// The screen the iOS gate runs as `--suite lists`, replayed against the
// protocol so an ordinary test run catches what the simulator would.
it.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('runs the shared lists acceptance screen (%s, minify=%s)', async (platform, minify) => {
  const root = join(import.meta.dir, '../../../..')
  const result = await compileSharedScreenBundle(join(import.meta.dir, 'fixtures/shared-lists-device.stx'), { root, minify })
  for (const file of ['grouped-list/GroupedList', 'grouped-list/GroupedListRow', 'mobile/SectionCard', 'mobile/ListRow', 'mobile/FilterChips', 'pager/Pager'])
    expect(result.dependencies).toContain(join(root, `packages/components/src/ui/${file}.stx`))

  const phone = mountNativeScreen(result.code, 'Screen', { platform })
  try {
    await phone.settle()
    // The pager is named on its scroller; the box around it and the box
    // around its dots are not, or a reader could not get inside them.
    const pager = phone.all().find(node => node.type === 'ScrollView' && node.props.pagingEnabled === true)!
    expect(pager.props.accessibilityLabel).toBe('Tour')
    expect(phone.all().filter(node => node.type === 'View' && node.props.accessibilityLabel !== undefined)).toEqual([])
    const chips = phone.all().filter(node => node.props['data-stx-filter-chip'] !== undefined)
    expect(chips.map(node => node.props.accessibilityState?.selected)).toEqual([true, false])
    // A row's title carries no template indentation.
    expect(phone.all().some(node => node.type === 'Text' && node.children.some(child => typeof child === 'string' && child !== child.trim()))).toBe(false)

    phone.press(phone.byTestID('list-profile')!)
    phone.press(pager, 'onPageSelected', { index: 1, count: 3 })
    await phone.settle()
    expect(phone.byTestID('list-summary')!.children).toEqual(['Opened: 1, page 2'])
    const dots = phone.all().filter(node => String(node.props.accessibilityLabel ?? '').startsWith('Go to page'))
    expect(dots.map(node => node.props.accessibilityState?.selected === true)).toEqual([false, true, false])
  }
  finally {
    phone.unmount()
  }
}, 30_000)
