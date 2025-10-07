import type { StxOptions } from './src/types'

declare module 'bun' {
  interface BuildConfig {
    stx?: StxOptions
  }
}

export {}
