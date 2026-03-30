/**
 * StxImage Builtin Component
 *
 * Renders an optimized `<img>` element with lazy loading, async decoding,
 * responsive image attributes, and optional blur-up placeholder support.
 *
 * @module builtins/stx-image
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'

/**
 * Escape a string for safe use inside an HTML attribute value.
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Resolve a prop value from any binding category, preferring
 * server-dynamic (already evaluated) over static strings.
 */
function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) {
    return String(props.serverDynamic[key])
  }
  const val = props.static[key]
  if (typeof val === 'string') {
    return val
  }
  return undefined
}

export const StxImageBuiltin: BuiltinComponentDef = {
  name: 'StxImage',
  aliases: ['stx-image', 'stx-img'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const src = resolveProp(props, 'src') || ''
    const alt = resolveProp(props, 'alt') || ''
    const width = resolveProp(props, 'width')
    const height = resolveProp(props, 'height')
    const sizes = resolveProp(props, 'sizes')
    const srcset = resolveProp(props, 'srcset')
    const placeholder = resolveProp(props, 'placeholder')
    const className = resolveProp(props, 'class') || resolveProp(props, 'className') || ''

    // Lazy loading: default true unless explicitly set to false
    const lazyRaw = props.static.lazy
    const lazyDynamic = props.serverDynamic.lazy
    const lazy = lazyDynamic !== false && lazyRaw !== 'false' && lazyRaw !== false

    // Build attribute list
    const attrs: string[] = []

    attrs.push(`src="${escapeAttr(src)}"`)
    attrs.push(`alt="${escapeAttr(alt)}"`)

    if (width) {
      attrs.push(`width="${escapeAttr(width)}"`)
    }
    if (height) {
      attrs.push(`height="${escapeAttr(height)}"`)
    }

    if (lazy) {
      attrs.push('loading="lazy"')
    }

    // Always add async decoding for performance
    attrs.push('decoding="async"')

    if (className) {
      attrs.push(`class="${escapeAttr(className)}"`)
    }

    if (sizes) {
      attrs.push(`sizes="${escapeAttr(sizes)}"`)
    }
    if (srcset) {
      attrs.push(`srcset="${escapeAttr(srcset)}"`)
    }

    // Blur-up placeholder via inline background style
    if (placeholder) {
      const style = `background-image:url(${escapeAttr(placeholder)});background-size:cover;background-repeat:no-repeat`
      attrs.push(`style="${escapeAttr(style)}"`)
    }

    // Forward extra static attributes not consumed above
    const consumedStatic = new Set([
      'src', 'alt', 'width', 'height', 'lazy', 'sizes', 'srcset',
      'placeholder', 'class', 'className',
    ])
    for (const [key, value] of Object.entries(props.static)) {
      if (consumedStatic.has(key)) continue
      if (typeof value === 'boolean') {
        if (value) attrs.push(escapeAttr(key))
      }
      else {
        attrs.push(`${escapeAttr(key)}="${escapeAttr(value)}"`)
      }
    }

    return `<img ${attrs.join(' ')} />`
  },
}
