/**
 * `aria-selected:` (and pressed, checked, expanded) and `divide-*` on a
 * native host. The web reads both from selectors a phone has no equivalent
 * of - an attribute selector and a sibling selector - so the host applies
 * them: a state layer while the node's attribute is "true", and the divider
 * as the leading border of every child shown after the first.
 */
import { afterEach, describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { compileNativeScreen, mountNativeScreen, unmountAllNativeScreens } from '../../src/native/testing'

afterEach(unmountAllNativeScreens)

describe('compileClassStyles', () => {
  it('keeps ARIA state variants as layers, with their dark half', () => {
    const compiled = compileClassStyles('px-4 aria-selected:bg-white dark:aria-selected:bg-[#636366] aria-pressed:font-semibold aria-expanded:opacity-100')
    expect(compiled.unknown).toEqual([])
    expect(compiled.style).toEqual({ paddingHorizontal: 16 })
    expect(compiled.states!['aria-selected']).toEqual({ style: { backgroundColor: '#ffffff' }, dark: { backgroundColor: '#636366' } })
    expect(compiled.states!['aria-pressed']!.style).toEqual({ fontWeight: '600' })
    expect(compiled.states!['aria-expanded']!.style).toEqual({ opacity: 1 })
  })

  it('reads divide-* as the border a later child draws', () => {
    expect(compileClassStyles('divide-y divide-[#c6c6c8] dark:divide-[#38383a]').divide).toEqual({ style: { borderTopWidth: 1, borderColor: '#c6c6c8' }, dark: { borderColor: '#38383a' } })
    expect(compileClassStyles('divide-x-2').divide).toEqual({ style: { borderLeftWidth: 2 } })
    expect(compileClassStyles('divide-y-[0.5px] divide-y-reverse').divide).toEqual({ style: { borderTopWidth: 0.5 } })
    const roles = compileClassStyles('divide-y divide-line')
    expect(roles.unknown).toEqual([])
    expect(roles.divide!.style.borderColor).toBeDefined()
    expect(roles.style).toEqual({})
  })
})

describe.each(['ios', 'android'] as const)('state layers and dividers on %s', (platform) => {
  it.each([false, true])('follow the attribute and the children (minify=%s)', async (minify) => {
    const { code } = await compileNativeScreen(`<script client>
const chosen = state('a')
const rows = state(['one', 'two', 'three'])
const lead = state(true)
window.probe = { chosen, rows, lead }
</script>
<section>
  <div role="tablist">
    <button testID="a" role="tab" :aria-selected="chosen() === 'a' ? 'true' : 'false'" @click="chosen.set('a')" class="px-3 aria-selected:bg-[#ffffff] dark:aria-selected:bg-[#636366]">A</button>
    <button testID="b" role="tab" :aria-selected="chosen() === 'b' ? 'true' : 'false'" @click="chosen.set('b')" class="px-3 aria-selected:bg-[#ffffff] dark:aria-selected:bg-[#636366]">B</button>
  </div>
  <ul testID="list" class="divide-y divide-[#c6c6c8] dark:divide-[#38383a]">
    <li :if="lead()" testID="lead">Lead</li>
    <li :for="row in rows()" :key="row" :testID="row" :text="row"></li>
  </ul>
</section>`, { minify })
    const phone = mountNativeScreen(code, 'Screen', { platform })
    await phone.settle()
    const a = phone.byTestID('a')!
    const b = phone.byTestID('b')!
    expect(a.style.backgroundColor).toBe('#ffffff')
    expect(b.style.backgroundColor ?? null).toBeNull()
    phone.press(b)
    await phone.settle()
    expect(b.style.backgroundColor).toBe('#ffffff')
    expect(a.style.backgroundColor ?? null).toBeNull()
    phone.appearance('dark')
    await phone.settle()
    expect(b.style.backgroundColor).toBe('#636366')
    phone.appearance('light')
    await phone.settle()

    const borders = () => ['lead', 'one', 'two', 'three'].map(id => phone.byTestID(id)).filter(node => node && node.style.display !== 'none').map(node => node!.style.borderTopWidth ?? 0)
    expect(borders()).toEqual([0, 1, 1, 1])
    expect(phone.byTestID('one')!.style.borderColor).toBe('#c6c6c8')

    phone.context.probe.lead.set(false)
    await phone.settle()
    expect(borders()).toEqual([0, 1, 1])

    phone.context.probe.rows.set(['zero', 'one', 'two', 'three'])
    await phone.settle()
    expect(phone.byTestID('zero')!.style.borderTopWidth ?? 0).toBe(0)
    expect(phone.byTestID('one')!.style.borderTopWidth).toBe(1)

    phone.appearance('dark')
    await phone.settle()
    expect(phone.byTestID('one')!.style.borderColor).toBe('#38383a')
    expect(phone.mutationErrors).toEqual([])
  })
})
