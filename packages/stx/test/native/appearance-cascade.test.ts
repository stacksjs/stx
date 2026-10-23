import { describe, expect, it } from 'bun:test'
import { compileClassStyles } from '../../src/native/compiler/headwind-to-style'
import { compileNativeScreen, mountNativeScreen } from '../../src/native/testing'

it('maps block visibility to the native layout display, including an appearance override', () => {
  const styles = compileClassStyles('hidden dark:block')
  expect(styles.unknown).toEqual([])
  expect(styles.style.display).toBe('none')
  expect(styles.dark?.display).toBe('flex')
  expect(compileClassStyles('text-fg text-blue-500', undefined, { appearance: 'dark' }).style.color).toBe('#3b82f6')
  expect(compileClassStyles('text-blue-500 text-fg', undefined, { appearance: 'dark' }).style.color).toBe('#f5f5f5')
})

describe.each([['ios', false], ['ios', true], ['android', false], ['android', true]] as const)('native appearance and width cascade (%s, minify=%s)', (platform, minify) => {
  it('keeps explicit dark selectors above responsive light utilities without promoting semantic defaults', async () => {
    const { code } = await compileNativeScreen(`<script client>
const shown = state(true)
window.probe = { shown }
</script>
<style>.rule-title { color: #123456; } .dark .rule-title { color: #ffffff; }</style>
<section>
  <h1 testID="heading" class="text-slate-900 md:text-2xl dark:text-white max-md:text-[28px] max-md:text-black">Welcome</h1>
  <span testID="semantic" class="text-fg max-md:text-blue-500">Themed</span>
  <span testID="explicit" class="text-fg max-md:text-blue-500 dark:text-white md:dark:text-green-500">Explicit</span>
  <span testID="rule" class="rule-title max-md:text-black">Stylesheet</span>
  <img testID="light-mark" :show="shown" class="dark:hidden h-[18px] w-[18px]" src="data:image/png;base64,AQ==" />
  <img testID="dark-mark" :show="shown" class="hidden dark:block h-[18px] w-[18px]" src="data:image/png;base64,AQ==" />
</section>`, { minify })
    const phone = mountNativeScreen(code, 'Screen', { platform, viewportWidth: 402 })
    const style = (id: string) => phone.byTestID(id)!.style
    try {
      await phone.settle()
      expect(style('heading')).toMatchObject({ color: '#000000', fontSize: 28 })
      expect(style('semantic').color).toBe('#3b82f6')
      expect(style('rule').color).toBe('#000000')
      expect(style('light-mark').display).not.toBe('none')
      expect(style('dark-mark').display).toBe('none')

      phone.appearance('dark')
      await phone.settle()
      expect(style('heading')).toMatchObject({ color: '#ffffff', fontSize: 28 })
      expect(style('semantic').color).toBe('#3b82f6')
      expect(style('explicit').color).toBe('#ffffff')
      expect(style('rule').color).toBe('#ffffff')
      expect(style('light-mark').display).toBe('none')
      expect(style('dark-mark')).toMatchObject({ display: 'flex', width: 18, height: 18 })

      phone.context.probe.shown.set(false)
      await phone.settle()
      expect(style('dark-mark').display).toBe('none')
      phone.context.probe.shown.set(true)
      phone.viewport(1280)
      await phone.settle()
      expect(style('heading')).toMatchObject({ color: '#ffffff', fontSize: 24 })
      expect(style('semantic').color).toBe('#f5f5f5')
      expect(style('rule').color).toBe('#ffffff')
      expect(style('explicit').color).toBe('#22c55e')
      expect(style('dark-mark').display).toBe('flex')

      phone.appearance('light')
      await phone.settle()
      expect(style('heading')).toMatchObject({ color: '#0f172a', fontSize: 24 })
      expect(style('semantic').color).toBe('#171717')
      expect(style('rule').color).toBe('#123456')
      expect(style('dark-mark').display).toBe('none')
      expect(style('light-mark').display).not.toBe('none')
      expect(phone.mutationErrors).toEqual([])
    }
    finally { phone.unmount() }
  })
})
