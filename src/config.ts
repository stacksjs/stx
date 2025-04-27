import type { StxConfig } from './types'
import { resolve } from 'node:path'
import { loadConfig } from 'bunfig'

export const defaultConfig: StxConfig = {
  enabled: true,
  partialsDir: 'partials',
  componentsDir: 'components',
  debug: false,
  cache: true,
  cachePath: '.stx-cache',
  cacheVersion: '1.0.0',
  customDirectives: [],
}

// eslint-disable-next-line antfu/no-top-level-await
export const config: StxConfig = await loadConfig({
  name: 'stx',
  cwd: resolve(__dirname, '..'),
  defaultConfig,
})
