import { describe, expect, it } from 'bun:test'
import path from 'node:path'
import { generateColorModeBootScript, injectColorModeBootScript } from '../../src/color-mode-boot'
import { processDirectives } from '../../src/process'

/**
 * A theme the visitor does not get to choose (stacksjs/stx#2050).
 *
 * A public page whose owner forces light or dark for everyone stamps the
 * attribute server-side during render, and that has to win over whatever the
 * visitor has stored from their own browsing. The boot script had no
 * `getAttribute` call anywhere: it computed the mode from storage and stamped
 * unconditionally, so the forced page rendered in the visitor's preference.
 *
 * The resolution is published as `forced` rather than left to be re-derived,
 * because this script stamps the attribute either way: afterwards nothing
 * downstream can tell a forced value from a computed one by looking at the
 * DOM. `useColorMode` reads it from there, in both reactive implementations.
 */

/** Run the real generated script against a fake root, and report what it did. */
function boot(options: Parameters<typeof generateColorModeBootScript>[0], stamped: string | undefined, stored: string | null) {
  const body = generateColorModeBootScript(options)
    .replace(/^<script[^>]*>/, '')
    .replace(/<\/script>$/, '')

  const attributes: Record<string, string> = {}
  if (stamped !== undefined)
    attributes['data-theme'] = stamped

  const classes = new Set<string>()
  const published: Record<string, any> = {}
  const root = {
    setAttribute: (key: string, value: string) => { attributes[key] = value },
    getAttribute: (key: string) => (key in attributes ? attributes[key] : null),
    classList: {
      add: (c: string) => classes.add(c),
      remove: (c: string) => classes.delete(c),
      toggle: () => {},
    },
    dataset: {} as Record<string, string>,
  }

  // eslint-disable-next-line no-new-func
  new Function('document', 'localStorage', 'matchMedia', 'window', body)(
    { documentElement: root },
    { getItem: () => stored, setItem: () => {} },
    () => ({ matches: false, addEventListener: () => {} }),
    published,
  )

  return {
    theme: attributes['data-theme'],
    classes,
    state: published.__STX_COLOR_MODE__ as Record<string, unknown>,
  }
}

const BASE = { storageKey: 'app-theme', initialMode: 'light' as const, darkClass: null, attribute: 'data-theme' }
const RESPECT = { ...BASE, respectExisting: true }

describe('respectExisting honours a server-stamped attribute', () => {
  it('renders the forced mode over the visitor stored preference', () => {
    // The two rows from the issue, which came back inverted on v0.2.400.
    expect(boot(RESPECT, 'light', 'dark').theme).toBe('light')
    expect(boot(RESPECT, 'dark', 'light').theme).toBe('dark')
  })

  it('still reports the visitor own preference, so a settings panel is honest', () => {
    // The page is forced; the person's choice is unchanged and must not be
    // reported back to them as the forced value.
    const { state } = boot(RESPECT, 'light', 'dark')
    expect(state.mode).toBe('light')
    expect(state.preference).toBe('dark')
    expect(state.forced).toBe('light')
  })

  it('publishes forced, because the DOM cannot say afterwards', () => {
    // This script stamps the attribute whether or not it adopted one, so a
    // consumer reading the DOM sees a concrete value either way. Without this
    // field useColorMode would recompute from storage on mount and stamp over
    // the forced mode, painting correctly and then flipping.
    expect(boot(RESPECT, 'dark', 'light').state.forced).toBe('dark')
    expect(boot(RESPECT, undefined, 'light').state.forced).toBe(null)
    expect(boot(BASE, 'dark', 'light').state.forced).toBe(null)
  })

  it('treats only light and dark as concrete', () => {
    // 'auto' and 'system' are instructions to resolve, not answers, so the
    // stored preference wins as usual. Same for an empty or absent attribute.
    for (const stamped of ['system', 'auto', '', undefined]) {
      const { theme, state } = boot(RESPECT, stamped, 'dark')
      expect(theme, `stamped=${JSON.stringify(stamped)}`).toBe('dark')
      expect(state.forced, `stamped=${JSON.stringify(stamped)}`).toBe(null)
    }
  })

  it('falls back to the configured mode when nothing is stamped or stored', () => {
    expect(boot(RESPECT, undefined, null).theme).toBe('light')
    expect(boot({ ...RESPECT, initialMode: 'dark' }, undefined, null).theme).toBe('dark')
  })

  it('keeps the dark class in step with the forced mode', () => {
    // The class and the attribute are complements (#1788), so a forced light
    // page must not keep a dark class the visitor preference would have added.
    const withClass = { ...RESPECT, darkClass: 'dark' }
    expect(boot(withClass, 'light', 'dark').classes.has('dark')).toBe(false)
    expect(boot(withClass, 'dark', 'light').classes.has('dark')).toBe(true)
  })

  it('changes nothing when it is off', () => {
    // Default-off, so every app on v0.2.400 behaves exactly as before. This is
    // the row the issue reported as the regression.
    expect(boot(BASE, 'light', 'dark').theme).toBe('dark')
    expect(boot(BASE, 'dark', 'light').theme).toBe('light')
  })

  it('refuses the option when there is no attribute to read', () => {
    // The dark class alone cannot distinguish "the server chose light" from
    // "no one has chosen yet", so honouring it would be guesswork.
    expect(() => generateColorModeBootScript({ ...BASE, attribute: null, darkClass: 'dark', respectExisting: true }))
      .toThrow('respectExisting needs an attribute')
  })
})

