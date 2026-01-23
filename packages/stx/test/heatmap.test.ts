import { beforeEach, describe, expect, it } from 'bun:test'
import type { HeatmapConfig, HeatmapDataPoint, HeatmapSession } from '../src/heatmap'
import {
  createHeatmapAggregator,
  defaultHeatmapConfig,
  generateHeatmapScript,
  HeatmapAggregator,
  heatmapDirective,
  injectHeatmap,
} from '../src/heatmap'

describe('Heatmap Module', () => {
  describe('generateHeatmapScript', () => {
    it('should return empty string when heatmap is not enabled', () => {
      const result = generateHeatmapScript({})
      expect(result).toBe('')
    })

    it('should return empty string when heatmap enabled is false', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: false } })
      expect(result).toBe('')
    })

    it('should generate script when heatmap is enabled', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })
      expect(result).toContain('<!-- stx Heatmap - Privacy-Compliant Tracking -->')
      expect(result).toContain('<script>')
      expect(result).toContain('</script>')
    })

    it('should include default configuration values', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })
      expect(result).toContain('"trackMouse":true')
      expect(result).toContain('"trackClicks":true')
      expect(result).toContain('"trackScroll":true')
      expect(result).toContain('"samplingRate":100')
      expect(result).toContain('"honorDnt":true')
    })

    it('should respect custom configuration', () => {
      const result = generateHeatmapScript({
        heatmap: {
          enabled: true,
          trackMouse: false,
          trackClicks: true,
          trackScroll: false,
          samplingRate: 200,
          honorDnt: false,
          endpoint: '/api/heatmap',
          batchSize: 100,
        },
      })
      expect(result).toContain('"trackMouse":false')
      expect(result).toContain('"trackScroll":false')
      expect(result).toContain('"samplingRate":200')
      expect(result).toContain('"honorDnt":false')
      expect(result).toContain('"endpoint":"/api/heatmap"')
      expect(result).toContain('"batchSize":100')
    })

    it('should include Do Not Track check when honorDnt is true', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true, honorDnt: true } })
      expect(result).toContain('navigator.doNotTrack')
    })

    it('should include viewport constraint checks', () => {
      const result = generateHeatmapScript({
        heatmap: {
          enabled: true,
          minViewportWidth: 768,
          maxViewportWidth: 1920,
        },
      })
      expect(result).toContain('"minViewportWidth":768')
      expect(result).toContain('"maxViewportWidth":1920')
    })

    it('should include zone definitions', () => {
      const result = generateHeatmapScript({
        heatmap: {
          enabled: true,
          zones: [
            { id: 'header', selector: 'header', label: 'Header Zone' },
            { id: 'cta', selector: '.cta-button', label: 'CTA Button' },
          ],
        },
      })
      expect(result).toContain('"zones"')
      expect(result).toContain('"id":"header"')
      expect(result).toContain('"selector":"header"')
      expect(result).toContain('"id":"cta"')
    })

    it('should include debug overlay setup', () => {
      const result = generateHeatmapScript({
        heatmap: {
          enabled: true,
          debugOverlay: true,
        },
      })
      expect(result).toContain('"debugOverlay":true')
      expect(result).toContain('stx-heatmap-overlay')
    })

    it('should expose stxHeatmap API', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })
      expect(result).toContain('window.stxHeatmap')
      expect(result).toContain('getData')
      expect(result).toContain('exportJSON')
      expect(result).toContain('exportCSV')
      expect(result).toContain('flush')
      expect(result).toContain('clear')
      expect(result).toContain('track')
      expect(result).toContain('visualize')
    })

    it('should include ignore selectors', () => {
      const result = generateHeatmapScript({
        heatmap: {
          enabled: true,
          ignoreSelectors: ['.no-track', '[data-no-heatmap]'],
        },
      })
      expect(result).toContain('"ignoreSelectors"')
      expect(result).toContain('.no-track')
      expect(result).toContain('[data-no-heatmap]')
    })

    it('should include custom capture attributes', () => {
      const result = generateHeatmapScript({
        heatmap: {
          enabled: true,
          captureAttributes: ['data-component', 'data-action'],
        },
      })
      expect(result).toContain('"captureAttributes"')
      expect(result).toContain('data-component')
      expect(result).toContain('data-action')
    })
  })

  describe('injectHeatmap', () => {
    it('should not inject script when heatmap is disabled', () => {
      const html = '<html><head></head><body></body></html>'
      const result = injectHeatmap(html, {})
      expect(result).toBe(html)
    })

    it('should inject script before </body> tag', () => {
      const html = '<html><head></head><body><p>Content</p></body></html>'
      const result = injectHeatmap(html, { heatmap: { enabled: true } })
      expect(result).toContain('<!-- stx Heatmap')
      expect(result).toContain('</script>')
      expect(result).toContain('</body></html>')
      // Script should be injected before closing body tag
      expect(result.indexOf('</script>')).toBeLessThan(result.indexOf('</body>'))
    })

    it('should append to end if no body tag', () => {
      const html = '<p>Content</p>'
      const result = injectHeatmap(html, { heatmap: { enabled: true } })
      expect(result).toContain('<p>Content</p>')
      expect(result).toContain('<!-- stx Heatmap')
    })
  })

  describe('heatmapDirective', () => {
    it('should have correct properties', () => {
      expect(heatmapDirective.name).toBe('heatmap')
      expect(heatmapDirective.hasEndTag).toBe(false)
      expect(heatmapDirective.description).toBeDefined()
      expect(typeof heatmapDirective.handler).toBe('function')
    })

    it('should generate script with default config', async () => {
      const result = await heatmapDirective.handler(
        '',
        [],
        { __stx_config: { heatmap: { enabled: true } } },
        '/test.stx',
      )
      expect(result).toContain('<!-- stx Heatmap')
    })

    it('should generate script with inline configuration', async () => {
      const result = await heatmapDirective.handler(
        '',
        ['endpoint="/api/heatmap"', 'samplingRate="50"'],
        { __stx_config: {} },
        '/test.stx',
      )
      expect(result).toContain('"/api/heatmap"')
    })

    it('should parse boolean inline parameters', async () => {
      const result = await heatmapDirective.handler(
        '',
        ['trackMouse="false"', 'debugOverlay="true"'],
        { __stx_config: {} },
        '/test.stx',
      )
      expect(result).toContain('"trackMouse":false')
      expect(result).toContain('"debugOverlay":true')
    })
  })

  describe('defaultHeatmapConfig', () => {
    it('should have expected default values', () => {
      expect(defaultHeatmapConfig.enabled).toBe(false)
      expect(defaultHeatmapConfig.trackMouse).toBe(true)
      expect(defaultHeatmapConfig.trackClicks).toBe(true)
      expect(defaultHeatmapConfig.trackScroll).toBe(true)
      expect(defaultHeatmapConfig.samplingRate).toBe(100)
      expect(defaultHeatmapConfig.honorDnt).toBe(true)
      expect(defaultHeatmapConfig.batchSize).toBe(50)
      expect(defaultHeatmapConfig.maxDataPoints).toBe(1000)
      expect(defaultHeatmapConfig.sessionTimeout).toBe(30)
      expect(defaultHeatmapConfig.persistData).toBe(false)
      expect(defaultHeatmapConfig.storagePrefix).toBe('stx_heatmap')
      expect(defaultHeatmapConfig.debugOverlay).toBe(false)
    })

    it('should have default ignore selectors', () => {
      expect(defaultHeatmapConfig.ignoreSelectors).toContain('[data-heatmap-ignore]')
      expect(defaultHeatmapConfig.ignoreSelectors).toContain('.heatmap-ignore')
    })

    it('should have default capture attributes', () => {
      expect(defaultHeatmapConfig.captureAttributes).toContain('data-heatmap-id')
      expect(defaultHeatmapConfig.captureAttributes).toContain('data-track')
    })
  })

  describe('HeatmapAggregator', () => {
    let aggregator: HeatmapAggregator

    beforeEach(() => {
      aggregator = createHeatmapAggregator()
    })

    it('should start with empty state', () => {
      expect(aggregator.sessionCount).toBe(0)
      expect(aggregator.totalPoints).toBe(0)
    })

    it('should add session data', () => {
      const session: HeatmapSession = {
        sid: 'test-session-1',
        page: '/home',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 50, y: 50, type: 'click', t: Date.now() },
          { x: 25, y: 75, type: 'move', t: Date.now() },
        ],
        started: Date.now() - 10000,
        lastActivity: Date.now(),
      }

      aggregator.addSession(session)

      expect(aggregator.sessionCount).toBe(1)
      expect(aggregator.totalPoints).toBe(2)
    })

    it('should merge points for existing session', () => {
      const session1: HeatmapSession = {
        sid: 'test-session-1',
        page: '/home',
        vw: 1920,
        vh: 1080,
        points: [{ x: 50, y: 50, type: 'click', t: Date.now() }],
        started: Date.now() - 10000,
        lastActivity: Date.now() - 5000,
      }

      const session2: HeatmapSession = {
        sid: 'test-session-1',
        page: '/home',
        vw: 1920,
        vh: 1080,
        points: [{ x: 75, y: 25, type: 'move', t: Date.now() }],
        started: Date.now() - 10000,
        lastActivity: Date.now(),
      }

      aggregator.addSession(session1)
      aggregator.addSession(session2)

      expect(aggregator.sessionCount).toBe(1)
      expect(aggregator.totalPoints).toBe(2)
    })

    it('should get page data', () => {
      aggregator.addSession({
        sid: 'session-1',
        page: '/home',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 50, y: 50, type: 'click', t: Date.now() },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      aggregator.addSession({
        sid: 'session-2',
        page: '/about',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 30, y: 30, type: 'click', t: Date.now() },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const homeData = aggregator.getPageData('/home')
      const aboutData = aggregator.getPageData('/about')

      expect(homeData.length).toBe(1)
      expect(aboutData.length).toBe(1)
      expect(homeData[0].x).toBe(50)
      expect(aboutData[0].x).toBe(30)
    })

    it('should filter click data', () => {
      aggregator.addSession({
        sid: 'session-1',
        page: '/test',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 50, y: 50, type: 'click', t: Date.now() },
          { x: 25, y: 25, type: 'move', t: Date.now() },
          { x: 75, y: 75, type: 'click', t: Date.now() },
          { x: 10, y: 90, type: 'scroll', t: Date.now(), depth: 50 },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const clicks = aggregator.getClickData('/test')
      expect(clicks.length).toBe(2)
      expect(clicks.every(p => p.type === 'click')).toBe(true)
    })

    it('should filter movement data', () => {
      aggregator.addSession({
        sid: 'session-1',
        page: '/test',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 50, y: 50, type: 'click', t: Date.now() },
          { x: 25, y: 25, type: 'move', t: Date.now() },
          { x: 75, y: 75, type: 'move', t: Date.now() },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const moves = aggregator.getMovementData('/test')
      expect(moves.length).toBe(2)
      expect(moves.every(p => p.type === 'move')).toBe(true)
    })

    it('should get scroll depth data', () => {
      aggregator.addSession({
        sid: 'session-1',
        page: '/test',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 50, y: 25, type: 'scroll', t: Date.now(), depth: 25 },
          { x: 50, y: 50, type: 'scroll', t: Date.now(), depth: 50 },
          { x: 50, y: 50, type: 'scroll', t: Date.now(), depth: 50 },
          { x: 50, y: 75, type: 'scroll', t: Date.now(), depth: 75 },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const scrollData = aggregator.getScrollData('/test')
      expect(scrollData.length).toBe(3)
      expect(scrollData.find(d => d.depth === 50)?.count).toBe(2)
    })

    it('should get zone statistics', () => {
      aggregator.addSession({
        sid: 'session-1',
        page: '/test',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 50, y: 50, type: 'click', t: Date.now(), zone: 'header' },
          { x: 50, y: 50, type: 'move', t: Date.now(), zone: 'header' },
          { x: 50, y: 50, type: 'move', t: Date.now(), zone: 'header' },
          { x: 75, y: 75, type: 'click', t: Date.now(), zone: 'cta' },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const zoneStats = aggregator.getZoneStats('/test')
      expect(zoneStats.get('header')?.clicks).toBe(1)
      expect(zoneStats.get('header')?.hovers).toBe(2)
      expect(zoneStats.get('cta')?.clicks).toBe(1)
      expect(zoneStats.get('cta')?.hovers).toBe(0)
    })

    it('should generate grid data', () => {
      aggregator.addSession({
        sid: 'session-1',
        page: '/test',
        vw: 1920,
        vh: 1080,
        points: [
          { x: 10, y: 10, type: 'click', t: Date.now() },
          { x: 90, y: 90, type: 'click', t: Date.now() },
        ],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const gridData = aggregator.generateGridData('/test', 10)
      expect(gridData.length).toBe(10)
      expect(gridData[0].length).toBe(10)

      // Points should be in correct grid cells
      expect(gridData[1][1].intensity).toBeGreaterThan(0)
      expect(gridData[9][9].intensity).toBeGreaterThan(0)
    })

    it('should export data as JSON', () => {
      aggregator.addSession({
        sid: 'test-session',
        page: '/home',
        vw: 1920,
        vh: 1080,
        points: [{ x: 50, y: 50, type: 'click', t: Date.now() }],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      const json = aggregator.exportJSON()
      const parsed = JSON.parse(json)

      expect(parsed.sessions).toBeDefined()
      expect(parsed.sessions.length).toBe(1)
      expect(parsed.exportedAt).toBeDefined()
    })

    it('should clear all data', () => {
      aggregator.addSession({
        sid: 'test-session',
        page: '/home',
        vw: 1920,
        vh: 1080,
        points: [{ x: 50, y: 50, type: 'click', t: Date.now() }],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      expect(aggregator.sessionCount).toBe(1)
      aggregator.clear()
      expect(aggregator.sessionCount).toBe(0)
      expect(aggregator.totalPoints).toBe(0)
    })
  })

  describe('createHeatmapAggregator', () => {
    it('should create a new aggregator instance', () => {
      const aggregator = createHeatmapAggregator()
      expect(aggregator).toBeInstanceOf(HeatmapAggregator)
    })

    it('should create independent instances', () => {
      const aggregator1 = createHeatmapAggregator()
      const aggregator2 = createHeatmapAggregator()

      aggregator1.addSession({
        sid: 'session-1',
        page: '/test',
        vw: 1920,
        vh: 1080,
        points: [{ x: 50, y: 50, type: 'click', t: Date.now() }],
        started: Date.now(),
        lastActivity: Date.now(),
      })

      expect(aggregator1.sessionCount).toBe(1)
      expect(aggregator2.sessionCount).toBe(0)
    })
  })

  describe('Privacy Compliance', () => {
    it('should not include PII in generated script', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })

      // Should not contain any references to cookies, user IDs, or personal data
      expect(result).not.toContain('document.cookie')
      expect(result).not.toContain('userId')
      expect(result).not.toContain('userEmail')
      expect(result).not.toContain('password')
      expect(result).not.toContain('fingerprint')
      expect(result).not.toContain('ipAddress')
      // localStorage is used for anonymous session persistence only, not PII storage
      expect(result).not.toContain('sessionStorage')
    })

    it('should use anonymous session IDs', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })
      // Session ID should be generated with Math.random, not user-identifiable
      expect(result).toContain('Math.random().toString(36)')
    })

    it('should strip query params from page URL', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })
      expect(result).toContain('location.pathname')
      // Should not include query string which might contain PII
      expect(result).not.toContain('location.search')
      expect(result).not.toContain('location.href')
    })

    it('should only capture safe element selectors', () => {
      const result = generateHeatmapScript({ heatmap: { enabled: true } })
      // getSelector function should not capture IDs (which might be user-specific)
      expect(result).toContain('el.tagName')
      expect(result).toContain('el.className')
      // Should not capture element IDs
      expect(result).not.toContain('el.id')
    })
  })
})
