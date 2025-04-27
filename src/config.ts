import type { StxConfig } from './types'
import { resolve } from 'node:path'
import { loadConfig } from 'bunfig'
import { markdownDirectiveHandler } from './markdown'

export const defaultConfig: StxConfig = {
  enabled: true,
  partialsDir: 'partials',
  componentsDir: 'components',
  debug: false,
  cache: true,
  cachePath: '.stx-cache',
  cacheVersion: '1.0.0',
  customDirectives: [
    {
      name: 'markdown',
      handler: markdownDirectiveHandler,
      hasEndTag: true,
      description: 'Render markdown content to HTML',
    },
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
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: StxConfig = await loadConfig({
  name: 'stx',
  cwd: resolve(__dirname, '..'),
  defaultConfig,
})
