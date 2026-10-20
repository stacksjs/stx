import { expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { compileNativeBundle } from '../../src/native/compiler/bundle'
import { mountNativeScreen } from '../../src/native/testing'
import { createTempDir } from '../../src/temp-dir'

// Buddy's release process can expose a same-named server helper globally.
// A component's explicitly client-owned labels must still use its caller.
it.each([false, true])('keeps translated component choices interactive with split runtime %s', async (split) => {
  const prior = Object.getOwnPropertyDescriptor(globalThis, 'say')
  Object.defineProperty(globalThis, 'say', { configurable: true, value: () => 'Server helper' })
  let phone: ReturnType<typeof mountNativeScreen> | undefined
  try {
    const root = createTempDir('stx-translated-component-options-')
    await Bun.write(path.join(root, 'stx.config.ts'), 'export default {}')
    await Bun.write(path.join(root, 'components/SharedSegment.stx'), await Bun.file(path.join(import.meta.dir, '../../../components/src/ui/segmented-control/SegmentedControl.stx')).text())
    await Bun.write(path.join(root, 'lang/en/units.ts'), "export default { metric: 'Metric', imperial: 'Imperial' }")
    await Bun.write(path.join(root, 'lang/de/units.ts'), "export default { metric: 'Metrisch', imperial: 'US' }")
    await Bun.write(path.join(root, 'catalog.ts'), `import en from './lang/en/units'
import de from './lang/de/units'
export const catalog = { en, de }
`)
    await Bun.write(path.join(root, 'Settings.stx'), `<script client>
import { catalog } from './catalog'
const locale = state('en')
const unit = state('metric')
function say(key) { return catalog[locale()][key] }
globalThis.__choices = { locale, unit }
</script>
<View><SharedSegment testID="units" stretch :value="unit()"
  :options="[{ value: 'metric', label: say('metric') }, { value: 'imperial', label: say('imperial') }]"
  @change="unit.set($event)" /></View>`)
    const result = await compileNativeBundle({
      root,
      screens: { Settings: 'Settings.stx' },
      minify: true,
      ...(split ? { routesDir: 'routes', sharedRuntime: true, messages: { dir: 'lang', languages: ['en', 'de'] } } : {}),
    })
    const code = split
      ? `${await Bun.file(result.runtime!).text()}\n${await Bun.file(result.routes!.Settings!).text()}`
      : result.code
    const reads: string[] = []
    phone = mountNativeScreen(code, 'Settings', {
      globals: {
        __stxNativeReadMessages: (language: string, area: string) => {
          reads.push(`${language}/${area}`)
          return readFileSync(path.join(result.messages!.dir, language, `${area}.json`), 'utf8')
        },
      },
    })
    await phone.settle()
    expect(phone.texts()).toContain('Metric')
    expect(phone.texts()).toContain('Imperial')
    expect(phone.texts()).not.toContain('Server helper')
    const imperial = phone.find(node => node.props.testID === 'units-imperial')
    expect(imperial).toBeDefined()
    phone.press(imperial!)
    await phone.settle()
    expect(phone.context.__choices.unit()).toBe('imperial')
    phone.context.__choices.locale.set('de')
    await phone.settle()
    expect(phone.texts()).toContain('Metrisch')
    expect(phone.texts()).toContain('US')
    expect(reads).toEqual(split ? ['en/units', 'de/units'] : [])
  }
  finally {
    phone?.unmount()
    if (prior) Object.defineProperty(globalThis, 'say', prior)
    else Reflect.deleteProperty(globalThis, 'say')
  }
})
