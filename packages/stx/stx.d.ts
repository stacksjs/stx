// Simple declaration to allow importing .stx files
declare module '*.stx'

// Extend BuildConfig to support stx options
declare module 'bun' {
  interface BuildConfig {
    stx?: import('./src/types').StxOptions
    config?: {
      stx?: import('./src/types').StxOptions
    }
  }
}
