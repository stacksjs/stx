import type { CustomDirective, StxOptions } from './types'

/**
 * Heatmap Module
 *
 * Privacy-compliant heatmap tracking library that tracks user interactions
 * without collecting personally identifiable information (PII).
 *
 * ## Features
 * - Mouse movement tracking
 * - Click tracking
 * - Scroll depth tracking
 * - Privacy compliant (no PII, no cookies by default)
 * - Configurable sampling rates
 * - Export data for analysis
 *
 * ## Configuration
 *
 * Heatmap can be configured in `stx.config.ts`:
 * ```typescript
 * export default {
 *   heatmap: {
 *     enabled: true,
 *     trackMouse: true,
 *     trackClicks: true,
 *     trackScroll: true,
 *     samplingRate: 100, // Track every 100ms
 *     honorDnt: true,
 *     endpoint: '/api/heatmap'
 *   }
 * }
 * ```
 */

/**
 * Heatmap tracking configuration
 */
export interface HeatmapConfig {
  /** Enable heatmap tracking */
  enabled: boolean
  /** Track mouse movements */
  trackMouse?: boolean
  /** Track click events */
  trackClicks?: boolean
  /** Track scroll depth */
  trackScroll?: boolean
  /** Sampling rate in milliseconds for mouse tracking (default: 100ms) */
  samplingRate?: number
  /** Honor Do Not Track browser setting */
  honorDnt?: boolean
  /** API endpoint for sending heatmap data */
  endpoint?: string
  /** Batch size before sending data (default: 50) */
  batchSize?: number
  /** Maximum data points to store locally (default: 1000) */
  maxDataPoints?: number
  /** Session timeout in minutes (default: 30) */
  sessionTimeout?: number
  /** Enable local storage for offline data */
  persistData?: boolean
  /** Storage key prefix (default: 'stx_heatmap') */
  storagePrefix?: string
  /** Custom data attributes to capture on clicks */
  captureAttributes?: string[]
  /** Element selectors to ignore */
  ignoreSelectors?: string[]
  /** Zone definitions for grouped tracking */
  zones?: HeatmapZone[]
  /** Enable visual overlay for development */
  debugOverlay?: boolean
  /** Minimum viewport width to track (mobile optimization) */
  minViewportWidth?: number
  /** Maximum viewport width to track */
  maxViewportWidth?: number
}

/**
 * Zone definition for grouped tracking
 */
export interface HeatmapZone {
  /** Zone identifier */
  id: string
  /** CSS selector for the zone */
  selector: string
  /** Zone label for reports */
  label?: string
}

/**
 * Heatmap data point
 */
export interface HeatmapDataPoint {
  /** X coordinate (percentage of viewport) */
  x: number
  /** Y coordinate (percentage of viewport) */
  y: number
  /** Type of interaction */
  type: 'move' | 'click' | 'scroll'
  /** Timestamp */
  t: number
  /** Element selector (for clicks) */
  el?: string
  /** Zone ID if within a defined zone */
  zone?: string
  /** Scroll depth percentage (for scroll events) */
  depth?: number
  /** Custom attributes captured */
  attrs?: Record<string, string>
}

/**
 * Heatmap session data
 */
export interface HeatmapSession {
  /** Anonymous session ID */
  sid: string
  /** Page URL (path only, no query params for privacy) */
  page: string
  /** Viewport width */
  vw: number
  /** Viewport height */
  vh: number
  /** Data points */
  points: HeatmapDataPoint[]
  /** Session start time */
  started: number
  /** Last activity time */
  lastActivity: number
}

/**
 * Default heatmap configuration
 */
export const defaultHeatmapConfig: HeatmapConfig = {
  enabled: false,
  trackMouse: true,
  trackClicks: true,
  trackScroll: true,
  samplingRate: 100,
  honorDnt: true,
  batchSize: 50,
  maxDataPoints: 1000,
  sessionTimeout: 30,
  persistData: false,
  storagePrefix: 'stx_heatmap',
  captureAttributes: ['data-heatmap-id', 'data-track'],
  ignoreSelectors: ['[data-heatmap-ignore]', '.heatmap-ignore'],
  debugOverlay: false,
}

/**
 * Generate heatmap tracking script based on configuration
 */
