/**
 * Icon Builtin Component
 *
 * Renders an inline SVG from the Iconify icon library at template processing
 * time. No client-side runtime needed — the SVG is baked into the HTML.
 *
 * Usage:
 *   <Icon name="house" />
 *   <Icon name="lucide:house" size="20" class="text-gray-500" />
 *   <Icon name="chevron-right" size="16" color="red" />
 *
 * Default collection: lucide. Override with prefix: <Icon name="heroicons:home" />
 *
 * @module builtins/icon
 */

import type { BuiltinComponentDef, ResolvedProps, RenderContext } from '../component-registry'
import { escapeAttr } from './escape'
import { existsSync, readFileSync } from 'node:fs'

type IconCollection = Record<string, { body: string, width?: number, height?: number }>

// Cache loaded icon collections to avoid re-reading JSON files
const collectionCache = new Map<string, IconCollection>()

/**
 * Resolve the on-disk path of an icon collection JSON, checking the
 * standard locations: the package resolver, then `node_modules/`, then
 * Stacks-style `pantry/` (which sits parallel to node_modules in apps
 * that use pantry as their vendor directory).
 */
function resolveCollectionPath(prefix: string): string | null {
  try {
    return require.resolve(`@iconify/json/json/${prefix}.json`)
  }
  catch { /* fall through */ }

  const cwd = process.cwd()
  for (const candidate of [
    `${cwd}/node_modules/@iconify/json/json/${prefix}.json`,
    `${cwd}/pantry/@iconify/json/json/${prefix}.json`,
  ]) {
    if (existsSync(candidate)) return candidate
  }
  return null
}

/**
 * Load an icon collection synchronously. Used inside `render()` so the
 * first hit for a collection doesn't return a placeholder comment that
 * the user then sees as a missing icon — the JSON is small enough
 * (~550KB for lucide, parses in <10ms) that a blocking read on cache
 * miss is the right trade-off for correct SSR output.
 */
function loadCollectionSync(prefix: string): IconCollection | null {
  if (collectionCache.has(prefix)) return collectionCache.get(prefix)!

  const jsonPath = resolveCollectionPath(prefix)
  if (!jsonPath) return null

  try {
    const data = JSON.parse(readFileSync(jsonPath, 'utf8'))
    collectionCache.set(prefix, data.icons)
    return data.icons
  }
  catch {
    return null
  }
}

/**
 * Async loader — kept for `preloadIconCollection()` and tests, since
 * batch preloads benefit from non-blocking IO.
 */
async function loadCollection(prefix: string): Promise<IconCollection | null> {
  if (collectionCache.has(prefix)) return collectionCache.get(prefix)!

  const jsonPath = resolveCollectionPath(prefix)
  if (!jsonPath) return null

  try {
    const data = await Bun.file(jsonPath).json()
    collectionCache.set(prefix, data.icons)
    return data.icons
  }
  catch {
    return null
  }
}

/**
 * Resolve a prop value from any binding category.
 */
function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  if (props.static[key] !== undefined) return String(props.static[key])
  if (props.clientReactive[key] !== undefined) return props.clientReactive[key]
  return undefined
}

export const IconBuiltin: BuiltinComponentDef = {
  name: 'Icon',
  aliases: ['icon', 'stx-icon'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    // Accept either `name=` (internal convention) or `icon=` (the Iconify
    // web-component convention used across the ecosystem). Both are valid —
    // drivly-style templates often write `icon="ph:jeep-fill"`.
    const nameRaw = resolveProp(props, 'name') ?? resolveProp(props, 'icon')
    if (!nameRaw) {
      return '<!-- Icon: missing name/icon prop -->'
    }

    // Parse "collection:icon" or default to "lucide:icon"
    let collection = 'lucide'
    let iconName = nameRaw
    if (nameRaw.includes(':')) {
      const parts = nameRaw.split(':')
      collection = parts[0]
      iconName = parts[1]
    }

    const size = escapeAttr(resolveProp(props, 'size') || '24')
    const color = escapeAttr(resolveProp(props, 'color') || 'currentColor')
    const className = escapeAttr(resolveProp(props, 'class') || '')
    const style = escapeAttr(resolveProp(props, 'style') || '')

    // Lookup from cache, falling through to a synchronous on-disk load
    // when the collection hasn't been preloaded yet. Previously this
    // fired an async load and returned an HTML comment, which left the
    // first SSR pass with a missing icon — the user would see the
    // surrounding wrapper div (typically a colored circle) without
    // anything inside it. Sync read on first miss keeps the render
    // self-healing.
    const icons = collectionCache.get(collection) ?? loadCollectionSync(collection)
    if (!icons) {
      return `<!-- Icon: collection "${collection}" not loaded -->`
    }

    const iconData = icons[iconName]
    if (!iconData) {
      return `<!-- Icon: "${iconName}" not found in ${collection} -->`
    }

    const width = iconData.width || 24
    const height = iconData.height || 24
    const viewBox = `0 0 ${width} ${height}`

    // Replace currentColor if custom color specified
    let body = iconData.body
    if (color !== 'currentColor') {
      body = body.replace(/currentColor/g, color)
    }

    const classAttr = className ? ` class="${className}"` : ''
    const styleAttr = style ? ` style="${style}"` : ''

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}" fill="none"${classAttr}${styleAttr}>${body}</svg>`
  },
}

/**
 * Pre-load icon collections so they're available synchronously during render.
 * Call this before template processing starts.
 */
export async function preloadIconCollection(prefix: string = 'lucide'): Promise<void> {
  await loadCollection(prefix)
}
