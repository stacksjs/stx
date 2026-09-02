import type { StxOptions } from '../../src/types'
import { describe, expect, it } from 'bun:test'
import { processAppearanceBootstrapDirective } from '../../src/appearance-bootstrap'
import { processDirectives } from '../../src/process'

const options: StxOptions = {
  debug: false,
  componentsDir: '/tmp/stx-appearance-bootstrap-components',
}

const directive = `@appearanceBootstrap({
  storageKey: 'stacks-dashboard-appearance',
  appearance: {
    key: 'sidebarStyle',
    attribute: 'appearance',
    allowed: ['macos', 'arc'],
    default: 'macos',
  },
  colorMode: {
    key: 'colorMode',
    attribute: 'color-mode',
    default: 'system',
  },
})`

interface BootstrapRoot {
  attributes: Record<string, string>
  classes: Set<string>
  dataset: Record<string, string>
}

/**
 * Run the emitted script against the smallest document it needs.
 *
 * A real DOM would not make this a better test: what is under test is a string
 * the compiler wrote, and the only questions are whether it parses and whether
 * it touches the four things it claims to. Stubs make each of those an
 * assertion instead of an inspection.
 */
function runBootstrap(html: string): {
  api: any
  root: BootstrapRoot
  stored: Record<string, string>
  events: unknown[]
} {
  const source = html.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '')

  const root: BootstrapRoot = { attributes: {}, classes: new Set(), dataset: {} }
  const stored: Record<string, string> = {}
  const events: unknown[] = []

  const documentElement = {
    setAttribute: (name: string, value: string) => { root.attributes[name] = value },
    classList: {
      toggle: (name: string, on: boolean) => {
        if (on)
          root.classes.add(name)
        else root.classes.delete(name)
      },
    },
    dataset: root.dataset,
  }

  const scope: Record<string, unknown> = {
    document: { documentElement },
    localStorage: {
      getItem: (key: string) => (key in stored ? stored[key] : null),
      setItem: (key: string, value: string) => { stored[key] = value },
    },
    // Dark, so `system` resolves to something the defaults could not have
    // produced on their own.
    matchMedia: () => ({ matches: true, addEventListener: () => {} }),
    window: { dispatchEvent: (event: { detail: unknown }) => events.push(event.detail) },
    CustomEvent: class {
      detail: unknown
      constructor(_type: string, init: { detail: unknown }) { this.detail = init.detail }
    },
  }

  // eslint-disable-next-line no-new-func
  new Function(...Object.keys(scope), source)(...Object.values(scope))

  return { api: (scope.window as any).__stxAppearance, root, stored, events }
}

