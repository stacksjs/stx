import type { StxOptions } from '../types'

declare module 'bun' {
  interface BuildConfig {
    stx?: StxOptions
  }
}
