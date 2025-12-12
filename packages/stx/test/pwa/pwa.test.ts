/**
 * PWA (Progressive Web App) Test Suite
 *
 * Tests for:
 * - Manifest generation
 * - Service worker generation
 * - PWA tag injection
 * - Offline page generation
 * - Configuration validation
 */

import type { StxOptions } from '../../src/types'
import { describe, expect, test } from 'bun:test'
import { validateConfig } from '../../src/config'
import { isPwaEnabled } from '../../src/pwa'
import { getExpectedIconPaths } from '../../src/pwa/icons'
import { generatePwaTags, injectPwaTags } from '../../src/pwa/inject'
import { generateManifest, generateManifestJson } from '../../src/pwa/manifest'
import { generateOfflinePage } from '../../src/pwa/offline'
import { generateServiceWorker, getServiceWorkerFileName } from '../../src/pwa/service-worker'

describe('PWA Module', () => {
  describe('Manifest Generation', () => {
    test('should generate valid manifest with required fields', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test App',
            shortName: 'Test',
            themeColor: '#4f46e5',
            backgroundColor: '#ffffff',
          },
          icons: {
            src: 'icon.png',
            sizes: [192, 512],
          },
        },
      }

      const manifest = generateManifest(options)

      expect(manifest).not.toBeNull()
      expect(manifest?.name).toBe('Test App')
      expect(manifest?.short_name).toBe('Test')
      expect(manifest?.theme_color).toBe('#4f46e5')
      expect(manifest?.background_color).toBe('#ffffff')
      expect(manifest?.display).toBe('standalone')
      expect(manifest?.start_url).toBe('/')
      expect(manifest?.icons.length).toBeGreaterThan(0)
    })

    test('should use name as short_name if not provided', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'My Application',
          },
        },
      }

      const manifest = generateManifest(options)

      expect(manifest?.short_name).toBe('My Application')
    })

    test('should generate manifest JSON string', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test',
            themeColor: '#000',
          },
        },
      }

      const json = generateManifestJson(options)

      expect(json).toBeTruthy()
      const parsed = JSON.parse(json)
      expect(parsed.name).toBe('Test')
    })

    test('should return empty string when PWA is disabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: false,
          manifest: { name: 'Test' },
        },
      }

      const json = generateManifestJson(options)
      expect(json).toBe('')
    })

    test('should return null manifest when PWA is disabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: false,
          manifest: { name: 'Test' },
        },
      }

      const manifest = generateManifest(options)
      expect(manifest).toBeNull()
    })

    test('should include shortcuts when configured', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test',
            shortcuts: [
              { name: 'Home', url: '/' },
              { name: 'Settings', url: '/settings', shortName: 'Config' },
            ],
          },
        },
      }

      const manifest = generateManifest(options)

      expect(manifest?.shortcuts).toHaveLength(2)
      expect(manifest?.shortcuts?.[0].name).toBe('Home')
      expect(manifest?.shortcuts?.[1].short_name).toBe('Config')
    })

    test('should include screenshots when configured', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test',
            screenshots: [
              { src: '/screenshot1.png', sizes: '1280x720', platform: 'wide' },
              { src: '/screenshot2.png', sizes: '750x1334', platform: 'narrow' },
            ],
          },
        },
      }

      const manifest = generateManifest(options)

      expect(manifest?.screenshots).toHaveLength(2)
      expect(manifest?.screenshots?.[0].form_factor).toBe('wide')
    })

    test('should generate icons with correct sizes', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          icons: {
            src: 'icon.png',
            sizes: [72, 192, 512],
            generateWebP: true,
            purpose: ['any', 'maskable'],
          },
        },
      }

      const manifest = generateManifest(options)

      // Should have 6 icons: 3 PNG + 3 WebP
      expect(manifest?.icons.length).toBe(6)

      // Check that sizes are correct
      const sizes = manifest?.icons.map(i => i.sizes)
      expect(sizes).toContain('72x72')
      expect(sizes).toContain('192x192')
      expect(sizes).toContain('512x512')

      // Check purpose
      expect(manifest?.icons[0].purpose).toBe('any maskable')
    })
  })

  describe('Service Worker Generation', () => {
    test('should generate service worker with cache strategies', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          routes: [
            { pattern: '/', strategy: 'network-first' },
            { pattern: '/static/*', strategy: 'cache-first' },
            { pattern: '/api/*', strategy: 'network-only' },
          ],
          serviceWorker: {
            cacheVersion: '1.0.0',
            skipWaiting: true,
            clientsClaim: true,
          },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('CACHE_VERSION = \'1.0.0\'')
      expect(sw).toContain('network-first')
      expect(sw).toContain('cache-first')
      expect(sw).toContain('network-only')
      expect(sw).toContain('self.skipWaiting()')
      expect(sw).toContain('self.clients.claim()')
    })

    test('should return empty string when PWA is disabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: false,
          manifest: { name: 'Test' },
        },
      }

      const sw = generateServiceWorker(options)
      expect(sw).toBe('')
    })

    test('should use default service worker filename', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
        },
      }

      expect(getServiceWorkerFileName(options)).toBe('sw.js')
    })

    test('should use custom service worker filename', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            fileName: 'service-worker.js',
          },
        },
      }

      expect(getServiceWorkerFileName(options)).toBe('service-worker.js')
    })

    test('should include excluded routes', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          serviceWorker: {
            excludeRoutes: ['/api/auth/*', '/admin/*'],
          },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('/api/auth/*')
      expect(sw).toContain('/admin/*')
    })

    test('should include precache assets', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          offline: {
            enabled: true,
            precacheAssets: ['/styles.css', '/app.js'],
          },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('/styles.css')
      expect(sw).toContain('/app.js')
    })
  })

  describe('PWA Tag Injection', () => {
    test('should generate PWA tags', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test App',
            shortName: 'Test',
            themeColor: '#4f46e5',
          },
        },
      }

      const tags = generatePwaTags(options)

      expect(tags).toContain('<!-- stx PWA Meta Tags -->')
      expect(tags).toContain('<link rel="manifest" href="/manifest.json">')
      expect(tags).toContain('content="#4f46e5"')
      expect(tags).toContain('apple-mobile-web-app-title')
      expect(tags).toContain('navigator.serviceWorker.register')
    })

    test('should return empty string when PWA is disabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: false,
          manifest: { name: 'Test' },
        },
      }

      const tags = generatePwaTags(options)
      expect(tags).toBe('')
    })

    test('should inject PWA tags into HTML head', () => {
      const html = '<html><head><title>Test</title></head><body></body></html>'
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test', themeColor: '#000' },
          autoInject: true,
        },
      }

      const result = injectPwaTags(html, options)

      expect(result).toContain('<!-- stx PWA Meta Tags -->')
      expect(result).toContain('<link rel="manifest"')
      expect(result).toContain('</head>')
    })

    test('should not inject when disabled', () => {
      const html = '<html><head></head><body></body></html>'
      const options: StxOptions = {
        pwa: {
          enabled: false,
          manifest: { name: 'Test' },
        },
      }

      const result = injectPwaTags(html, options)

      expect(result).not.toContain('<!-- stx PWA Meta Tags -->')
      expect(result).toBe(html)
    })

    test('should not inject when autoInject is false', () => {
      const html = '<html><head></head><body></body></html>'
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          autoInject: false,
        },
      }

      const result = injectPwaTags(html, options)

      expect(result).not.toContain('<!-- stx PWA Meta Tags -->')
    })

    test('should not double-inject PWA tags', () => {
      const html = '<html><head><!-- stx PWA Meta Tags --></head><body></body></html>'
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          autoInject: true,
        },
      }

      const result = injectPwaTags(html, options)

      // Count occurrences of the marker
      const matches = result.match(/<!-- stx PWA Meta Tags -->/g)
      expect(matches?.length).toBe(1)
    })

    test('should include apple touch icons when configured', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          icons: {
            src: 'icon.png',
            generateAppleIcons: true,
          },
        },
      }

      const tags = generatePwaTags(options)

      expect(tags).toContain('apple-touch-icon')
      expect(tags).toContain('apple-touch-icon-180x180.png')
    })
  })

  describe('Offline Page Generation', () => {
    test('should generate default offline page', async () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test App', themeColor: '#4f46e5' },
          offline: {
            enabled: true,
            fallbackTitle: 'Offline',
            fallbackMessage: 'Check your connection',
          },
        },
      }

      const html = await generateOfflinePage(options)

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('Offline')
      expect(html).toContain('Check your connection')
      expect(html).toContain('#4f46e5')
      expect(html).toContain('window.location.reload()')
    })

    test('should return empty string when offline is disabled', async () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          offline: {
            enabled: false,
          },
        },
      }

      const html = await generateOfflinePage(options)
      expect(html).toBe('')
    })

    test('should use default title and message when not specified', async () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          offline: {
            enabled: true,
          },
        },
      }

      const html = await generateOfflinePage(options)

      expect(html).toContain('You are offline')
      expect(html).toContain('Please check your internet connection')
    })

    test('should include auto-reconnect script', async () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          offline: { enabled: true },
        },
      }

      const html = await generateOfflinePage(options)

      expect(html).toContain('addEventListener(\'online\'')
      expect(html).toContain('updateStatus')
    })
  })

  describe('Icon Path Generation', () => {
    test('should return expected icon paths', () => {
      const config = {
        src: 'icon.png',
        sizes: [192, 512],
        generateWebP: true,
        generateAppleIcons: true,
        outputDir: 'pwa-icons',
      }

      const paths = getExpectedIconPaths(config)

      expect(paths).toContain('/pwa-icons/icon-192x192.png')
      expect(paths).toContain('/pwa-icons/icon-512x512.png')
      expect(paths).toContain('/pwa-icons/icon-192x192.webp')
      expect(paths).toContain('/pwa-icons/apple-touch-icon.png')
      expect(paths).toContain('/pwa-icons/favicon-32x32.png')
    })

    test('should not include WebP when disabled', () => {
      const config = {
        src: 'icon.png',
        sizes: [192],
        generateWebP: false,
      }

      const paths = getExpectedIconPaths(config)

      expect(paths.some(p => p.endsWith('.webp'))).toBe(false)
    })

    test('should not include apple icons when disabled', () => {
      const config = {
        src: 'icon.png',
        sizes: [192],
        generateAppleIcons: false,
      }

      const paths = getExpectedIconPaths(config)

      expect(paths.some(p => p.includes('apple-touch-icon'))).toBe(false)
    })
  })

  describe('Configuration Validation', () => {
    test('should validate PWA manifest name is required when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {} as any, // Missing name
        },
      }

      const result = validateConfig(options)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.path.includes('pwa.manifest.name'))).toBe(true)
    })

    test('should validate display mode', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test',
            display: 'invalid' as any,
          },
        },
      }

      const result = validateConfig(options)

      expect(result.errors.some(e => e.path === 'pwa.manifest.display')).toBe(true)
    })

    test('should validate cache strategies', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          routes: [
            { pattern: '/', strategy: 'invalid-strategy' as any },
          ],
        },
      }

      const result = validateConfig(options)

      expect(result.errors.some(e => e.path.includes('strategy'))).toBe(true)
    })

    test('should validate icon sizes', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          icons: {
            src: 'icon.png',
            sizes: [10, 2000], // Invalid sizes
          },
        },
      }

      const result = validateConfig(options)

      expect(result.errors.some(e => e.path === 'pwa.icons.sizes')).toBe(true)
    })

    test('should warn about missing icon source', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          icons: {}, // Missing src
        },
      }

      const result = validateConfig(options)

      expect(result.warnings.some(w => w.path === 'pwa.icons.src')).toBe(true)
    })

    test('should pass validation with valid config', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test App',
            shortName: 'Test',
            display: 'standalone',
            themeColor: '#4f46e5',
          },
          icons: {
            src: 'icon.png',
            sizes: [192, 512],
          },
          routes: [
            { pattern: '/', strategy: 'network-first' },
          ],
        },
      }

      const result = validateConfig(options)

      // Should have no errors (warnings are ok)
      expect(result.errors.length).toBe(0)
    })
  })

  describe('Utility Functions', () => {
    test('isPwaEnabled should return true when enabled', () => {
      const options: StxOptions = {
        pwa: { enabled: true, manifest: { name: 'Test' } },
      }

      expect(isPwaEnabled(options)).toBe(true)
    })

    test('isPwaEnabled should return false when disabled', () => {
      const options: StxOptions = {
        pwa: { enabled: false, manifest: { name: 'Test' } },
      }

      expect(isPwaEnabled(options)).toBe(false)
    })

    test('isPwaEnabled should return false when pwa is undefined', () => {
      const options: StxOptions = {}

      expect(isPwaEnabled(options)).toBe(false)
    })
  })
})
