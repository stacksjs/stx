import type { StxConfig, StxOptions } from './types'
import { resolve } from 'node:path'
import { loadConfigWithResult } from 'bunfig'
import { a11yDirective, screenReaderDirective } from './a11y'
import { animationGroupDirective, motionDirective, scrollAnimateDirective, transitionDirective } from './animation'
import { componentDirective } from './components'
import { markdownDirectiveHandler } from './markdown'
import { metaDirective, structuredDataDirective } from './seo'
import { webComponentDirectiveHandler } from './web-components'

export const defaultConfig: StxConfig = {
  enabled: true,
  partialsDir: 'partials',
  componentsDir: 'components',
  debug: false,
  cache: true,
  cachePath: '.stx/cache',
  cacheVersion: '1.0.0',
  customDirectives: [
    {
      name: 'markdown',
      handler: markdownDirectiveHandler,
      hasEndTag: true,
      description: 'Render markdown content to HTML',
    },
    {
      name: 'webcomponent',
      handler: webComponentDirectiveHandler,
      hasEndTag: false,
      description: 'Include a web component in the template',
    },
    a11yDirective,
    screenReaderDirective,
    componentDirective,
    metaDirective,
    structuredDataDirective,
    transitionDirective,
    animationGroupDirective,
    motionDirective,
    scrollAnimateDirective,
  ],
  middleware: [],
  i18n: {
    defaultLocale: 'en',
    locale: 'en',
    translationsDir: 'translations',
    format: 'yaml',
    fallbackToKey: true,
    cache: true,
  },
  webComponents: {
    enabled: false,
    outputDir: 'dist/web-components',
    components: [],
  },
  docs: {
    enabled: false,
    outputDir: 'docs',
    format: 'markdown',
    components: true,
    templates: true,
    directives: true,
  },
  streaming: {
    enabled: true,
    bufferSize: 1024 * 16, // 16KB chunks
    strategy: 'auto',
    timeout: 30000, // 30 seconds
  },
  hydration: {
    enabled: false,
    mode: 'islands',
    clientEntry: 'src/client.ts',
    autoMarkers: true,
    preload: 'lazy',
  },
  a11y: {
    enabled: true,
    addSrOnlyStyles: true,
    level: 'AA',
    autoFix: false,
    ignoreChecks: [],
  },
  seo: {
    enabled: true,
    socialPreview: true,
    defaultConfig: {
      title: 'stx Project',
      description: 'A website built with stx templating engine',
    },
  },
  animation: {
    enabled: true,
    defaultDuration: 300,
    defaultEase: 'ease',
    respectMotionPreferences: true,
    staggerDelay: 50,
  },
  markdown: {
    enabled: true,
    syntaxHighlighting: {
      enabled: true,
      serverSide: true,
      defaultTheme: 'github-dark',
      highlightUnknownLanguages: true,
      additionalThemes: [
        'light-plus',
        'one-dark-pro',
        'dracula',
        'monokai',
        'solarized-light',
        'nord',
        'github-dark',
      ],
    },
  },
  loops: {
    maxWhileIterations: 1000,
    useAltLoopVariable: false,
  },
  story: {
    enabled: true,
    outDir: '.stx/dist/story',
    storyMatch: ['**/*.story.stx'],
    storyIgnored: ['**/node_modules/**', '**/dist/**', '**/.stx/**'],
    port: 6006,
  },
  pwa: {
    enabled: false,
    manifest: {
      name: 'stx App',
      shortName: 'stx',
      description: 'A Progressive Web App built with stx',
      startUrl: '/',
      display: 'standalone',
      orientation: 'any',
      themeColor: '#000000',
      backgroundColor: '#ffffff',
      scope: '/',
    },
    icons: {
      src: 'public/icon.png',
      sizes: [72, 96, 128, 144, 152, 192, 384, 512],
      generateWebP: true,
      generateAppleIcons: true,
      outputDir: 'pwa-icons',
      purpose: ['any', 'maskable'],
    },
    routes: [
      { pattern: '/', strategy: 'network-first' },
      { pattern: '/static/*', strategy: 'cache-first', maxAgeSeconds: 86400 * 30 },
      { pattern: '/api/*', strategy: 'network-only' },
      { pattern: '*.js', strategy: 'stale-while-revalidate' },
      { pattern: '*.css', strategy: 'stale-while-revalidate' },
      { pattern: '*.png', strategy: 'cache-first' },
      { pattern: '*.jpg', strategy: 'cache-first' },
      { pattern: '*.webp', strategy: 'cache-first' },
      { pattern: '*.svg', strategy: 'cache-first' },
    ],
    offline: {
      enabled: true,
      fallbackTitle: 'You are offline',
      fallbackMessage: 'Please check your internet connection and try again.',
      precacheAssets: [],
    },
    serviceWorker: {
      fileName: 'sw.js',
      cacheVersion: '1.0.0',
      skipWaiting: true,
      clientsClaim: true,
      navigationPreload: false,
      excludeRoutes: ['/api/auth/*'],
      cacheFileTypes: ['html', 'css', 'js', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'woff', 'woff2'],
    },
    autoInject: true,
  },
}
// Lazy-load config to avoid blocking module initialization
// This makes imports near-instant instead of taking 2-3 seconds
let _config: StxConfig | null = null
let _configPromise: Promise<StxConfig> | null = null

