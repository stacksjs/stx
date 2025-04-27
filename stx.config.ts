import type { StxOptions } from './packages/stx/src/types'

const config: StxOptions = {
  enabled: true,
  partialsDir: 'partials',
  componentsDir: 'components',
  debug: false,
  cache: true,
  cachePath: '.stx-cache',
  cacheVersion: '1.0.0',
}

export default config
