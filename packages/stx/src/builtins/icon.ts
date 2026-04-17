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

// Cache loaded icon collections to avoid re-reading JSON files
const collectionCache = new Map<string, Record<string, { body: string, width?: number, height?: number }>>()

/**
 * Load an icon collection from @iconify/json
 */
async function loadCollection(prefix: string): Promise<Record<string, { body: string, width?: number, height?: number }> | null> {
  if (collectionCache.has(prefix)) return collectionCache.get(prefix)!

  try {
    // Try @iconify/json first (local)
    const jsonPath = require.resolve(`@iconify/json/json/${prefix}.json`)
    const data = await Bun.file(jsonPath).json()
    collectionCache.set(prefix, data.icons)
    return data.icons
  }
  catch {
    try {
      // Fallback: try from node_modules in CWD
      const cwd = process.cwd()
      const localPath = `${cwd}/node_modules/@iconify/json/json/${prefix}.json`
      const file = Bun.file(localPath)
      if (await file.exists()) {
        const data = await file.json()
        collectionCache.set(prefix, data.icons)
        return data.icons
      }
    }
    catch {}
  }

  return null
}

/**
 * Resolve a prop value from any binding category.
 */
function resolveProp(props: ResolvedProps, key: string): string | undefined {
  if (props.serverDynamic[key] !== undefined) return String(props.serverDynamic[key])
  if (props.static[key] !== undefined) return props.static[key]
  if (props.clientReactive[key] !== undefined) return props.clientReactive[key]
  return undefined
}

export const IconBuiltin: BuiltinComponentDef = {
  name: 'Icon',
  aliases: ['icon', 'stx-icon'],

  render(props: ResolvedProps, _slotContent: string, _ctx: RenderContext): string {
    const nameRaw = resolveProp(props, 'name')
    if (!nameRaw) {
      return '<!-- Icon: missing name prop -->'
    }

    // Parse "collection:icon" or default to "lucide:icon"
    let collection = 'lucide'
    let iconName = nameRaw
    if (nameRaw.includes(':')) {
      const parts = nameRaw.split(':')
      collection = parts[0]
      iconName = parts[1]
    }

    const size = resolveProp(props, 'size') || '24'
    const color = resolveProp(props, 'color') || 'currentColor'
    const className = resolveProp(props, 'class') || ''
    const style = resolveProp(props, 'style') || ''

    // Synchronous lookup from cache — collections are pre-loaded
    const icons = collectionCache.get(collection)
    if (!icons) {
      // Try to load synchronously — if not cached, return placeholder
      // The icon will be resolved on next render after async load
      loadCollection(collection) // fire-and-forget for next render
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
