import type { ImageFormat, ResponsiveBreakpoint, ResponsiveSet } from './types'

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoint[] = [
  { width: 640 },
  { width: 768 },
  { width: 1024 },
  { width: 1280 },
]

export function generateResponsiveSet(src: string, breakpoints?: ResponsiveBreakpoint[]): ResponsiveSet {
  const bps = breakpoints ?? DEFAULT_BREAKPOINTS
  const ext = src.split('.').pop() || 'jpg'
  const basePath = src.replace(/\.[^.]+$/, '')
  const format = (ext === 'jpg' ? 'jpg' : ext) as ImageFormat

  const variants = bps.map((bp) => {
    const suffix = bp.suffix ?? `-${bp.width}`
    return {
      path: `${basePath}${suffix}.${ext}`,
      width: bp.width,
      format,
    }
  })

  return {
    original: src,
    variants,
    srcset: buildSrcSet(variants),
  }
}

export function buildSrcSet(variants: Array<{ path: string, width: number }>): string {
  return variants
    .map(v => `${v.path} ${v.width}w`)
    .join(', ')
}

export function buildSizes(breakpoints: ResponsiveBreakpoint[]): string {
  if (breakpoints.length === 0)
    return ''

  const sorted = [...breakpoints].sort((a, b) => a.width - b.width)
  const parts = sorted.slice(0, -1).map(bp => `(max-width: ${bp.width}px) ${bp.width}px`)
  const largest = sorted[sorted.length - 1]
  parts.push(`${largest.width}px`)

  return parts.join(', ')
}
