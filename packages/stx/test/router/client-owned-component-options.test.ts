import { expect, it } from 'bun:test'
import path from 'node:path'
import { getCachedSignalsRuntime } from '../../src/caching'
import { processServerBindings } from '../../src/server-bindings'
import { boot, closeBrowser, layout, page, renderApp, settle } from './spa-harness'

for (const buildMode of ['serve', 'compile']) {
  it(`keeps caller-owned translated choices reactive after ${buildMode} SSR`, async () => {
    const prior = Object.getOwnPropertyDescriptor(globalThis, 'say')
    Object.defineProperty(globalThis, 'say', { configurable: true, value: () => 'Server helper' })
    let app: Awaited<ReturnType<typeof renderApp>> | undefined
    try {
      app = await renderApp({
        'layouts/default.stx': layout(''),
        'components/Segments.stx': await Bun.file(path.join(import.meta.dir, '../../../components/src/ui/segmented-control/SegmentedControl.stx')).text(),
        'views/settings.stx': page('default', `<script client>
const locale = state('en')
const unit = state('metric')
function say(key) { return locale() === 'de' ? (key === 'metric' ? 'Metrisch' : 'US') : (key === 'metric' ? 'Metric' : 'Imperial') }
window.CHOICES = { locale, unit }
</script>
<div><Segments testID="units" stretch :value="unit()"
  :options="[{ value: 'metric', label: say('metric') }, { value: 'imperial', label: say('imperial') }]"
  @change="unit.set($event)" /></div>`),
      }, { '/settings': 'views/settings.stx' }, { buildMode })
      // This DOM harness executes inline scripts only. Supply the same runtime
      // that serve/compile emit as an external asset, before component setup.
      const html = app.documents.get('/settings')!
      const runtime = await getCachedSignalsRuntime()
      app.documents.set('/settings', html.replace(/<script data-stx-runtime src="[^"]+"><\/script>/, () => `<script data-stx-runtime>${runtime}</script>`))
      const browser = await boot(app, '/settings')
      const buttons = () => Array.from(browser.window.document.querySelectorAll('button')) as Array<{
        textContent: string | null
        click: () => void
        getAttribute: (name: string) => string | null
      }>
      expect(buttons().map(button => button.textContent)).toEqual(['Metric', 'Imperial'])
      buttons()[1]!.click()
      await settle()
      expect(browser.window.CHOICES.unit()).toBe('imperial')
      browser.window.CHOICES.locale.set('de')
      await settle()
      expect(buttons().map(button => button.textContent)).toEqual(['Metrisch', 'US'])
      expect(buttons()[1]!.getAttribute('aria-pressed')).toBe('true')
      expect(browser.errors).toEqual([])
    }
    finally {
      closeBrowser()
      await app?.dispose()
      if (prior) Object.defineProperty(globalThis, 'say', prior)
      else Reflect.deleteProperty(globalThis, 'say')
    }
  })
}

it('still resolves server-owned bindings beside client declarations', () => {
  expect(processServerBindings('<p :title="formatServer(42)"></p>', {
    __stx_client_declared_names: ['say'],
    formatServer: (value: number) => `Server ${value}`,
  })).toBe('<p title="Server 42"></p>')
})

it('preserves a direct client-owned binding despite a same-named server function', () => {
  const template = '<p :title="say(42)"></p>'
  expect(processServerBindings(template, {
    __stx_client_declared_names: ['say'],
    say: (value: number) => `Server ${value}`,
  })).toBe(template)
})
