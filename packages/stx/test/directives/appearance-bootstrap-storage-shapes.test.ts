import { describe, expect, it } from 'bun:test'
import { processAppearanceBootstrapDirective } from '../../src/appearance-bootstrap'

/**
 * What `@appearanceBootstrap` accepts from storage, and what it requires
 * (stacksjs/stx#2050).
 *
 * `script-validation.ts` suggests this directive to anyone whose strict-mode
 * `window.localStorage` access must run before first paint. Taking that
 * suggestion on an ordinary light/dark theme guard could not work:
 *
 *  - The bootstrap read the key with JSON.parse and discarded anything that
 *    was not a plain object. A theme key holding a bare `dark` is the common
 *    shape in existing apps and is what useColorMode writes under its own
 *    storageKey; JSON.parse throws on it, the catch swallows the throw by
 *    design, and the resolver fell to the default. So the migration the
 *    validator suggests silently discarded every existing user's preference,
 *    with nothing to say the two formats disagreed.
 *
 *  - `appearance` was mandatory, so a colour-mode-only app had to invent a
 *    single-valued second axis and then carry a meaningless data attribute on
 *    every page.
 */

/** Run the real directive, then execute the script it emitted. */
function boot(options: string, stored: string | null, stamped: Record<string, string> = {}) {
  const html = processAppearanceBootstrapDirective(`@appearanceBootstrap(${options})`, {})
  const body = html
    .replace(/^<script[^>]*>/, '')
    .replace(/<\/script>$/, '')

  const attributes: Record<string, string> = { ...stamped }
  const storage = new Map<string, string>()
  if (stored !== null)
    storage.set('app-theme', stored)

  const dataset: Record<string, string> = {}
  const classes = new Set<string>()
  const root = {
    setAttribute: (k: string, v: string) => { attributes[k] = v },
    getAttribute: (k: string) => (k in attributes ? attributes[k] : null),
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      toggle: (c: string, on?: boolean) => { if (on) classes.add(c); else classes.delete(c) },
    },
    dataset,
  }
  const published: Record<string, any> = {
    dispatchEvent: () => true,
    CustomEvent: class { constructor(public type: string, public init: any) {} },
  }

  // eslint-disable-next-line no-new-func
  new Function('document', 'localStorage', 'matchMedia', 'window', 'CustomEvent', body)(
    { documentElement: root },
    {
      getItem: (k: string) => (storage.has(k) ? storage.get(k)! : null),
      setItem: (k: string, v: string) => { storage.set(k, String(v)) },
    },
    () => ({ matches: false, addEventListener: () => {} }),
    published,
    published.CustomEvent,
  )

  return {
    attributes,
    dataset,
    classes,
    api: published.__stxAppearance,
    stored: () => storage.get('app-theme') ?? null,
  }
}

const COLOR_ONLY = `{ storageKey: 'app-theme', colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`
const BOTH = `{ storageKey: 'app-theme', appearance: { key: 'sidebarStyle', attribute: 'appearance', allowed: ['macos', 'arc'], default: 'macos' }, colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`

describe('a bare-string preference is honoured', () => {
  it('reads the shape the issue reported as silently discarded', () => {
    // The exact table from the issue: these three resolved to `system` before.
    expect(boot(COLOR_ONLY, 'dark').attributes['data-color-mode']).toBe('dark')
    expect(boot(COLOR_ONLY, 'light').attributes['data-color-mode']).toBe('light')
    expect(boot(COLOR_ONLY, 'system').attributes['data-color-mode']).toBe('system')
  })

  it('still reads a JSON preference object', () => {
    // The format the directive was written for has to keep working.
    expect(boot(BOTH, '{"colorMode":"dark","sidebarStyle":"arc"}').attributes['data-color-mode']).toBe('dark')
    expect(boot(BOTH, '{"colorMode":"dark","sidebarStyle":"arc"}').attributes['data-appearance']).toBe('arc')
  })

  it('reads a JSON-quoted string too', () => {
    // `JSON.parse('"dark"')` yields a string rather than throwing, so it took
    // a different path through the old code to the same wrong answer.
    expect(boot(COLOR_ONLY, '"dark"').attributes['data-color-mode']).toBe('dark')
  })

  it('falls back to the default for anything it cannot read', () => {
    for (const stored of [null, '', 'not-a-mode', '[]', '{}', '42', '"nonsense"'])
      expect(boot(COLOR_ONLY, stored).attributes['data-color-mode'], JSON.stringify(stored)).toBe('system')
  })

  it('writes back the shape it found, rather than converting it', () => {
    // Reading a bare string and writing an object would convert the key out
    // from under the app's own other readers, which is the silent data loss
    // #1788 was about.
    const bare = boot(COLOR_ONLY, 'dark')
    bare.api.setColorMode('light')
    expect(bare.stored()).toBe('light')

    const json = boot(COLOR_ONLY, '{"colorMode":"dark"}')
    json.api.setColorMode('light')
    expect(JSON.parse(json.stored()!)).toEqual({ colorMode: 'light' })
  })

  it('keeps writing JSON when there is a second axis to carry', () => {
    // A bare string cannot hold the appearance value, so the object shape has
    // to win there even if the key happened to arrive as a string.
    const both = boot(BOTH, 'dark')
    both.api.setColorMode('light')
    expect(JSON.parse(both.stored()!).colorMode).toBe('light')
  })
})

