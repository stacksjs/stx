import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('translates arbitrary and directional border widths without consuming color utilities', () => {
  expect(compileClassStyles('border-[3px] border-x-[.25rem] border-t-[.5px] border-b-0')).toEqual({
    style: { borderWidth: 3, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 0.5, borderBottomWidth: 0 },
    unknown: [],
  })
  expect(compileClassStyles('border-y border-x-2 border-l-4').style)
    .toEqual({ borderTopWidth: 1, borderBottomWidth: 1, borderLeftWidth: 4, borderRightWidth: 2 })
  expect(compileClassStyles('border-[0] border-[#123456]').style).toEqual({ borderWidth: 0, borderColor: '#123456' })
  expect(compileClassStyles('border-2 dark:border-[.125rem]').dark).toEqual({ borderWidth: 2 })
})

it('reports malformed, negative, relative and non-finite widths instead of emitting invalid native numbers', () => {
  const unsupported = ['border-[-1px]', 'border-[1.2.3px]', 'border-t-[2junkpx]', 'border-[50%]',
    'border-x-[var(--width)]', 'border-[1e999px]', `border-${'9'.repeat(400)}`]
  const result = compileClassStyles(unsupported.join(' '))
  expect(result.style).toEqual({})
  expect(result.unknown).toEqual(unsupported)
})

describe.each([false, true])('reactive border widths (minify=%s)', (minify) => {
  it('updates axes and appearance overrides, then removes stale edge widths', async () => {
    const { code } = await compileNativeScreen(`<script client>
const classes = state('border-[3px] border-x-[.25rem] dark:border-[5px]')
const styles = state({})
window.probe = { classes, styles }
</script><div testID="border" :class="classes" :style="styles"></div>`, { minify })
    const phone = mountNativeScreen(code)
    try {
      await phone.settle()
      const style = () => phone.byTestID('border')!.style
      expect(style()).toMatchObject({ borderWidth: 3, borderLeftWidth: 4, borderRightWidth: 4 })
      phone.appearance('dark')
      await phone.settle()
      expect(style().borderWidth).toBe(5)
      phone.context.probe.styles.set({ borderWidth: 7 })
      await phone.settle()
      expect(style().borderWidth).toBe(7)
      phone.context.probe.classes.set('border-y-[2px]')
      phone.context.probe.styles.set({})
      await phone.settle()
      expect(style()).toMatchObject({ borderWidth: null, borderLeftWidth: null, borderRightWidth: null, borderTopWidth: 2, borderBottomWidth: 2 })
      phone.context.probe.classes.set('')
      await phone.settle()
      expect(style()).toMatchObject({ borderTopWidth: null, borderBottomWidth: null })
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  }, 30_000)
})
