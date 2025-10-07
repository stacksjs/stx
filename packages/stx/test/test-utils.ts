import type { BuildConfig } from 'bun'
import type { StxOptions } from '../src/types'

export function buildWithStx(config: Omit<BuildConfig, 'stx'> & { stx?: StxOptions }): Promise<any> {
  return Bun.build(config)
}
