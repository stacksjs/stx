import type { ImageFormat, ImageTagOptions } from './types'
import { generateBlurDataUrl } from './placeholder'

export function generateImageTag(options: ImageTagOptions): string {
  const attrs: string[] = []

  attrs.push(`src="${escapeAttr(options.src)}"`)
  attrs.push(`alt="${escapeAttr(options.alt)}"`)

  if (options.width != null)
    attrs.push(`width="${options.width}"`)
  if (options.height != null)
    attrs.push(`height="${options.height}"`)

  // Lazy loading
  const loading = options.loading ?? (options.lazy !== false ? 'lazy' : 'eager')
  attrs.push(`loading="${loading}"`)

  // Decoding
  const decoding = options.decoding ?? 'async'
  attrs.push(`decoding="${decoding}"`)

  if (options.sizes)
    attrs.push(`sizes="${escapeAttr(options.sizes)}"`)
  if (options.class)
    attrs.push(`class="${escapeAttr(options.class)}"`)

  // Blur placeholder as inline style
  if (options.placeholder === 'blur') {
    const dataUrl = generateBlurDataUrl(options.width, options.height)
    attrs.push(`style="background-image: url('${dataUrl}'); background-size: cover;"`)
  }

  return `<img ${attrs.join(' ')} />`
}

export function generatePictureTag(options: ImageTagOptions & { formats?: ImageFormat[] }): string {
  const formats = options.formats ?? ['webp', 'jpg']
  const basePath = options.src.replace(/\.[^.]+$/, '')
  const lines: string[] = []

  lines.push('<picture>')

  // Generate <source> for each format except the fallback (last one)
  for (const format of formats.slice(0, -1)) {
    const mimeType = getMimeType(format)
    const srcPath = `${basePath}.${format}`
    lines.push(`  <source type="${mimeType}" srcset="${escapeAttr(srcPath)}" />`)
  }

  // Fallback <img> uses the last format
  const fallbackFormat = formats[formats.length - 1]
  const fallbackSrc = `${basePath}.${fallbackFormat}`

  const imgAttrs: string[] = []
  imgAttrs.push(`src="${escapeAttr(fallbackSrc)}"`)
  imgAttrs.push(`alt="${escapeAttr(options.alt)}"`)

  if (options.width != null)
    imgAttrs.push(`width="${options.width}"`)
  if (options.height != null)
    imgAttrs.push(`height="${options.height}"`)

  const loading = options.loading ?? (options.lazy !== false ? 'lazy' : 'eager')
  imgAttrs.push(`loading="${loading}"`)
  imgAttrs.push(`decoding="${options.decoding ?? 'async'}"`)

  if (options.class)
    imgAttrs.push(`class="${escapeAttr(options.class)}"`)

  lines.push(`  <img ${imgAttrs.join(' ')} />`)
  lines.push('</picture>')

  return lines.join('\n')
}

function getMimeType(format: ImageFormat): string {
  const mimeMap: Record<string, string> = {
    webp: 'image/webp',
    avif: 'image/avif',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  }
  return mimeMap[format] ?? 'image/jpeg'
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
