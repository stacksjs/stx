import type { StxConfig } from './types'
import { resolve } from 'node:path'
import { loadConfig } from 'bunfig'
import { markdownDirectiveHandler } from './markdown'
import { webComponentDirectiveHandler } from './web-components'
import { a11yDirective, screenReaderDirective } from './a11y'
import { componentDirective } from './components'
import { metaDirective, structuredDataDirective } from './seo'

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
      title: 'STX Project',
      description: 'A website built with STX templating engine',
    },
  },
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: StxConfig = await loadConfig({
  name: 'stx',
  cwd: resolve(__dirname, '..'),
  defaultConfig,
})