describe('@appearanceBootstrap', () => {
  it('emits a synchronous compiler-owned pre-paint script', async () => {
    const output = await processDirectives(
      `${directive}<main>Dashboard</main>`,
      {},
      '/dashboard-layout.stx',
      options,
      new Set<string>(),
    )

    expect(output).not.toContain('@appearanceBootstrap')
    expect(output).toContain('<script data-stx-scoped data-stx-appearance-bootstrap>')
    expect(output.indexOf('data-stx-appearance-bootstrap')).toBeLessThan(output.indexOf('<main>'))
    expect(output).toContain('"storageKey":"stacks-dashboard-appearance"')
    expect(output).toContain('root.classList.toggle("dark",dark)')
    expect(output).not.toContain('window.localStorage')
    expect(output).not.toContain('data-stx-runtime')
    expect(output).not.toContain(';(function(){\'use strict\'')
  })

  it('uses allowlisted defaults when persisted data is malformed', () => {
    const output = processAppearanceBootstrapDirective(directive, {})

    expect(output).toContain('"allowed":["macos","arc"]')
    expect(output).toContain('"default":"macos"')
    expect(output).toContain('config.appearance.allowed.includes')
    // The modes are hoisted into a `MODES` const the emitted script reuses
    // for both the read and the setter, rather than repeating the literal.
    expect(output).toContain('const MODES=["light","dark","system"]')
    expect(output).toContain('MODES.includes(stored[config.colorMode.key])')
  })

  it('supports server context in the options object', () => {
    const output = processAppearanceBootstrapDirective(
      `@appearanceBootstrap({
        storageKey,
        appearance: {
          key: 'skin',
          attribute: 'skin',
          allowed: ['soft'],
          default: 'soft',
        },
        colorMode: {
          key: 'mode',
          attribute: 'mode',
          default: defaultMode,
        },
      })`,
      { storageKey: 'viewer-preferences', defaultMode: 'dark' },
    )

    expect(output).toContain('"storageKey":"viewer-preferences"')
    expect(output).toContain('"default":"dark"')
  })

  it('adds the configured CSP nonce to the generated script', async () => {
    const output = await processDirectives(
      `<html><head>${directive}</head><body></body></html>`,
      {},
      '/dashboard-layout.stx',
      {
        ...options,
        csp: {
          enabled: true,
          useNonce: true,
          nonceGenerator: () => 'appearance-nonce',
        },
      },
      new Set<string>(),
    )

    expect(output).toContain('<script nonce="appearance-nonce" data-stx-scoped data-stx-appearance-bootstrap>')
  })

  it('rejects unsafe or inconsistent configuration', () => {
    expect(() => processAppearanceBootstrapDirective(
      `@appearanceBootstrap({
        storageKey: 'preferences',
        appearance: {
          key: 'skin',
          attribute: 'Skin',
          allowed: ['macos'],
          default: 'arc',
        },
        colorMode: {
          key: 'mode',
          attribute: 'mode',
          default: 'sepia',
        },
      })`,
      {},
    )).toThrow()
  })

  it('publishes a runtime that shares the pre-paint rules', () => {
    // The point of publishing it: an application changing the mode at runtime
    // must not have to restate what this script already does, because the
    // second implementation is the one that drifts. `data-theme` is where that
    // showed — set here, forgotten by every hand-written setter.
    const output = processAppearanceBootstrapDirective(directive, {})

    expect(output).toContain('window.__stxAppearance=')
    expect(output).toContain('setColorMode:')
    expect(output).toContain('setAppearance:')
    expect(output).toContain('watchSystem:')
    expect(output).toContain('stx:appearance')
  })

  it('applies, persists and rejects through the published runtime', () => {
    const { api, root, stored, events } = runBootstrap(processAppearanceBootstrapDirective(directive, {}))

    // The bootstrap ran: nothing is stored, so both defaults reach the document
    // and the stubbed media query decides `system`.
    expect(root.attributes['data-appearance']).toBe('macos')
    expect(root.attributes['data-color-mode']).toBe('system')
    expect(root.dataset.theme).toBe('dark')
    expect(events).toHaveLength(1)

    expect(api.setColorMode('light')).toMatchObject({ colorMode: 'light', dark: false })
    expect(root.attributes['data-color-mode']).toBe('light')
    expect(root.dataset.theme).toBe('light')
    expect(JSON.parse(stored['stacks-dashboard-appearance'])).toEqual({ colorMode: 'light' })

    // Outside the allowlist: applied from what is stored, never written.
    expect(api.setColorMode('sepia')).toMatchObject({ colorMode: 'light' })
    expect(api.setAppearance('brutalist')).toMatchObject({ appearance: 'macos' })
    expect(JSON.parse(stored['stacks-dashboard-appearance'])).toEqual({ colorMode: 'light' })
  })

  it('escapes script-closing content in authored values', () => {
    const output = processAppearanceBootstrapDirective(
      `@appearanceBootstrap({
        storageKey: '</script><script>alert(1)</script>',
        appearance: {
          key: 'skin',
          attribute: 'skin',
          allowed: ['macos'],
          default: 'macos',
        },
        colorMode: {
          key: 'mode',
          attribute: 'mode',
          default: 'system',
        },
      })`,
      {},
    )

    expect(output.match(/<\/script>/g)).toHaveLength(1)
    expect(output).toContain('\\u003c/script\\u003e')
  })
})
