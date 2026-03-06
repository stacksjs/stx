export type ImageFormat = 'webp' | 'avif' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'svg'

export interface OptimizeOptions {
  width?: number
  height?: number
  quality?: number
  format?: ImageFormat
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

export interface ResponsiveBreakpoint {
  width: number
  suffix?: string
}

export interface ImageConfig {
  outputDir?: string
  formats?: ImageFormat[]
  quality?: number
  breakpoints?: ResponsiveBreakpoint[]
  lazyLoad?: boolean
  placeholder?: 'blur' | 'color' | 'none'
}

export interface ImageTagOptions {
  src: string
  alt: string
  sizes?: string
  width?: number
  height?: number
  lazy?: boolean
  placeholder?: 'blur' | 'color' | 'none'
  class?: string
  loading?: 'lazy' | 'eager'
  decoding?: 'async' | 'sync' | 'auto'
}

export interface ResponsiveSet {
  original: string
  variants: Array<{ path: string, width: number, format: ImageFormat }>
  srcset: string
}

export interface ImagePipeline {
  config: ImageConfig
  process(src: string, options?: OptimizeOptions): Promise<Buffer>
  generateVariants(src: string): Promise<ResponsiveSet>
}
