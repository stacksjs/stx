import type { StxOptions } from '@stacksjs/stx'

declare module 'bun' {
  interface BuildConfig {
    stx?: StxOptions
  }
}

export {}
