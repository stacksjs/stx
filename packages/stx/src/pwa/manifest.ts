/**
 * PWA Web App Manifest Generation
 *
 * Generates a valid Web App Manifest JSON file for Progressive Web Apps.
 * Follows the W3C Web App Manifest specification.
 *
 * @see https://www.w3.org/TR/appmanifest/
 */

import type { PwaManifestConfig, PwaShortcut, StxOptions } from '../types'

/**
 * Manifest icon entry structure
 */
export interface ManifestIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

/**
 * Complete Web App Manifest structure
 */
export interface WebAppManifest {
  name: string
  short_name?: string
  description?: string
  start_url: string
  display: string
  orientation?: string
  theme_color?: string
  background_color?: string
  scope?: string
  lang?: string
  dir?: string
  categories?: string[]
  icons: ManifestIcon[]
  shortcuts?: Array<{
    name: string
    short_name?: string
    description?: string
    url: string
    icons?: ManifestIcon[]
  }>
  screenshots?: Array<{
    src: string
    sizes: string
    type?: string
    label?: string
    form_factor?: 'wide' | 'narrow'
  }>
}

/**
 * Generate manifest icons array from config
 */
function generateManifestIcons(
  iconSizes: number[],
  iconsDir: string,
  generateWebP: boolean,
  purpose: string[],
): ManifestIcon[] {
  const icons: ManifestIcon[] = []
  const purposeStr = purpose.join(' ')

  for (const size of iconSizes) {
    // PNG icon
    icons.push({
      src: `${iconsDir}/icon-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: purposeStr,
    })

    // WebP icon (if enabled)
    if (generateWebP) {
      icons.push({
        src: `${iconsDir}/icon-${size}x${size}.webp`,
        sizes: `${size}x${size}`,
        type: 'image/webp',
        purpose: purposeStr,
      })
    }
  }

  return icons
}

/**
 * Transform shortcuts from config format to manifest format
 */
function transformShortcuts(shortcuts: PwaShortcut[]): WebAppManifest['shortcuts'] {
  return shortcuts.map(shortcut => ({
    name: shortcut.name,
    short_name: shortcut.shortName,
    description: shortcut.description,
    url: shortcut.url,
    icons: shortcut.icons?.map(icon => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
    })),
  }))
}

/**
 * Generate a Web App Manifest object from configuration
 */
export function generateManifest(options: StxOptions): WebAppManifest | null {
  const pwa = options.pwa
  if (!pwa?.enabled || !pwa.manifest) {
    return null
  }

  const manifest = pwa.manifest
  const iconConfig = pwa.icons
  const iconSizes = iconConfig?.sizes || [72, 96, 128, 144, 152, 192, 384, 512]
  const iconsDir = iconConfig?.outputDir ? `/${iconConfig.outputDir}` : '/pwa-icons'
  const generateWebP = iconConfig?.generateWebP ?? true
  const purpose = iconConfig?.purpose || ['any', 'maskable']

  const webAppManifest: WebAppManifest = {
    name: manifest.name,
    short_name: manifest.shortName || manifest.name,
    description: manifest.description,
    start_url: manifest.startUrl || '/',
    display: manifest.display || 'standalone',
    orientation: manifest.orientation,
    theme_color: manifest.themeColor,
    background_color: manifest.backgroundColor,
    scope: manifest.scope || '/',
    lang: manifest.lang,
    dir: manifest.dir,
    categories: manifest.categories,
    icons: generateManifestIcons(iconSizes, iconsDir, generateWebP, purpose),
  }

  // Add shortcuts if configured
  if (manifest.shortcuts && manifest.shortcuts.length > 0) {
    webAppManifest.shortcuts = transformShortcuts(manifest.shortcuts)
  }

  // Add screenshots if configured
  if (manifest.screenshots && manifest.screenshots.length > 0) {
    webAppManifest.screenshots = manifest.screenshots.map(screenshot => ({
      src: screenshot.src,
      sizes: screenshot.sizes,
      type: screenshot.type,
      label: screenshot.label,
      form_factor: screenshot.platform,
    }))
  }

  return webAppManifest
}

/**
 * Generate manifest.json file content as a string
 */
export function generateManifestJson(options: StxOptions): string {
  const manifest = generateManifest(options)
  if (!manifest) {
    return ''
  }

  // Remove undefined values for cleaner output
  const cleanManifest = JSON.parse(JSON.stringify(manifest))
  return JSON.stringify(cleanManifest, null, 2)
}

/**
 * Merge user manifest config with defaults
 */
export function mergeManifestConfig(
  userConfig: Partial<PwaManifestConfig>,
  defaultConfig: PwaManifestConfig,
): PwaManifestConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    // Merge arrays instead of replacing
    shortcuts: userConfig.shortcuts || defaultConfig.shortcuts,
    screenshots: userConfig.screenshots || defaultConfig.screenshots,
    categories: userConfig.categories || defaultConfig.categories,
  }
}
