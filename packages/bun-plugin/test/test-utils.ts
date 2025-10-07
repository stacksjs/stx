import type { StxOptions } from '@stacksjs/stx'
import type { BuildConfig } from 'bun'

export function buildWithStx(config: Omit<BuildConfig, 'stx'> & { stx?: StxOptions }): Promise<any> {
  return Bun.build(config)
}