async function loadStxConfig(): Promise<StxConfig> {
  if (_config)
    return _config
  if (_configPromise)
    return _configPromise

  _configPromise = (async () => {
    const configResult = await loadConfigWithResult({
      name: 'stx',
      cwd: resolve(__dirname, '..'),
      defaultConfig,
      verbose: false,
    })
    _config = configResult.config
    return _config
  })()

  return _configPromise
}

// Export a synchronous getter that returns defaults immediately, then loads async
// This allows the module to be imported instantly without blocking
export const config: StxConfig = new Proxy(defaultConfig, {
  get(target, prop) {
    // If config is already loaded, use it
    if (_config && prop in _config) {
      return _config[prop as keyof StxConfig]
    }
    // Otherwise, start loading in background and return default
    if (!_configPromise) {
      loadStxConfig().catch(() => {}) // Load in background, ignore errors
    }
    return target[prop as keyof StxConfig]
  },
})

/**
 * Helper function to define stx configuration
 */
export function defineStxConfig(config: StxOptions): StxOptions {
  return config
}

// =============================================================================
// Configuration Validation
// =============================================================================

/**
 * Configuration validation error
 */
export interface ConfigValidationError {
  path: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean
  errors: ConfigValidationError[]
  warnings: ConfigValidationError[]
}

/**
 * Validate stx configuration
 *
 * @param config - Configuration to validate
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validateConfig(myConfig)
 * if (!result.valid) {
 *   console.error('Config errors:', result.errors)
 * }
 * ```
 */
