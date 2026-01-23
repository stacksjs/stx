// @ts-nocheck - Skip type checking due to optional sharp dependency
/**
 * PWA Icon Generation
 *
 * Generates PWA icons from a single source image.
 * Uses sharp for high-performance image processing.
 *
 * Generated icons:
 * - Standard PWA icons (72, 96, 128, 144, 152, 192, 384, 512)
 * - Apple touch icons (120, 152, 167, 180)
 * - Favicons (16, 32)
 * - WebP variants (optional)
 */

import type { PwaIconConfig, StxOptions } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Icon generation result
 */
export interface IconGenerationResult {
  success: boolean
  generatedFiles: string[]
  errors: string[]
  warnings: string[]
}

/**
 * Default icon sizes for PWA
 */
export const DEFAULT_ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

/**
 * Apple touch icon sizes
 */
export const APPLE_TOUCH_ICON_SIZES = [120, 152, 167, 180]

/**
 * Favicon sizes
 */
export const FAVICON_SIZES = [16, 32]

/**
 * Generate PWA icons from a source image
 *
 * @param options - stx configuration options
 * @param outputDir - Output directory for generated icons
 * @returns Result object with success status and file paths
 */
export async function generatePwaIcons(
  options: StxOptions,
  outputDir: string,
): Promise<IconGenerationResult> {
  const result: IconGenerationResult = {
    success: true,
    generatedFiles: [],
    errors: [],
    warnings: [],
  }

  const iconConfig = options.pwa?.icons
  if (!iconConfig?.src) {
    result.errors.push('No source icon specified in pwa.icons.src')
    result.success = false
    return result
  }

  // Resolve source path
  const sourcePath = path.isAbsolute(iconConfig.src)
    ? iconConfig.src
    : path.resolve(process.cwd(), iconConfig.src)

  if (!fs.existsSync(sourcePath)) {
    result.errors.push(`Source icon not found: ${sourcePath}`)
    result.success = false
    return result
  }

  // Create output directory
  const iconsOutputDir = path.resolve(outputDir, iconConfig.outputDir || 'pwa-icons')
  try {
    fs.mkdirSync(iconsOutputDir, { recursive: true })
  }
  catch {
    result.errors.push(`Failed to create output directory: ${iconsOutputDir}`)
    result.success = false
    return result
  }

  const sizes = iconConfig.sizes || DEFAULT_ICON_SIZES
  const generateWebP = iconConfig.generateWebP ?? true
  const generateAppleIcons = iconConfig.generateAppleIcons ?? true

  try {
    // Try to load sharp dynamically
    let sharp: typeof import('sharp')
    try {
      sharp = await import('sharp')
    }
    catch {
      result.errors.push(
        'sharp is not installed. Install it with: bun add sharp\n'
        + 'Icon generation requires the sharp package for image processing.',
      )
      result.success = false
      return result
    }

    // Read source image
    const sourceImage = sharp.default(sourcePath)
    const metadata = await sourceImage.metadata()

    // Warn if source is too small
    if (metadata.width && metadata.width < 512) {
      result.warnings.push(
        `Source icon is ${metadata.width}x${metadata.height}. Recommend using at least 512x512 for best quality.`,
      )
    }

    // Generate standard PWA icons
    for (const size of sizes) {
      // PNG
      const pngPath = path.join(iconsOutputDir, `icon-${size}x${size}.png`)
      await sharp.default(sourcePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(pngPath)
      result.generatedFiles.push(pngPath)

      // WebP (if enabled)
      if (generateWebP) {
        const webpPath = path.join(iconsOutputDir, `icon-${size}x${size}.webp`)
        await sharp.default(sourcePath)
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .webp({ quality: 90 })
          .toFile(webpPath)
        result.generatedFiles.push(webpPath)
      }
    }

    // Generate Apple touch icons
    if (generateAppleIcons) {
      for (const size of APPLE_TOUCH_ICON_SIZES) {
        const applePath = path.join(iconsOutputDir, `apple-touch-icon-${size}x${size}.png`)
        await sharp.default(sourcePath)
          .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toFile(applePath)
        result.generatedFiles.push(applePath)
      }

      // Default apple-touch-icon (180x180)
      const defaultApplePath = path.join(iconsOutputDir, 'apple-touch-icon.png')
      await sharp.default(sourcePath)
        .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .png()
        .toFile(defaultApplePath)
      result.generatedFiles.push(defaultApplePath)
    }

    // Generate favicons
    for (const size of FAVICON_SIZES) {
      const faviconPath = path.join(iconsOutputDir, `favicon-${size}x${size}.png`)
      await sharp.default(sourcePath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(faviconPath)
      result.generatedFiles.push(faviconPath)
    }

    // Generate maskable icon (with padding for safe zone)
    const maskableSize = 512
    const maskablePath = path.join(iconsOutputDir, `icon-maskable-${maskableSize}x${maskableSize}.png`)
    const padding = Math.floor(maskableSize * 0.1) // 10% padding for safe zone
    const innerSize = maskableSize - (padding * 2)

    await sharp.default(sourcePath)
      .resize(innerSize, innerSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toFile(maskablePath)
    result.generatedFiles.push(maskablePath)
  }
  catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    result.errors.push(`Icon generation failed: ${errorMessage}`)
    result.success = false
  }

  return result
}

/**
 * Get list of icon paths that will be generated
 * Useful for manifest generation and cache precaching
 */
export function getExpectedIconPaths(config: PwaIconConfig): string[] {
  const sizes = config.sizes || DEFAULT_ICON_SIZES
  const outputDir = config.outputDir ? `/${config.outputDir}` : '/pwa-icons'
  const generateWebP = config.generateWebP ?? true
  const generateAppleIcons = config.generateAppleIcons ?? true

  const paths: string[] = []

  // Standard icons
  for (const size of sizes) {
    paths.push(`${outputDir}/icon-${size}x${size}.png`)
    if (generateWebP) {
      paths.push(`${outputDir}/icon-${size}x${size}.webp`)
    }
  }

  // Apple touch icons
  if (generateAppleIcons) {
    paths.push(`${outputDir}/apple-touch-icon.png`)
    for (const size of APPLE_TOUCH_ICON_SIZES) {
      paths.push(`${outputDir}/apple-touch-icon-${size}x${size}.png`)
    }
  }

  // Favicons
  for (const size of FAVICON_SIZES) {
    paths.push(`${outputDir}/favicon-${size}x${size}.png`)
  }

  // Maskable icon
  paths.push(`${outputDir}/icon-maskable-512x512.png`)

  return paths
}

/**
 * Check if sharp is available
 */
export async function isSharpAvailable(): Promise<boolean> {
  try {
    await import('sharp')
    return true
  }
  catch {
    return false
  }
}
