/**
 * Config validation tests - redistributed from bugs/ directory.
 *
 * Covers: Config Validation from deep-edge-cases.ts.
 */
import { describe, expect, it } from 'bun:test'
import { validateConfig } from '../../src/config'

describe('Config Validation', () => {
  it('valid minimal config', () => {
    const result = validateConfig({})
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
  })

  it('invalid streaming.strategy value', () => {
    const result = validateConfig({
      streaming: { strategy: 'invalid' as any },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path === 'streaming.strategy')).toBe(true)
  })

  it('invalid i18n.format value', () => {
    const result = validateConfig({
      i18n: { format: 'xml' as any },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path === 'i18n.format')).toBe(true)
  })

  it('invalid a11y.level value', () => {
    const result = validateConfig({
      a11y: { level: 'A' as any },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path === 'a11y.level')).toBe(true)
  })

  it('invalid hydration.mode value', () => {
    const result = validateConfig({
      hydration: { mode: 'full' as any },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path === 'hydration.mode')).toBe(true)
  })

  it('invalid hydration.preload value', () => {
    const result = validateConfig({
      hydration: { preload: 'always' as any },
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path === 'hydration.preload')).toBe(true)
  })

  it('warning: debug enabled with caching', () => {
    const result = validateConfig({
      debug: true,
      cache: true,
    })
    expect(result.warnings.some(w => w.path === 'debug+cache')).toBe(true)
  })

  it('warning: SEO enabled without title', () => {
    const result = validateConfig({
      seo: { enabled: true, defaultConfig: {} },
    })
    expect(result.warnings.some(w => w.path === 'seo.defaultConfig.title')).toBe(true)
  })

  it('custom directive missing handler', () => {
    const result = validateConfig({
      customDirectives: [
        { name: 'test', handler: undefined as any, hasEndTag: false },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path.includes('handler'))).toBe(true)
  })

  it('middleware missing timing', () => {
    const result = validateConfig({
      middleware: [
        { name: 'test', handler: () => '', timing: undefined as any },
      ],
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.path.includes('timing'))).toBe(true)
  })
})