describe('the option reaches the page through app.colorMode', () => {
  it('survives the injector, which is the path a configured app takes', () => {
    // `app.colorMode` is handed to injectColorModeBootScript verbatim
    // (process.ts), and `colorMode?: ColorModeBootConfig` is the declared
    // type, so an app sets this in config rather than calling the generator.
    // Pinned because a correct generator reached by no caller is the recurring
    // way this kind of change ships broken.
    const html = injectColorModeBootScript(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>t</title></head><body></body></html>',
      { ...BASE, respectExisting: true },
    )

    expect(html).toContain('respectExisting:c.respectExisting')
    expect(html).toContain('"respectExisting":true')
    expect(html).toContain('getAttribute')
  })

  it('emits no attribute read when the option is off', () => {
    // The pre-paint script is in the critical path on every page, so an app
    // that has not asked for this should not pay for the branch being taken.
    const html = injectColorModeBootScript(
      '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>t</title></head><body></body></html>',
      BASE,
    )

    expect(html).toContain('"respectExisting":false')
  })

  /*
   * Through the whole render, not just the injector (stacksjs/stx#2052).
   *
   * The test above calls `injectColorModeBootScript` directly, which proves
   * the generator and the injector agree and nothing about the layer that
   * reaches them. #2052 reported precisely that gap -- the flag never arriving
   * at a served page -- and named the serve assembly of `options.app` as the
   * suspect. It is not: the config is forwarded wholesale and all six fields
   * arrive. What the report was actually seeing was an older copy of the
   * generator being executed, whose config literal is this one minus the
   * field.
   *
   * So this drives the public entry point an app's request goes through, and
   * asserts the field on the far side of it, which is the only version of this
   * test that could have answered the question either way.
   */
  it('survives a full serve render, which is the path a request takes', async () => {
    const html = await processDirectives(
      '<html><head><meta charset="utf-8"></head><body><p>hi</p></body></html>',
      {},
      path.join(import.meta.dir, 'color-mode-serve.stx'),
      { root: import.meta.dir, buildMode: 'serve', cache: false, app: { colorMode: RESPECT } } as never,
      new Set<string>(),
    )

    // The config literal the script reads, with every field the resolver
    // returns. A served page missing one of these is running another build.
    expect(html).toContain('"respectExisting":true')
    expect(html).toContain('respectExisting:c.respectExisting')
    // The behaviour the flag buys: reading what the server already stamped.
    expect(html).toContain('getAttribute')
    expect(html).toContain('forced')
  })

  it('leaves the field out of nothing: the served literal carries all six', async () => {
    // Named because the reported symptom was a five-key literal. The order is
    // the resolver's, so a diff against a served page reads directly.
    const html = await processDirectives(
      '<html><head><meta charset="utf-8"></head><body></body></html>',
      {},
      path.join(import.meta.dir, 'color-mode-serve.stx'),
      { root: import.meta.dir, buildMode: 'serve', cache: false, app: { colorMode: RESPECT } } as never,
      new Set<string>(),
    )
    const literal = /\{"storageKey"[^}]*\}/.exec(html)
    expect(literal).toBeTruthy()
    expect(Object.keys(JSON.parse(literal![0]))).toEqual([
      'storageKey',
      'initialMode',
      'darkClass',
      'attribute',
      'autoValue',
      'respectExisting',
    ])
  })
})