describe('the appearance axis is optional', () => {
  it('accepts a colour-mode-only configuration', () => {
    // Previously: "@appearanceBootstrap appearance must be an object".
    expect(() => boot(COLOR_ONLY, 'dark')).not.toThrow()
  })

  it('stamps no second attribute when there is no second axis', () => {
    // The reason the workaround was bad: inventing `allowed: ['default']` put
    // a meaningless data attribute on <html> on every page.
    const { attributes } = boot(COLOR_ONLY, 'dark')
    expect(Object.keys(attributes)).toEqual(['data-color-mode'])
  })

  it('still resolves the dark class and theme dataset', () => {
    // Colour mode is the whole point of the colour-mode-only case, so the rest
    // of the apply step has to work without an appearance axis.
    const dark = boot(COLOR_ONLY, 'dark')
    expect(dark.classes.has('dark')).toBe(true)
    expect(dark.dataset.theme).toBe('dark')

    const light = boot(COLOR_ONLY, 'light')
    expect(light.classes.has('dark')).toBe(false)
    expect(light.dataset.theme).toBe('light')
  })

  it('makes setAppearance a no-op rather than a crash', () => {
    const { api, attributes } = boot(COLOR_ONLY, 'dark')
    expect(() => api.setAppearance('arc')).not.toThrow()
    expect(Object.keys(attributes)).toEqual(['data-color-mode'])
  })

  it('still rejects an appearance that is present and malformed', () => {
    // Optional is not the same as unvalidated.
    expect(() => boot(`{ storageKey: 'app-theme', appearance: 'macos', colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`, null))
      .toThrow('appearance must be an object when given')
    expect(() => boot(`{ storageKey: 'app-theme', appearance: { key: 'sidebarStyle', attribute: 'appearance', allowed: [], default: 'macos' }, colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`, null))
      .toThrow('appearance.allowed must contain one or more strings')
  })

  it('still requires colorMode', () => {
    expect(() => boot(`{ storageKey: 'app-theme' }`, null)).toThrow('colorMode must be an object')
  })
})

describe('respectExisting honours an already-stamped attribute', () => {
  const RESPECT = `{ storageKey: 'app-theme', respectExisting: true, colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`
  const RESPECT_BOTH = `{ storageKey: 'app-theme', respectExisting: true, appearance: { key: 'sidebarStyle', attribute: 'appearance', allowed: ['macos', 'arc'], default: 'macos' }, colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`

  it('renders the stamped mode over the stored preference', () => {
    const { attributes, dataset } = boot(RESPECT, 'dark', { 'data-color-mode': 'light' })
    expect(attributes['data-color-mode']).toBe('light')
    expect(dataset.theme).toBe('light')
  })

  it('takes the stored preference when nothing concrete is stamped', () => {
    // `system` is an instruction to resolve, not an answer.
    for (const stamped of [{}, { 'data-color-mode': 'system' }, { 'data-color-mode': '' }])
      expect(boot(RESPECT, 'dark', stamped).attributes['data-color-mode'], JSON.stringify(stamped)).toBe('dark')
  })

  it('honours a stamped appearance from the allowed set only', () => {
    expect(boot(RESPECT_BOTH, '{"sidebarStyle":"macos"}', { 'data-appearance': 'arc' }).attributes['data-appearance']).toBe('arc')
    // Not in `allowed`, so it is not an answer either.
    expect(boot(RESPECT_BOTH, '{"sidebarStyle":"macos"}', { 'data-appearance': 'nonsense' }).attributes['data-appearance']).toBe('macos')
  })

  it('does not read its own stamp back on a later apply', () => {
    // apply() stamps both attributes, so a forced value captured per call
    // would make this script pin the theme against its own settings control
    // the moment anything called apply a second time.
    const { api, attributes } = boot(RESPECT, 'dark', {})
    expect(attributes['data-color-mode']).toBe('dark')

    api.setColorMode('light')
    expect(attributes['data-color-mode']).toBe('light')

    api.setColorMode('dark')
    expect(attributes['data-color-mode']).toBe('dark')
  })

  it('changes nothing when it is off', () => {
    const OFF = `{ storageKey: 'app-theme', colorMode: { key: 'colorMode', attribute: 'color-mode', default: 'system' } }`
    expect(boot(OFF, 'dark', { 'data-color-mode': 'light' }).attributes['data-color-mode']).toBe('dark')
  })

  it('publishes what it adopted', () => {
    expect(boot(RESPECT, 'dark', { 'data-color-mode': 'light' }).api.forced.colorMode).toBe('light')
    expect(boot(RESPECT, 'dark', {}).api.forced.colorMode).toBe(null)
  })
})
