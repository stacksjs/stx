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

  describe('PWA Audit', () => {
    const { auditConfig, calculateAuditResult, formatAuditResult } = require('../../src/pwa/audit')

    test('should audit PWA config and return checks', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test App',
            themeColor: '#4f46e5',
            backgroundColor: '#ffffff',
            display: 'standalone',
            startUrl: '/',
          },
          icons: {
            src: 'icon.png',
            sizes: [192, 512],
            purpose: ['any', 'maskable'],
          },
          serviceWorker: {
            cacheVersion: '1.0.0',
          },
          offline: { enabled: true },
        },
      }

      const checks = auditConfig(options)

      expect(checks.length).toBeGreaterThan(0)
      expect(checks.some((c: any) => c.id === 'pwa-enabled')).toBe(true)
      expect(checks.some((c: any) => c.id === 'manifest-name')).toBe(true)
    })

    test('should calculate audit score', () => {
      const checks = [
        { id: 'test1', name: 'Test 1', category: 'required', passed: true, message: 'OK' },
        { id: 'test2', name: 'Test 2', category: 'required', passed: true, message: 'OK' },
        { id: 'test3', name: 'Test 3', category: 'recommended', passed: false, message: 'Failed' },
      ]

      const result = calculateAuditResult(checks)

      expect(result.score).toBeGreaterThan(0)
      expect(result.passed).toBe(2)
      expect(result.failed).toBe(0) // Only required failures count
      expect(result.warnings).toBe(1)
    })

    test('should format audit result for console', () => {
      const result = {
        score: 85,
        passed: 10,
        failed: 1,
        warnings: 2,
        checks: [
          { id: 'test', name: 'Test', category: 'required', passed: true, message: 'OK' },
        ],
      }

      const formatted = formatAuditResult(result)

      expect(formatted).toContain('PWA Audit Report')
      expect(formatted).toContain('85/100')
    })
  })

  describe('PWA Directives', () => {
    const { pwaDirectives, pwaInstallDirective, pwaUpdateDirective, pwaOfflineDirective, pwaPushDirective } = require('../../src/pwa/directives')

    test('should export all PWA directives', () => {
      expect(pwaDirectives).toHaveLength(4)
      expect(pwaDirectives.map((d: any) => d.name)).toContain('pwa.installButton')
      expect(pwaDirectives.map((d: any) => d.name)).toContain('pwa.updatePrompt')
      expect(pwaDirectives.map((d: any) => d.name)).toContain('pwa.offlineIndicator')
      expect(pwaDirectives.map((d: any) => d.name)).toContain('pwa.pushSubscribe')
    })

    test('pwa.installButton directive should generate install button HTML', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test', themeColor: '#4f46e5' },
        },
      }
      const context = { __stx_options: options }

      const result = pwaInstallDirective.handler('<button>Install</button>', [], context, '')

      expect(result).toContain('stx-pwa-install')
      expect(result).toContain('beforeinstallprompt')
      expect(result).toContain('Install')
    })

    test('pwa.updatePrompt directive should generate update prompt HTML', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          updates: {
            message: 'Update available!',
          },
        },
      }
      const context = { __stx_options: options }

      const result = pwaUpdateDirective.handler('', [], context, '')

      expect(result).toContain('stx-pwa-update')
      expect(result).toContain('Update available!')
      expect(result).toContain('SKIP_WAITING')
    })

    test('pwa.offlineIndicator directive should generate offline indicator', () => {
      const options: StxOptions = {
        pwa: { enabled: true, manifest: { name: 'Test' } },
      }
      const context = { __stx_options: options }

      const result = pwaOfflineDirective.handler('', [], context, '')

      expect(result).toContain('stx-offline-indicator')
      expect(result).toContain('navigator.onLine')
      expect(result).toContain('You are offline')
    })

    test('pwa.pushSubscribe directive should generate push subscription button', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          push: {
            enabled: true,
            vapidPublicKey: 'test-vapid-key',
            subscriptionEndpoint: '/api/push/subscribe',
          },
        },
      }
      const context = { __stx_options: options }

      const result = pwaPushDirective.handler('<button>Subscribe</button>', [], context, '')

      expect(result).toContain('stx-pwa-push')
      expect(result).toContain('PushManager')
      expect(result).toContain('test-vapid-key')
    })
  })

  describe('Precache Manifest', () => {
    const { generatePrecacheManifestJs, formatSize } = require('../../src/pwa/precache')

    test('should generate empty precache manifest JS', () => {
      const manifest = { entries: [], totalSize: 0, fileCount: 0 }

      const js = generatePrecacheManifestJs(manifest)

      expect(js).toBe('[]')
    })

    test('should generate precache manifest JS with entries', () => {
      const manifest = {
        entries: [
          { url: '/index.html', revision: 'abc123', size: 1024 },
          { url: '/style.css', revision: 'def456', size: 2048 },
        ],
        totalSize: 3072,
        fileCount: 2,
      }

      const js = generatePrecacheManifestJs(manifest)

      expect(js).toContain('/index.html')
      expect(js).toContain('/style.css')
      expect(js).toContain('abc123')
    })

    test('formatSize should format bytes correctly', () => {
      expect(formatSize(500)).toBe('500 B')
      expect(formatSize(1024)).toBe('1.0 KB')
      expect(formatSize(1536)).toBe('1.5 KB')
      expect(formatSize(1024 * 1024)).toBe('1.00 MB')
    })
  })

  describe('Service Worker Advanced Features', () => {
    test('should include push notification handlers when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          push: {
            enabled: true,
            vapidPublicKey: 'test-key',
            defaultIcon: '/icon.png',
          },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('push')
      expect(sw).toContain('PUSH_CONFIG')
      expect(sw).toContain('showNotification')
      expect(sw).toContain('notificationclick')
    })

    test('should include background sync handlers when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          backgroundSync: {
            enabled: true,
            queueName: 'my-queue',
            maxRetries: 5,
          },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('sync')
      expect(sw).toContain('SYNC_CONFIG')
      expect(sw).toContain('my-queue')
      expect(sw).toContain('processBackgroundSync')
    })

    test('should include cache storage limits when configured', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          cacheStorage: {
            maxSize: 50,
            maxEntries: 100,
            maxAge: 7,
            purgeStrategy: 'lru',
          },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('CACHE_CONFIG')
      expect(sw).toContain('maxSize')
      expect(sw).toContain('enforceCacheLimits')
      expect(sw).toContain('purgeStrategy')
      expect(sw).toContain('lru')
    })

    test('should include message handler for SKIP_WAITING', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
        },
      }

      const sw = generateServiceWorker(options)

      expect(sw).toContain('SKIP_WAITING')
      expect(sw).toContain('self.skipWaiting()')
      expect(sw).toContain('message')
    })
  })

  describe('Manifest Advanced Features', () => {
    const { generateManifest, validateManifest } = require('../../src/pwa/manifest')

    test('should include share target when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          shareTarget: {
            enabled: true,
            action: '/share',
            method: 'POST',
            enctype: 'multipart/form-data',
            params: {
              title: 'title',
              text: 'text',
              url: 'url',
            },
          },
        },
      }

      const manifest = generateManifest(options)

      expect(manifest?.share_target).toBeDefined()
      expect(manifest?.share_target?.action).toBe('/share')
      expect(manifest?.share_target?.method).toBe('POST')
    })

    test('should include file handlers when enabled', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          fileHandlers: {
            enabled: true,
            action: '/open',
            accept: {
              'text/markdown': ['.md', '.markdown'],
            },
            launchType: 'single-client',
          },
        },
      }

      const manifest = generateManifest(options)

      expect(manifest?.file_handlers).toBeDefined()
      expect(manifest?.file_handlers?.[0].action).toBe('/open')
      expect(manifest?.file_handlers?.[0].accept['text/markdown']).toContain('.md')
    })

    test('should include protocol handlers when configured', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          protocolHandlers: [
            { protocol: 'web+myapp', url: '/handle?url=%s' },
          ],
        },
      }

      const manifest = generateManifest(options)

      expect(manifest?.protocol_handlers).toBeDefined()
      expect(manifest?.protocol_handlers?.[0].protocol).toBe('web+myapp')
    })

    test('should validate manifest configuration', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: {
            name: 'Test',
            themeColor: 'not-a-color', // Invalid
            display: 'invalid' as any, // Invalid
          },
        },
      }

      const errors = validateManifest(options)

      expect(errors.some((e: string) => e.includes('theme color'))).toBe(true)
      expect(errors.some((e: string) => e.includes('display mode'))).toBe(true)
    })

    test('should validate protocol handlers', () => {
      const options: StxOptions = {
        pwa: {
          enabled: true,
          manifest: { name: 'Test' },
          protocolHandlers: [
            { protocol: 'web+test', url: '/handle' }, // Missing %s
          ],
        },
      }

      const errors = validateManifest(options)

      expect(errors.some((e: string) => e.includes('%s'))).toBe(true)
    })
  })
})
