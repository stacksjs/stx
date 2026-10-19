import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

describe('native translation utilities (#2090)', () => {
  it('composes numeric axes, replaces repeated axes, and handles negative lengths', () => {
    const result = compileClassStyles('translate-x-4 -translate-y-2 translate-x-9')
    expect(result.unknown).toEqual([])
    expect(result.style.transform).toEqual([{ translateY: -8 }, { translateX: 36 }])
    expect(compileClassStyles('translate-x-[1.5rem] -translate-y-[2px]').style.transform).toEqual([{ translateX: 24 }, { translateY: -2 }])
    expect(compileClassStyles('translate-x-[.5em]').style.transform).toEqual([{ translateX: 8 }])
  })

  it('keeps the other axis in dark appearance and diagnoses non-numeric translations', () => {
    const result = compileClassStyles('translate-y-2 translate-x-4 dark:translate-x-0')
    expect(result.dark?.transform).toEqual([{ translateY: 8 }, { translateX: 0 }])
    const unsupported = ['translate-x-1/2', '-translate-y-full', 'translate-x-[50%]', 'translate-y-[2junk]', 'translate-x-[1.2.3px]', 'translate-y-[var(--offset)]', 'translate-x-[Infinity]']
    expect(compileClassStyles(unsupported.join(' '))).toEqual({ style: {}, unknown: unsupported })
  })

  for (const minify of [false, true]) {
    it(`updates, overrides and clears computed translations (minify=${minify})`, async () => {
      const { code } = await compileNativeScreen(`<script client>
const classes = state('translate-x-9 translate-y-2 dark:translate-x-4')
const styles = state({})
window.probe = { classes, styles }
</script><div testID="moving" :class="classes" :style="styles"></div>`, { minify })
      const phone = mountNativeScreen(code, 'Screen')
      try {
        await phone.settle()
        const transform = () => phone.byTestID('moving')!.style.transform
        expect(transform()).toEqual([{ translateX: 36 }, { translateY: 8 }])
        phone.appearance('dark')
        await phone.settle()
        expect(transform()).toEqual([{ translateY: 8 }, { translateX: 16 }])
        phone.context.probe.styles.set({ transform: [{ translateX: 7 }] })
        await phone.settle()
        expect(transform()).toEqual([{ translateX: 7 }])
        phone.context.probe.styles.set({})
        phone.appearance('light')
        await phone.settle()
        expect(transform()).toEqual([{ translateX: 36 }, { translateY: 8 }])
        phone.context.probe.classes.set('')
        await phone.settle()
        expect(transform()).toBeNull()
      }
      finally { phone.unmount() }
    }, 30_000)
  }
})