export function validateConfig(config: StxOptions): ConfigValidationResult {
  const errors: ConfigValidationError[] = []
  const warnings: ConfigValidationError[] = []

  // Validate partialsDir
  if (config.partialsDir !== undefined && typeof config.partialsDir !== 'string') {
    errors.push({
      path: 'partialsDir',
      message: 'partialsDir must be a string',
      severity: 'error',
    })
  }

  // Validate componentsDir
  if (config.componentsDir !== undefined && typeof config.componentsDir !== 'string') {
    errors.push({
      path: 'componentsDir',
      message: 'componentsDir must be a string',
      severity: 'error',
    })
  }

  // Validate cache settings
  if (config.cache !== undefined && typeof config.cache !== 'boolean') {
    errors.push({
      path: 'cache',
      message: 'cache must be a boolean',
      severity: 'error',
    })
  }

  // Validate debug setting
  if (config.debug !== undefined && typeof config.debug !== 'boolean') {
    errors.push({
      path: 'debug',
      message: 'debug must be a boolean',
      severity: 'error',
    })
  }

  // Validate streaming config
  if (config.streaming) {
    if (config.streaming.bufferSize !== undefined) {
      if (typeof config.streaming.bufferSize !== 'number' || config.streaming.bufferSize <= 0) {
        errors.push({
          path: 'streaming.bufferSize',
          message: 'streaming.bufferSize must be a positive number',
          severity: 'error',
        })
      }
    }

    if (config.streaming.timeout !== undefined) {
      if (typeof config.streaming.timeout !== 'number' || config.streaming.timeout <= 0) {
        errors.push({
          path: 'streaming.timeout',
          message: 'streaming.timeout must be a positive number',
          severity: 'error',
        })
      }
    }

    if (config.streaming.strategy !== undefined) {
      const validStrategies = ['auto', 'manual', 'sections']
      if (!validStrategies.includes(config.streaming.strategy)) {
        errors.push({
          path: 'streaming.strategy',
          message: `streaming.strategy must be one of: ${validStrategies.join(', ')}`,
          severity: 'error',
        })
      }
    }
  }

  // Validate i18n config
  if (config.i18n) {
    if (config.i18n.format !== undefined) {
      const validFormats = ['json', 'yaml', 'yml', 'js']
      if (!validFormats.includes(config.i18n.format)) {
        errors.push({
          path: 'i18n.format',
          message: `i18n.format must be one of: ${validFormats.join(', ')}`,
          severity: 'error',
        })
      }
    }
  }

  // Validate animation config
  if (config.animation) {
    if (config.animation.defaultDuration !== undefined) {
      if (typeof config.animation.defaultDuration !== 'number' || config.animation.defaultDuration < 0) {
        errors.push({
          path: 'animation.defaultDuration',
          message: 'animation.defaultDuration must be a non-negative number',
          severity: 'error',
        })
      }
    }

    if (config.animation.staggerDelay !== undefined) {
      if (typeof config.animation.staggerDelay !== 'number' || config.animation.staggerDelay < 0) {
        errors.push({
          path: 'animation.staggerDelay',
          message: 'animation.staggerDelay must be a non-negative number',
          severity: 'error',
        })
      }
    }
  }

  // Validate a11y config
  if (config.a11y) {
    if (config.a11y.level !== undefined) {
      const validLevels = ['AA', 'AAA']
      if (!validLevels.includes(config.a11y.level)) {
        errors.push({
          path: 'a11y.level',
          message: `a11y.level must be one of: ${validLevels.join(', ')}`,
          severity: 'error',
        })
      }
    }
  }

  // Validate hydration config
  if (config.hydration) {
    if (config.hydration.mode !== undefined) {
      const validModes = ['progressive', 'islands']
      if (!validModes.includes(config.hydration.mode)) {
        errors.push({
          path: 'hydration.mode',
          message: `hydration.mode must be one of: ${validModes.join(', ')}`,
          severity: 'error',
        })
      }
    }

    if (config.hydration.preload !== undefined) {
      const validPreloads = ['none', 'eager', 'lazy']
      if (!validPreloads.includes(config.hydration.preload)) {
        errors.push({
          path: 'hydration.preload',
          message: `hydration.preload must be one of: ${validPreloads.join(', ')}`,
          severity: 'error',
        })
      }
    }
  }

  // Validate custom directives
  if (config.customDirectives) {
    if (!Array.isArray(config.customDirectives)) {
      errors.push({
        path: 'customDirectives',
        message: 'customDirectives must be an array',
        severity: 'error',
      })
    }
    else {
      config.customDirectives.forEach((directive, index) => {
        if (!directive.name || typeof directive.name !== 'string') {
          errors.push({
            path: `customDirectives[${index}].name`,
            message: 'Custom directive must have a name string',
            severity: 'error',
          })
        }
        if (!directive.handler || typeof directive.handler !== 'function') {
          errors.push({
            path: `customDirectives[${index}].handler`,
            message: 'Custom directive must have a handler function',
            severity: 'error',
          })
        }
      })
    }
  }

  // Validate middleware
  if (config.middleware) {
    if (!Array.isArray(config.middleware)) {
      errors.push({
        path: 'middleware',
        message: 'middleware must be an array',
        severity: 'error',
      })
    }
    else {
      config.middleware.forEach((mw, index) => {
        if (!mw.name || typeof mw.name !== 'string') {
          errors.push({
            path: `middleware[${index}].name`,
            message: 'Middleware must have a name string',
            severity: 'error',
          })
        }
        if (!mw.handler || typeof mw.handler !== 'function') {
          errors.push({
            path: `middleware[${index}].handler`,
            message: 'Middleware must have a handler function',
            severity: 'error',
          })
        }
        if (!mw.timing || !['before', 'after'].includes(mw.timing)) {
          errors.push({
            path: `middleware[${index}].timing`,
            message: 'Middleware timing must be "before" or "after"',
            severity: 'error',
          })
        }
      })
    }
  }

  // Warnings for common issues
  if (config.debug === true && config.cache === true) {
    warnings.push({
      path: 'debug+cache',
      message: 'Debug mode with caching enabled may show stale content during development',
      severity: 'warning',
    })
  }

  if (config.seo?.enabled === true && !config.seo?.defaultConfig?.title) {
    warnings.push({
      path: 'seo.defaultConfig.title',
      message: 'SEO is enabled but no default title is set',
      severity: 'warning',
    })
  }

  // Validate PWA config
  if (config.pwa) {
    // Manifest name is required when PWA is enabled
    if (config.pwa.enabled === true && !config.pwa.manifest?.name) {
      errors.push({
        path: 'pwa.manifest.name',
        message: 'PWA manifest name is required when PWA is enabled',
        severity: 'error',
      })
    }

    // Validate display mode
    if (config.pwa.manifest?.display !== undefined) {
      const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser']
      if (!validDisplayModes.includes(config.pwa.manifest.display)) {
        errors.push({
          path: 'pwa.manifest.display',
          message: `PWA display must be one of: ${validDisplayModes.join(', ')}`,
          severity: 'error',
        })
      }
    }

    // Validate orientation
    if (config.pwa.manifest?.orientation !== undefined) {
      const validOrientations = ['portrait', 'landscape', 'any', 'portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary']
      if (!validOrientations.includes(config.pwa.manifest.orientation)) {
        errors.push({
          path: 'pwa.manifest.orientation',
          message: `PWA orientation must be one of: ${validOrientations.join(', ')}`,
          severity: 'error',
        })
      }
    }

    // Validate cache strategies in routes
    if (config.pwa.routes) {
      const validStrategies = ['cache-first', 'network-first', 'stale-while-revalidate', 'network-only', 'cache-only']
      config.pwa.routes.forEach((route, index) => {
        if (!route.pattern || typeof route.pattern !== 'string') {
          errors.push({
            path: `pwa.routes[${index}].pattern`,
            message: 'PWA route must have a pattern string',
            severity: 'error',
          })
        }
        if (!validStrategies.includes(route.strategy)) {
          errors.push({
            path: `pwa.routes[${index}].strategy`,
            message: `PWA route strategy must be one of: ${validStrategies.join(', ')}`,
            severity: 'error',
          })
        }
        if (route.maxAgeSeconds !== undefined && (typeof route.maxAgeSeconds !== 'number' || route.maxAgeSeconds < 0)) {
          errors.push({
            path: `pwa.routes[${index}].maxAgeSeconds`,
            message: 'PWA route maxAgeSeconds must be a non-negative number',
            severity: 'error',
          })
        }
        if (route.maxEntries !== undefined && (typeof route.maxEntries !== 'number' || route.maxEntries < 1)) {
          errors.push({
            path: `pwa.routes[${index}].maxEntries`,
            message: 'PWA route maxEntries must be a positive number',
            severity: 'error',
          })
        }
      })
    }

    // Validate icon sizes
    if (config.pwa.icons?.sizes) {
      if (!Array.isArray(config.pwa.icons.sizes)) {
        errors.push({
          path: 'pwa.icons.sizes',
          message: 'PWA icon sizes must be an array of numbers',
          severity: 'error',
        })
      }
      else {
        const invalidSizes = config.pwa.icons.sizes.filter(s => typeof s !== 'number' || s < 16 || s > 1024)
        if (invalidSizes.length > 0) {
          errors.push({
            path: 'pwa.icons.sizes',
            message: 'PWA icon sizes must be numbers between 16 and 1024',
            severity: 'error',
          })
        }
      }
    }

    // Validate icon purpose
    if (config.pwa.icons?.purpose) {
      const validPurposes = ['any', 'maskable', 'monochrome']
      const invalidPurposes = config.pwa.icons.purpose.filter(p => !validPurposes.includes(p))
      if (invalidPurposes.length > 0) {
        errors.push({
          path: 'pwa.icons.purpose',
          message: `PWA icon purpose must be one of: ${validPurposes.join(', ')}`,
          severity: 'error',
        })
      }
    }

    // Warning for missing icon source when PWA is enabled
    if (config.pwa.enabled === true && !config.pwa.icons?.src) {
      warnings.push({
        path: 'pwa.icons.src',
        message: 'PWA is enabled but no icon source specified. Provide a 512x512 PNG for best results.',
        severity: 'warning',
      })
    }

    // Warning for missing theme color
    if (config.pwa.enabled === true && !config.pwa.manifest?.themeColor) {
      warnings.push({
        path: 'pwa.manifest.themeColor',
        message: 'PWA theme color not set, defaulting to black',
        severity: 'warning',
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
