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