export function generateHeatmapScript(options: StxOptions): string {
  const config = options.heatmap
  if (!config?.enabled) {
    return ''
  }

  const mergedConfig = { ...defaultHeatmapConfig, ...config }

  return `
<!-- stx Heatmap - Privacy-Compliant Tracking -->
<script>
(function() {
  'use strict';

  // Configuration
  var config = ${JSON.stringify({
    trackMouse: mergedConfig.trackMouse,
    trackClicks: mergedConfig.trackClicks,
    trackScroll: mergedConfig.trackScroll,
    samplingRate: mergedConfig.samplingRate,
    honorDnt: mergedConfig.honorDnt,
    endpoint: mergedConfig.endpoint,
    batchSize: mergedConfig.batchSize,
    maxDataPoints: mergedConfig.maxDataPoints,
    sessionTimeout: mergedConfig.sessionTimeout,
    persistData: mergedConfig.persistData,
    storagePrefix: mergedConfig.storagePrefix,
    captureAttributes: mergedConfig.captureAttributes,
    ignoreSelectors: mergedConfig.ignoreSelectors,
    zones: mergedConfig.zones,
    debugOverlay: mergedConfig.debugOverlay,
    minViewportWidth: mergedConfig.minViewportWidth,
    maxViewportWidth: mergedConfig.maxViewportWidth,
  })};

  // Check Do Not Track
  if (config.honorDnt && navigator.doNotTrack === '1') {
    return;
  }

  // Check viewport constraints
  var vw = window.innerWidth;
  if (config.minViewportWidth && vw < config.minViewportWidth) return;
  if (config.maxViewportWidth && vw > config.maxViewportWidth) return;

  // Session management (anonymous, no cookies)
  var session = {
    sid: Math.random().toString(36).slice(2) + Date.now().toString(36),
    page: location.pathname,
    vw: window.innerWidth,
    vh: window.innerHeight,
    points: [],
    started: Date.now(),
    lastActivity: Date.now()
  };

  // Throttle helper
  var lastMove = 0;
  function throttle(fn, wait) {
    return function() {
      var now = Date.now();
      if (now - lastMove >= wait) {
        lastMove = now;
        fn.apply(this, arguments);
      }
    };
  }

  // Get relative coordinates (percentage)
  function getRelativeCoords(e) {
    return {
      x: Math.round((e.clientX / window.innerWidth) * 10000) / 100,
      y: Math.round((e.clientY / window.innerHeight) * 10000) / 100
    };
  }

  // Check if element should be ignored
  function shouldIgnore(el) {
    if (!el || !config.ignoreSelectors) return false;
    for (var i = 0; i < config.ignoreSelectors.length; i++) {
      if (el.matches && el.matches(config.ignoreSelectors[i])) return true;
      if (el.closest && el.closest(config.ignoreSelectors[i])) return true;
    }
    return false;
  }

  // Get element selector (simplified, no IDs to preserve privacy)
  function getSelector(el) {
    if (!el || !el.tagName) return null;
    var tag = el.tagName.toLowerCase();
    var classes = el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.')
      : '';
    return tag + classes;
  }

  // Find zone for element
  function findZone(el) {
    if (!config.zones || !el) return null;
    for (var i = 0; i < config.zones.length; i++) {
      var zone = config.zones[i];
      if (el.closest && el.closest(zone.selector)) {
        return zone.id;
      }
    }
    return null;
  }

  // Capture custom attributes
  function captureAttributes(el) {
    if (!config.captureAttributes || !el) return null;
    var attrs = {};
    var hasAttrs = false;
    for (var i = 0; i < config.captureAttributes.length; i++) {
      var attr = config.captureAttributes[i];
      var value = el.getAttribute && el.getAttribute(attr);
      if (value) {
        attrs[attr] = value;
        hasAttrs = true;
      }
    }
    return hasAttrs ? attrs : null;
  }

  // Add data point
  function addPoint(point) {
    session.lastActivity = Date.now();
    if (session.points.length >= config.maxDataPoints) {
      session.points.shift();
    }
    session.points.push(point);

    // Send batch if threshold reached
    if (config.endpoint && session.points.length >= config.batchSize) {
      sendData();
    }
  }

  // Send data to endpoint
  function sendData() {
    if (!config.endpoint || session.points.length === 0) return;

    var data = {
      sid: session.sid,
      page: session.page,
      vw: session.vw,
      vh: session.vh,
      points: session.points.splice(0, config.batchSize)
    };

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(config.endpoint, JSON.stringify(data));
    } else {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', config.endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    }
  }

  // Mouse move handler
  if (config.trackMouse) {
    document.addEventListener('mousemove', throttle(function(e) {
      if (shouldIgnore(e.target)) return;
      var coords = getRelativeCoords(e);
      addPoint({
        x: coords.x,
        y: coords.y,
        type: 'move',
        t: Date.now(),
        zone: findZone(e.target)
      });
    }, config.samplingRate), { passive: true });
  }

  // Click handler
  if (config.trackClicks) {
    document.addEventListener('click', function(e) {
      if (shouldIgnore(e.target)) return;
      var coords = getRelativeCoords(e);
      var point = {
        x: coords.x,
        y: coords.y,
        type: 'click',
        t: Date.now(),
        el: getSelector(e.target),
        zone: findZone(e.target)
      };
      var attrs = captureAttributes(e.target);
      if (attrs) point.attrs = attrs;
      addPoint(point);
    }, { passive: true });
  }

  // Scroll handler
  if (config.trackScroll) {
    var lastScrollDepth = 0;
    document.addEventListener('scroll', throttle(function() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      var depth = scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;

      // Only track significant scroll changes (every 10%)
      if (Math.abs(depth - lastScrollDepth) >= 10) {
        lastScrollDepth = depth;
        addPoint({
          x: 50,
          y: depth,
          type: 'scroll',
          t: Date.now(),
          depth: depth
        });
      }
    }, config.samplingRate * 2), { passive: true });
  }

  // Send remaining data on page unload
  window.addEventListener('beforeunload', sendData);
  window.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
      sendData();
    }
  });

  // Persist data to localStorage if enabled
  if (config.persistData) {
    var storageKey = config.storagePrefix + '_' + session.page.replace(/\\//g, '_');

    // Load existing data
    try {
      var stored = localStorage.getItem(storageKey);
      if (stored) {
        var parsed = JSON.parse(stored);
        if (Date.now() - parsed.lastActivity < config.sessionTimeout * 60000) {
          session.points = parsed.points || [];
        }
      }
    } catch (e) {}

    // Save periodically
    setInterval(function() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          points: session.points,
          lastActivity: session.lastActivity
        }));
      } catch (e) {}
    }, 5000);
  }

  // Debug overlay
  if (config.debugOverlay) {
    var overlay = document.createElement('div');
    overlay.id = 'stx-heatmap-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;';
    document.body.appendChild(overlay);

    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'width:100%;height:100%;';
    overlay.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    function renderOverlay() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      session.points.forEach(function(p) {
        var x = (p.x / 100) * canvas.width;
        var y = (p.y / 100) * canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, p.type === 'click' ? 8 : 3, 0, Math.PI * 2);
        ctx.fillStyle = p.type === 'click' ? 'rgba(255,0,0,0.5)' : 'rgba(0,0,255,0.2)';
        ctx.fill();
      });
      requestAnimationFrame(renderOverlay);
    }
    renderOverlay();

    window.addEventListener('resize', function() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  }

  // Expose API for manual tracking and data export
  window.stxHeatmap = {
    // Get current session data
    getData: function() {
      return {
        sid: session.sid,
        page: session.page,
        vw: session.vw,
        vh: session.vh,
        points: session.points.slice(),
        started: session.started,
        lastActivity: session.lastActivity
      };
    },
    // Export data as JSON
    exportJSON: function() {
      return JSON.stringify(this.getData(), null, 2);
    },
    // Export data as CSV
    exportCSV: function() {
      var data = this.getData();
      var lines = ['x,y,type,timestamp,element,zone,depth'];
      data.points.forEach(function(p) {
        lines.push([p.x, p.y, p.type, p.t, p.el || '', p.zone || '', p.depth || ''].join(','));
      });
      return lines.join('\\n');
    },
    // Manual data send
    flush: function() {
      sendData();
    },
    // Clear data
    clear: function() {
      session.points = [];
      if (config.persistData) {
        var storageKey = config.storagePrefix + '_' + session.page.replace(/\\//g, '_');
        try { localStorage.removeItem(storageKey); } catch (e) {}
      }
    },
    // Add custom event
    track: function(type, data) {
      addPoint({
        x: data && data.x || 0,
        y: data && data.y || 0,
        type: type,
        t: Date.now(),
        attrs: data
      });
    },
    // Generate heatmap visualization
    visualize: function(options) {
      options = options || {};
      var data = this.getData();
      var width = options.width || data.vw;
      var height = options.height || data.vh;
      var radius = options.radius || 20;
      var blur = options.blur || 15;
      var maxOpacity = options.maxOpacity || 0.6;

      var canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      var ctx = canvas.getContext('2d');

      // Create heat points
      data.points.forEach(function(p) {
        var x = (p.x / 100) * width;
        var y = (p.y / 100) * height;
        var intensity = p.type === 'click' ? 1 : 0.3;

        var gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(255,0,0,' + intensity + ')');
        gradient.addColorStop(1, 'rgba(255,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });

      // Apply blur
      ctx.filter = 'blur(' + blur + 'px)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';

      // Colorize
      var imageData = ctx.getImageData(0, 0, width, height);
      var pixels = imageData.data;
      for (var i = 0; i < pixels.length; i += 4) {
        var alpha = pixels[i + 3];
        if (alpha > 0) {
          var ratio = alpha / 255;
          // Gradient: blue -> cyan -> green -> yellow -> red
          if (ratio < 0.25) {
            pixels[i] = 0;
            pixels[i + 1] = Math.round(ratio * 4 * 255);
            pixels[i + 2] = 255;
          } else if (ratio < 0.5) {
            pixels[i] = 0;
            pixels[i + 1] = 255;
            pixels[i + 2] = Math.round((1 - (ratio - 0.25) * 4) * 255);
          } else if (ratio < 0.75) {
            pixels[i] = Math.round((ratio - 0.5) * 4 * 255);
            pixels[i + 1] = 255;
            pixels[i + 2] = 0;
          } else {
            pixels[i] = 255;
            pixels[i + 1] = Math.round((1 - (ratio - 0.75) * 4) * 255);
            pixels[i + 2] = 0;
          }
          pixels[i + 3] = Math.round(alpha * maxOpacity);
        }
      }
      ctx.putImageData(imageData, 0, 0);

      return canvas;
    }
  };
})();
</script>
`
}

