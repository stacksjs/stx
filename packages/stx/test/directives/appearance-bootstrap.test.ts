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
    expect(output).toContain('["light","dark","system"].includes')
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
