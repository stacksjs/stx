import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { compileSharedScreenBundle } from '../../src/native/compiler/bundle'
import { createNativeMedia, evaluateMediaQuery } from '../../src/native/runtime/native-media'
import { createTempDir } from '../../src/temp-dir'
import { mountNativeScreen, type NativeScreenOptions } from '../../src/native/testing'

const phone = { width: 390, height: 844, colorScheme: 'light' as const, reducedMotion: false, pointer: false }
const mac = { width: 1280, height: 800, colorScheme: 'dark' as const, reducedMotion: true, pointer: true }

describe('media queries on a native screen', () => {
  it('reads the widths, orientation and preferences a layout decides on', () => {
    expect(evaluateMediaQuery('(min-width: 768px)', phone)).toBe(false)
    expect(evaluateMediaQuery('(min-width: 768px)', mac)).toBe(true)
    expect(evaluateMediaQuery('(max-width: 48em)', phone)).toBe(true)
    expect(evaluateMediaQuery('screen and (min-width: 640px) and (max-width: 1023px)', { ...phone, width: 800 })).toBe(true)
    expect(evaluateMediaQuery('(orientation: portrait)', phone)).toBe(true)
    expect(evaluateMediaQuery('(orientation: landscape)', mac)).toBe(true)
    expect(evaluateMediaQuery('(prefers-color-scheme: dark)', mac)).toBe(true)
    expect(evaluateMediaQuery('(prefers-reduced-motion: reduce)', mac)).toBe(true)
    expect(evaluateMediaQuery('(hover: hover) and (pointer: fine)', mac)).toBe(true)
    expect(evaluateMediaQuery('(hover: hover)', phone)).toBe(false)
    expect(evaluateMediaQuery('(pointer: coarse)', phone)).toBe(true)
  })

  it('handles lists, not, only, print and features it does not know', () => {
    expect(evaluateMediaQuery('print, (min-width: 300px)', phone)).toBe(true)
    expect(evaluateMediaQuery('print', phone)).toBe(false)
    expect(evaluateMediaQuery('not print', phone)).toBe(true)
    expect(evaluateMediaQuery('only screen and (max-width: 400px)', phone)).toBe(true)
    expect(evaluateMediaQuery('(min-resolution: 2dppx)', phone)).toBe(false)
  })

  it('tells listeners only when their answer flips', () => {
    const media = createNativeMedia({ width: 390 })
    const wide = media.matchMedia('(min-width: 768px)')
    const heard: boolean[] = []
    wide.addEventListener('change', event => heard.push(event.matches))
    media.update({ width: 500 })
    media.update({ width: 900 })
    media.update({ width: 1000 })
    media.update({ width: 700 })
    expect(heard).toEqual([true, false])
    expect(wide.matches).toBe(false)
  })
})

async function mount(source: string, components: Record<string, string>, options: NativeScreenOptions) {
  const root = createTempDir('stx-native-media-')
  await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
  for (const [name, content] of Object.entries(components))
    await Bun.write(path.join(root, 'components', `${name}.stx`), content)
  const file = path.join(root, 'Screen.stx')
  await Bun.write(file, source)
  const { code } = await compileSharedScreenBundle(file, { root })
  const screen = mountNativeScreen(code, 'Screen', options)
  await screen.settle?.()
  await Bun.sleep(20)
  return screen
}

describe('one component across phone, tablet and desktop widths', () => {
  const layout = `<script client>
const wide = useMediaQuery('(min-width: 768px)')
</script>
<View testID="frame" class="flex-col md:flex-row p-2 md:p-6">
  <Text>{{ wide() ? 'sidebar layout' : 'tab bar layout' }}</Text>
</View>`

  it('starts with the width the host gave and follows VIEWPORT', async () => {
    const screen = await mount('<View><Frame /></View>', { Frame: layout }, { viewportWidth: 390, platform: 'ios' })
    expect(screen.texts()).toContain('tab bar layout')
    expect(screen.byTestID('frame')!.style.flexDirection).not.toBe('row')
    expect(screen.context.innerWidth).toBe(390)
    screen.viewport(1024, 768)
    await screen.settle()
    expect(screen.texts()).toContain('sidebar layout')
    // The md: classes moved with it.
    expect(screen.byTestID('frame')!.style).toMatchObject({ flexDirection: 'row', padding: 24 })
    expect(screen.context.matchMedia('(orientation: landscape)').matches).toBe(true)
  })

  it('sends nothing while a Mac window resizes inside one breakpoint', async () => {
    const screen = await mount('<View><Frame /></View>', { Frame: layout }, { viewportWidth: 1200, platform: 'macos' })
    expect(screen.texts()).toContain('sidebar layout')
    const before = screen.messages.filter(message => message.type === 'MUTATE').length
    for (const width of [1190, 1100, 1000, 900, 800]) screen.viewport(width, 800)
    await screen.settle()
    expect(screen.messages.filter(message => message.type === 'MUTATE').length).toBe(before)
    screen.viewport(700, 800)
    await screen.settle()
    expect(screen.texts()).toContain('tab bar layout')
    expect(screen.context.matchMedia('(hover: hover)').matches).toBe(true)
  })

  it('answers prefers-color-scheme from APPEARANCE', async () => {
    const screen = await mount(`<script client>
const dark = useMediaQuery('(prefers-color-scheme: dark)')
</script><View><Text>{{ dark() ? 'dark' : 'light' }}</Text></View>`, {}, { colorScheme: 'light' })
    expect(screen.texts()).toContain('light')
    screen.appearance('dark')
    await screen.settle()
    expect(screen.texts()).toContain('dark')
  })
})