/**
 * Inject heatmap script into HTML
 * Scripts are injected just before </body> for optimal loading
 */
export function injectHeatmap(html: string, options: StxOptions): string {
  const heatmapScript = generateHeatmapScript(options)

  if (!heatmapScript) {
    return html
  }

  // Check if document has a body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${heatmapScript}</body>`)
  }

  // Append to end as fallback
  return html + heatmapScript
}

/**
 * Custom @heatmap directive for explicit placement
 */
export const heatmapDirective: CustomDirective = {
  name: 'heatmap',
  hasEndTag: false,
  description: 'Inject privacy-compliant heatmap tracking script',
  handler: async (
    _content: string,
    params: string[],
    context: Record<string, any>,
    _filePath: string,
  ): Promise<string> => {
    const options = context.__stx_config as StxOptions || {}

    // Allow inline configuration override
    if (params.length > 0) {
      const inlineConfig = parseInlineConfig(params.join(' '))
      options.heatmap = { ...options.heatmap, ...inlineConfig, enabled: true }
    }

    return generateHeatmapScript(options)
  },
}

/**
 * Parse inline heatmap configuration from directive parameters
 */
function parseInlineConfig(paramsStr: string): Partial<HeatmapConfig> {
  const config: Partial<HeatmapConfig> = {}

  // Parse key=value pairs
  const pairs = paramsStr.match(/(\w+)=["']?([^"'\s]+)["']?/g) || []
  for (const pair of pairs) {
    const [key, value] = pair.split('=')
    const cleanValue = value?.replace(/["']/g, '')

    switch (key) {
      case 'endpoint':
        config.endpoint = cleanValue
        break
      case 'samplingRate':
        config.samplingRate = Number.parseInt(cleanValue, 10)
        break
      case 'batchSize':
        config.batchSize = Number.parseInt(cleanValue, 10)
        break
      case 'trackMouse':
        config.trackMouse = cleanValue === 'true'
        break
      case 'trackClicks':
        config.trackClicks = cleanValue === 'true'
        break
      case 'trackScroll':
        config.trackScroll = cleanValue === 'true'
        break
      case 'honorDnt':
        config.honorDnt = cleanValue === 'true'
        break
      case 'debugOverlay':
        config.debugOverlay = cleanValue === 'true'
        break
    }
  }

  return config
}

/**
 * Server-side heatmap data aggregator
 * For processing collected heatmap data into visualizations
 */
export class HeatmapAggregator {
  private sessions: Map<string, HeatmapSession> = new Map()

  /**
   * Add session data
   */
  addSession(data: HeatmapSession): void {
    const existing = this.sessions.get(data.sid)
    if (existing) {
      existing.points.push(...data.points)
      existing.lastActivity = Math.max(existing.lastActivity, data.lastActivity)
    }
    else {
      this.sessions.set(data.sid, data)
    }
  }

  /**
   * Get aggregated data for a page
   */
  getPageData(page: string): HeatmapDataPoint[] {
    const points: HeatmapDataPoint[] = []
    for (const session of this.sessions.values()) {
      if (session.page === page) {
        points.push(...session.points)
      }
    }
    return points
  }

  /**
   * Get click heatmap data
   */
  getClickData(page: string): HeatmapDataPoint[] {
    return this.getPageData(page).filter(p => p.type === 'click')
  }

  /**
   * Get movement heatmap data
   */
  getMovementData(page: string): HeatmapDataPoint[] {
    return this.getPageData(page).filter(p => p.type === 'move')
  }

  /**
   * Get scroll depth data
   */
  getScrollData(page: string): { depth: number, count: number }[] {
    const scrollPoints = this.getPageData(page).filter(p => p.type === 'scroll')
    const depthCounts = new Map<number, number>()

    for (const point of scrollPoints) {
      if (point.depth !== undefined) {
        depthCounts.set(point.depth, (depthCounts.get(point.depth) || 0) + 1)
      }
    }

    return Array.from(depthCounts.entries())
      .map(([depth, count]) => ({ depth, count }))
      .sort((a, b) => a.depth - b.depth)
  }

  /**
   * Get zone interaction statistics
   */
  getZoneStats(page: string): Map<string, { clicks: number, hovers: number }> {
    const stats = new Map<string, { clicks: number, hovers: number }>()
    const points = this.getPageData(page)

    for (const point of points) {
      if (point.zone) {
        const existing = stats.get(point.zone) || { clicks: 0, hovers: 0 }
        if (point.type === 'click') {
          existing.clicks++
        }
        else if (point.type === 'move') {
          existing.hovers++
        }
        stats.set(point.zone, existing)
      }
    }

    return stats
  }

  /**
   * Generate heatmap grid data (for server-side rendering)
   */
  generateGridData(
    page: string,
    gridSize: number = 20,
  ): { x: number, y: number, intensity: number }[][] {
    const points = this.getPageData(page)
    const grid: number[][] = []

    // Initialize grid
    for (let y = 0; y < gridSize; y++) {
      grid[y] = []
      for (let x = 0; x < gridSize; x++) {
        grid[y][x] = 0
      }
    }

    // Aggregate points into grid
    for (const point of points) {
      const gridX = Math.min(Math.floor((point.x / 100) * gridSize), gridSize - 1)
      const gridY = Math.min(Math.floor((point.y / 100) * gridSize), gridSize - 1)
      grid[gridY][gridX] += point.type === 'click' ? 3 : 1
    }

    // Normalize and format
    let maxValue = 0
    for (const row of grid) {
      for (const cell of row) {
        maxValue = Math.max(maxValue, cell)
      }
    }

    return grid.map((row, y) =>
      row.map((cell, x) => ({
        x,
        y,
        intensity: maxValue > 0 ? cell / maxValue : 0,
      })),
    )
  }

  /**
   * Export all data as JSON
   */
  exportJSON(): string {
    return JSON.stringify({
      sessions: Array.from(this.sessions.values()),
      exportedAt: new Date().toISOString(),
    }, null, 2)
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.sessions.clear()
  }

  /**
   * Get session count
   */
  get sessionCount(): number {
    return this.sessions.size
  }

  /**
   * Get total data points
   */
  get totalPoints(): number {
    let count = 0
    for (const session of this.sessions.values()) {
      count += session.points.length
    }
    return count
  }
}

/**
 * Create a heatmap aggregator instance
 */
export function createHeatmapAggregator(): HeatmapAggregator {
  return new HeatmapAggregator()
}
