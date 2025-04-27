// Simple declaration to allow importing .stx files
declare module '*.stx'

// Extend BuildConfig to support stx options
declare module 'bun' {
  interface BuildConfig {
    stx?: StxOptions
  }
}
