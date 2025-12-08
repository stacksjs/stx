import type { CspConfig, CspDirectives } from '../src/types'
import { describe, expect, it } from 'bun:test'
import {
  addNonceToInlineContent,
  clearNonce,
  createCspHeaders,
  generateCspHeader,
  generateCspMetaTag,
  generateNonce,
  getCspHeaderName,
  getCspPreset,
  getNonce,
  injectCspMetaTag,
  mergeCspDirectives,
  moderateCspPreset,
  processCspDirectives,
  strictCspPreset,
  validateCspDirectives,
} from '../src/csp'

describe('CSP Module', () => {
  describe('generateNonce', () => {
    it('generates a base64-encoded nonce', () => {
      const nonce = generateNonce()
      expect(nonce).toBeTruthy()
      expect(typeof nonce).toBe('string')
      // Base64 should only contain A-Za-z0-9+/=
      expect(nonce).toMatch(/^[A-Z0-9+/=]+$/i)
    })

    it('generates unique nonces', () => {
      const nonce1 = generateNonce()
      const nonce2 = generateNonce()
      expect(nonce1).not.toBe(nonce2)
    })

    it('respects custom length', () => {
      const shortNonce = generateNonce(8)
      const longNonce = generateNonce(32)
      // Longer source bytes = longer base64 output
      expect(longNonce.length).toBeGreaterThan(shortNonce.length)
    })
  })

  describe('getNonce', () => {
    it('returns a new nonce when no context is provided', () => {
      const nonce1 = getNonce()
      const nonce2 = getNonce()
      expect(nonce1).not.toBe(nonce2)
    })

    it('returns the same nonce for the same context', () => {
      const ctx = { requestId: '123' }
      const nonce1 = getNonce(ctx)
      const nonce2 = getNonce(ctx)
      expect(nonce1).toBe(nonce2)

      // Cleanup
      clearNonce(ctx)
    })

    it('returns different nonces for different contexts', () => {
      const ctx1 = { requestId: '1' }
      const ctx2 = { requestId: '2' }

      const nonce1 = getNonce(ctx1)
      const nonce2 = getNonce(ctx2)
      expect(nonce1).not.toBe(nonce2)

      // Cleanup
      clearNonce(ctx1)
      clearNonce(ctx2)
    })

    it('uses custom nonce generator if provided', () => {
      const config: CspConfig = {
        enabled: true,
        directives: {},
        nonceGenerator: () => 'custom-nonce-123',
      }
      const nonce = getNonce(undefined, config)
      expect(nonce).toBe('custom-nonce-123')
    })
  })

  describe('generateCspHeader', () => {
    it('generates a valid CSP header string', () => {
      const directives: CspDirectives = {
        'default-src': ['\'self\''],
        'script-src': ['\'self\'', 'https://cdn.example.com'],
      }

      const header = generateCspHeader(directives)
      expect(header).toContain('default-src \'self\'')
      expect(header).toContain('script-src \'self\' https://cdn.example.com')
      expect(header).toContain('; ')
    })

    it('handles boolean directives', () => {
      const directives: CspDirectives = {
        'default-src': ['\'self\''],
        'upgrade-insecure-requests': true,
        'block-all-mixed-content': false,
      }

      const header = generateCspHeader(directives)
      expect(header).toContain('upgrade-insecure-requests')
      expect(header).not.toContain('block-all-mixed-content')
    })

    it('injects nonce into script-src and style-src', () => {
      const directives: CspDirectives = {
        'script-src': ['\'self\''],
        'style-src': ['\'self\''],
        'img-src': ['\'self\''],
      }

      const header = generateCspHeader(directives, 'test-nonce')
      expect(header).toContain('script-src \'self\' \'nonce-test-nonce\'')
      expect(header).toContain('style-src \'self\' \'nonce-test-nonce\'')
      // Should not add nonce to img-src
      expect(header).toContain('img-src \'self\'')
      expect(header).not.toContain('img-src \'self\' \'nonce-')
    })

    it('skips undefined/null values', () => {
      const directives: CspDirectives = {
        'default-src': ['\'self\''],
        'script-src': undefined,
      }

      const header = generateCspHeader(directives)
      expect(header).not.toContain('script-src')
    })
  })

  describe('generateCspMetaTag', () => {
    it('generates a valid meta tag', () => {
      const directives: CspDirectives = {
        'default-src': ['\'self\''],
      }

      const metaTag = generateCspMetaTag(directives)
      expect(metaTag).toContain('<meta http-equiv="Content-Security-Policy"')
      expect(metaTag).toContain('content="default-src \'self\'"')
    })

    it('escapes special characters in content', () => {
      const directives: CspDirectives = {
        'default-src': ['\'self\'', 'https://example.com?foo=bar&baz=1'],
      }

      const metaTag = generateCspMetaTag(directives)
      // Ampersands in URLs should be escaped for HTML attributes
      expect(metaTag).toContain('&amp;')
    })
  })

  describe('getCspPreset', () => {
    it('returns strict preset', () => {
      const config = getCspPreset('strict')
      expect(config.enabled).toBe(true)
      expect(config.useNonce).toBe(true)
      expect(config.directives['script-src']).toContain('\'strict-dynamic\'')
    })

    it('returns moderate preset', () => {
      const config = getCspPreset('moderate')
      expect(config.enabled).toBe(true)
      expect(config.directives['style-src']).toContain('\'unsafe-inline\'')
    })

    it('returns relaxed preset', () => {
      const config = getCspPreset('relaxed')
      expect(config.directives['script-src']).toContain('\'unsafe-inline\'')
      expect(config.directives['style-src']).toContain('\'unsafe-inline\'')
    })

    it('returns api preset', () => {
      const config = getCspPreset('api')
      expect(config.directives['default-src']).toContain('\'none\'')
      expect(config.directives['frame-ancestors']).toContain('\'none\'')
    })
  })

  describe('mergeCspDirectives', () => {
    it('merges array directives', () => {
      const base: CspDirectives = {
        'default-src': ['\'self\''],
        'script-src': ['\'self\''],
      }
      const override: CspDirectives = {
        'script-src': ['https://cdn.example.com'],
        'img-src': ['https:'],
      }

      const merged = mergeCspDirectives(base, override)
      expect(merged['default-src']).toEqual(['\'self\''])
      expect(merged['script-src']).toContain('\'self\'')
      expect(merged['script-src']).toContain('https://cdn.example.com')
      expect(merged['img-src']).toEqual(['https:'])
    })

    it('deduplicates merged values', () => {
      const base: CspDirectives = {
        'script-src': ['\'self\'', 'https://cdn.example.com'],
      }
      const override: CspDirectives = {
        'script-src': ['\'self\'', 'https://other.com'],
      }

      const merged = mergeCspDirectives(base, override)
      // Should have only one 'self'
      const selfCount = merged['script-src']!.filter(s => s === '\'self\'').length
      expect(selfCount).toBe(1)
    })

    it('ORs boolean directives', () => {
      const base: CspDirectives = {
        'upgrade-insecure-requests': false,
      }
      const override: CspDirectives = {
        'upgrade-insecure-requests': true,
      }

      const merged = mergeCspDirectives(base, override)
      expect(merged['upgrade-insecure-requests']).toBe(true)
    })
  })

  describe('injectCspMetaTag', () => {
    it('injects meta tag into head', () => {
      const html = '<html><head><title>Test</title></head><body></body></html>'
      const config: CspConfig = {
        enabled: true,
        addMetaTag: true,
        directives: { 'default-src': ['\'self\''] },
      }

      const result = injectCspMetaTag(html, config)
      expect(result).toContain('http-equiv="Content-Security-Policy"')
      expect(result.indexOf('Content-Security-Policy')).toBeLessThan(result.indexOf('</head>'))
    })

    it('does not inject if disabled', () => {
      const html = '<html><head></head><body></body></html>'
      const config: CspConfig = {
        enabled: false,
        directives: { 'default-src': ['\'self\''] },
      }

      const result = injectCspMetaTag(html, config)
      expect(result).not.toContain('Content-Security-Policy')
    })

    it('does not inject if addMetaTag is false', () => {
      const html = '<html><head></head><body></body></html>'
      const config: CspConfig = {
        enabled: true,
        addMetaTag: false,
        directives: { 'default-src': ['\'self\''] },
      }

      const result = injectCspMetaTag(html, config)
      expect(result).not.toContain('Content-Security-Policy')
    })

    it('does not duplicate meta tag', () => {
      const html = '<html><head><meta http-equiv="Content-Security-Policy" content="default-src \'self\'"></head></html>'
      const config: CspConfig = {
        enabled: true,
        addMetaTag: true,
        directives: { 'default-src': ['\'self\'', 'https:'] },
      }

      const result = injectCspMetaTag(html, config)
      const matches = result.match(/Content-Security-Policy/g)
      expect(matches?.length).toBe(1)
    })

    it('does not inject if no head tag', () => {
      const html = '<div>No head here</div>'
      const config: CspConfig = {
        enabled: true,
        addMetaTag: true,
        directives: { 'default-src': ['\'self\''] },
      }

      const result = injectCspMetaTag(html, config)
      expect(result).not.toContain('Content-Security-Policy')
    })
  })

  describe('addNonceToInlineContent', () => {
    it('adds nonce to inline scripts', () => {
      const html = '<script>console.log("hello")</script>'
      const result = addNonceToInlineContent(html, 'test-nonce')
      expect(result).toContain('nonce="test-nonce"')
    })

    it('does not add nonce to scripts with src', () => {
      const html = '<script src="app.js"></script>'
      const result = addNonceToInlineContent(html, 'test-nonce')
      expect(result).not.toContain('nonce=')
    })

    it('adds nonce to style tags', () => {
      const html = '<style>body { color: red; }</style>'
      const result = addNonceToInlineContent(html, 'test-nonce')
      expect(result).toContain('nonce="test-nonce"')
    })

    it('does not duplicate nonce', () => {
      const html = '<script nonce="existing">code</script>'
      const result = addNonceToInlineContent(html, 'new-nonce')
      expect(result).toContain('nonce="existing"')
      expect(result).not.toContain('nonce="new-nonce"')
    })

    it('preserves existing attributes', () => {
      const html = '<script type="module">code</script>'
      const result = addNonceToInlineContent(html, 'test-nonce')
      expect(result).toContain('type="module"')
      expect(result).toContain('nonce="test-nonce"')
    })
  })

  describe('processCspDirectives', () => {
    it('processes @csp directive', () => {
      const template = '<head>@csp</head>'
      const context = {}
      const options = {
        csp: {
          enabled: true,
          directives: { 'default-src': ['\'self\''] },
        },
      }

      const result = processCspDirectives(template, context, 'test.stx', options)
      expect(result).toContain('Content-Security-Policy')
    })

    it('processes @cspNonce directive', () => {
      const ctx = { requestId: 'test' }
      const template = '<script nonce="@cspNonce">code</script>'
      const options = {
        csp: {
          enabled: true,
          useNonce: true,
          directives: { 'default-src': ['\'self\''] },
        },
      }

      const result = processCspDirectives(template, ctx, 'test.stx', options)
      // Should contain a nonce value (not the directive)
      expect(result).not.toContain('@cspNonce')
      expect(result).toContain('nonce="')

      clearNonce(ctx)
    })

    it('injects cspNonce into context', () => {
      const context: Record<string, any> = {}
      const template = 'test'
      const options = {
        csp: {
          enabled: true,
          useNonce: true,
          directives: { 'default-src': ['\'self\''] },
        },
      }

      processCspDirectives(template, context, 'test.stx', options)
      expect(context.cspNonce).toBeTruthy()
    })

    it('returns comment if CSP not configured', () => {
      const template = '@csp'
      const result = processCspDirectives(template, {}, 'test.stx', {})
      expect(result).toContain('CSP not configured')
    })
  })

  describe('validateCspDirectives', () => {
    it('warns about unsafe-inline in script-src', () => {
      const directives: CspDirectives = {
        'script-src': ['\'self\'', '\'unsafe-inline\''],
      }

      const warnings = validateCspDirectives(directives)
      expect(warnings.some(w => w.includes('unsafe-inline'))).toBe(true)
    })

    it('warns about unsafe-eval in script-src', () => {
      const directives: CspDirectives = {
        'script-src': ['\'self\'', '\'unsafe-eval\''],
      }

      const warnings = validateCspDirectives(directives)
      expect(warnings.some(w => w.includes('unsafe-eval'))).toBe(true)
    })

    it('warns about missing default-src', () => {
      const directives: CspDirectives = {
        'script-src': ['\'self\''],
      }

      const warnings = validateCspDirectives(directives)
      expect(warnings.some(w => w.includes('default-src'))).toBe(true)
    })

    it('warns about wildcard in default-src', () => {
      const directives: CspDirectives = {
        'default-src': ['*'],
      }

      const warnings = validateCspDirectives(directives)
      expect(warnings.some(w => w.includes('*'))).toBe(true)
    })

    it('warns about http: sources', () => {
      const directives: CspDirectives = {
        'default-src': ['\'self\''],
        'img-src': ['http:'],
      }

      const warnings = validateCspDirectives(directives)
      expect(warnings.some(w => w.includes('http:'))).toBe(true)
    })

    it('returns no warnings for strict preset', () => {
      const warnings = validateCspDirectives(strictCspPreset)
      expect(warnings.length).toBe(0)
    })
  })

  describe('getCspHeaderName', () => {
    it('returns standard header by default', () => {
      expect(getCspHeaderName()).toBe('Content-Security-Policy')
    })

    it('returns report-only header when specified', () => {
      expect(getCspHeaderName(true)).toBe('Content-Security-Policy-Report-Only')
    })
  })

  describe('createCspHeaders', () => {
    it('returns empty object if disabled', () => {
      const config: CspConfig = {
        enabled: false,
        directives: { 'default-src': ['\'self\''] },
      }

      const headers = createCspHeaders(config)
      expect(Object.keys(headers).length).toBe(0)
    })

    it('returns CSP header when enabled', () => {
      const config: CspConfig = {
        enabled: true,
        directives: { 'default-src': ['\'self\''] },
      }

      const headers = createCspHeaders(config)
      expect(headers['Content-Security-Policy']).toBeTruthy()
    })

    it('returns report-only header when configured', () => {
      const config: CspConfig = {
        enabled: true,
        reportOnly: true,
        directives: { 'default-src': ['\'self\''] },
      }

      const headers = createCspHeaders(config)
      expect(headers['Content-Security-Policy-Report-Only']).toBeTruthy()
      expect(headers['Content-Security-Policy']).toBeUndefined()
    })

    it('includes nonce when useNonce is enabled', () => {
      const ctx = { requestId: 'test' }
      const config: CspConfig = {
        enabled: true,
        useNonce: true,
        directives: {
          'script-src': ['\'self\''],
        },
      }

      const headers = createCspHeaders(config, ctx)
      expect(headers['Content-Security-Policy']).toContain('\'nonce-')

      clearNonce(ctx)
    })
  })

  describe('preset values', () => {
    it('strictCspPreset blocks unsafe patterns', () => {
      expect(strictCspPreset['script-src']).not.toContain('\'unsafe-inline\'')
      expect(strictCspPreset['script-src']).not.toContain('\'unsafe-eval\'')
      expect(strictCspPreset['object-src']).toContain('\'none\'')
    })

    it('moderateCspPreset allows inline styles', () => {
      expect(moderateCspPreset['style-src']).toContain('\'unsafe-inline\'')
      expect(moderateCspPreset['script-src']).not.toContain('\'unsafe-inline\'')
    })
  })
})
