/**
 * PWA Web App Manifest Generation
 *
 * Generates a valid Web App Manifest JSON file for Progressive Web Apps.
 * Follows the W3C Web App Manifest specification.
 *
 * Features:
 * - Core manifest properties (name, icons, colors, etc.)
 * - App shortcuts
 * - Screenshots
 * - Share Target API
 * - File Handlers API
 * - Protocol Handlers
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
 * Share target entry structure
 */
export interface ManifestShareTarget {
  action: string
  method?: 'GET' | 'POST'
  enctype?: string
  params: {
    title?: string
    text?: string
    url?: string
    files?: Array<{
      name: string
      accept: string[]
    }>
  }
}

/**
 * File handler entry structure
 */
export interface ManifestFileHandler {
  action: string
  accept: Record<string, string[]>
  icons?: ManifestIcon[]
  launch_type?: 'single-client' | 'multiple-clients'
}

/**
 * Protocol handler entry structure
 */
export interface ManifestProtocolHandler {
  protocol: string
  url: string
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
  display_override?: string[]
  orientation?: string
  theme_color?: string
  background_color?: string
  scope?: string
  lang?: string
  dir?: string
  id?: string
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
  share_target?: ManifestShareTarget
  file_handlers?: ManifestFileHandler[]
  protocol_handlers?: ManifestProtocolHandler[]
  launch_handler?: {
    client_mode: 'auto' | 'focus-existing' | 'navigate-new' | 'navigate-existing'
  }
  handle_links?: 'auto' | 'preferred' | 'not-preferred'
  edge_side_panel?: {
    preferred_width?: number
  }
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
 * Generate share target configuration
 */
function generateShareTarget(options: StxOptions): ManifestShareTarget | undefined {
  const shareConfig = options.pwa?.shareTarget
  if (!shareConfig?.enabled) {
    return undefined
  }

  const shareTarget: ManifestShareTarget = {
    action: shareConfig.action || '/share',
    method: shareConfig.method || 'POST',
    enctype: shareConfig.enctype || 'multipart/form-data',
    params: {
      title: shareConfig.params?.title || 'title',
      text: shareConfig.params?.text || 'text',
      url: shareConfig.params?.url || 'url',
    },
  }

  // Add file support if configured
  if (shareConfig.acceptFiles && shareConfig.acceptFiles.length > 0) {
    shareTarget.params.files = shareConfig.acceptFiles.map(accept => ({
      name: accept.name,
      accept: accept.accept,
    }))
  }

  return shareTarget
}

/**
 * Generate file handlers configuration
 */
function generateFileHandlers(options: StxOptions): ManifestFileHandler[] | undefined {
  const fileConfig = options.pwa?.fileHandlers
  if (!fileConfig?.enabled || !fileConfig.accept) {
    return undefined
  }

  const fileHandlers: ManifestFileHandler[] = [{
    action: fileConfig.action || '/',
    accept: fileConfig.accept,
    launch_type: fileConfig.launchType || 'single-client',
  }]

  // Add icons if specified
  if (fileConfig.icons) {
    fileHandlers[0].icons = fileConfig.icons.map(icon => ({
      src: icon.src,
      sizes: icon.sizes,
      type: icon.type,
    }))
  }

  return fileHandlers
}

/**
 * Generate protocol handlers configuration
 */
function generateProtocolHandlers(options: StxOptions): ManifestProtocolHandler[] | undefined {
  const protocols = options.pwa?.protocolHandlers
  if (!protocols || protocols.length === 0) {
    return undefined
  }

  return protocols.map(handler => ({
    protocol: handler.protocol,
    url: handler.url,
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
    display_override: manifest.displayOverride,
    orientation: manifest.orientation,
    theme_color: manifest.themeColor,
    background_color: manifest.backgroundColor,
    scope: manifest.scope || '/',
    lang: manifest.lang,
    dir: manifest.dir,
    id: manifest.id,
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

  // Add share target if enabled
  const shareTarget = generateShareTarget(options)
  if (shareTarget) {
    webAppManifest.share_target = shareTarget
  }

  // Add file handlers if enabled
  const fileHandlers = generateFileHandlers(options)
  if (fileHandlers) {
    webAppManifest.file_handlers = fileHandlers
  }

  // Add protocol handlers if configured
  const protocolHandlers = generateProtocolHandlers(options)
  if (protocolHandlers) {
    webAppManifest.protocol_handlers = protocolHandlers
  }

  // Add launch handler
  if (manifest.launchHandler) {
    webAppManifest.launch_handler = {
      client_mode: manifest.launchHandler,
    }
  }

  // Add handle_links preference
  if (manifest.handleLinks) {
    webAppManifest.handle_links = manifest.handleLinks
  }

  // Add edge side panel support
  if (manifest.edgeSidePanel?.enabled) {
    webAppManifest.edge_side_panel = {
      preferred_width: manifest.edgeSidePanel.preferredWidth,
    }
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

/**
 * Validate manifest configuration
 * Returns an array of validation errors
 */
export function validateManifest(options: StxOptions): string[] {
  const errors: string[] = []
  const pwa = options.pwa

  if (!pwa?.enabled) {
    return errors
  }

  const manifest = pwa.manifest
  if (!manifest) {
    errors.push('PWA manifest configuration is missing')
    return errors
  }

  // Required fields
  if (!manifest.name) {
    errors.push('Manifest name is required')
  }

  // Validate display mode
  const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser']
  if (manifest.display && !validDisplayModes.includes(manifest.display)) {
    errors.push(`Invalid display mode: ${manifest.display}. Must be one of: ${validDisplayModes.join(', ')}`)
  }

  // Validate orientation
  const validOrientations = ['any', 'natural', 'landscape', 'landscape-primary', 'landscape-secondary', 'portrait', 'portrait-primary', 'portrait-secondary']
  if (manifest.orientation && !validOrientations.includes(manifest.orientation)) {
    errors.push(`Invalid orientation: ${manifest.orientation}`)
  }

  // Validate colors (basic hex check)
  const hexColorRegex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/
  if (manifest.themeColor && !hexColorRegex.test(manifest.themeColor)) {
    errors.push(`Invalid theme color: ${manifest.themeColor}. Must be a valid hex color.`)
  }
  if (manifest.backgroundColor && !hexColorRegex.test(manifest.backgroundColor)) {
    errors.push(`Invalid background color: ${manifest.backgroundColor}. Must be a valid hex color.`)
  }

  // Validate share target
  if (pwa.shareTarget?.enabled) {
    if (!pwa.shareTarget.action) {
      errors.push('Share target action URL is required')
    }
  }

  // Validate file handlers
  if (pwa.fileHandlers?.enabled) {
    if (!pwa.fileHandlers.accept || Object.keys(pwa.fileHandlers.accept).length === 0) {
      errors.push('File handlers must specify accepted MIME types')
    }
  }

  // Validate protocol handlers
  if (pwa.protocolHandlers) {
    for (const handler of pwa.protocolHandlers) {
      if (!handler.protocol) {
        errors.push('Protocol handler missing protocol')
      }
      if (!handler.url || !handler.url.includes('%s')) {
        errors.push(`Protocol handler URL must contain %s placeholder: ${handler.protocol}`)
      }
    }
  }

  return errors
}
