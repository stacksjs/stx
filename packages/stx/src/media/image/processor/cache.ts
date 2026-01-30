/**
 * STX Media - Image Processing Cache
 *
 * Specialized cache for image processing results.
 *
 * @module media/image/processor/cache
 */

import type {
  EnhancedImgProps,
  ProcessedImageResult,
  TsImagesConfig,
} from '../../types'
import {
  getCached,
  setCached,
  clearCache,
  type CacheConfig,
} from '../../shared/cache'

/**
 * Image processor cache configuration
 */
export interface ImageCacheConfig extends CacheConfig {
  /** Cache variants separately */
  cacheVariants?: boolean
  /** Cache placeholders separately */
  cachePlaceholders?: boolean
}

/**
 * Default image cache configuration
 */
const defaultImageCacheConfig: ImageCacheConfig = {
  enabled: true,
  directory: '.stx/media-cache',
  maxAge: 30,
  maxSize: 500,
  cacheVariants: true,
  cachePlaceholders: true,
}

/**
 * Image processor cache class
 */
export class ImageProcessorCache {
  private config: ImageCacheConfig

  constructor(config: Partial<ImageCacheConfig> = {}) {
    this.config = { ...defaultImageCacheConfig, ...config }
  }

  /**
   * Get cached processing result
   */
  async get(
    src: string,
    options: Partial<EnhancedImgProps>,
  ): Promise<ProcessedImageResult | null> {
    return getCached<ProcessedImageResult>(src, options, 'image', this.config)
  }

  /**
   * Set cached processing result
   */
  async set(
    src: string,
    options: Partial<EnhancedImgProps>,
    result: ProcessedImageResult,
  ): Promise<void> {
    return setCached(src, options, result, 'image', this.config)
  }

  /**
   * Clear the entire image cache
   */
  async clear(): Promise<void> {
    return clearCache('image', this.config)
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<ImageCacheConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Global cache instance
let globalImageCache: ImageProcessorCache | null = null

/**
 * Get or create global image cache
 */
function getImageCache(config?: Partial<ImageCacheConfig>): ImageProcessorCache {
  if (!globalImageCache) {
    globalImageCache = new ImageProcessorCache(config)
  } else if (config) {
    globalImageCache.updateConfig(config)
  }
  return globalImageCache
}

/**
 * Get cached image processing result
 */
export async function getCachedImageResult(
  src: string,
  options: Partial<EnhancedImgProps>,
  config?: TsImagesConfig,
): Promise<ProcessedImageResult | null> {
  const cacheConfig: Partial<ImageCacheConfig> = config
    ? { directory: `${config.outputDir}/../.cache` }
    : {}

  return getImageCache(cacheConfig).get(src, options)
}

/**
 * Set cached image processing result
 */
export async function setCachedImageResult(
  src: string,
  options: Partial<EnhancedImgProps>,
  result: ProcessedImageResult,
  config?: TsImagesConfig,
): Promise<void> {
  const cacheConfig: Partial<ImageCacheConfig> = config
    ? { directory: `${config.outputDir}/../.cache` }
    : {}

  return getImageCache(cacheConfig).set(src, options, result)
}

/**
 * Clear image processing cache
 */
export async function clearImageCache(): Promise<void> {
  return getImageCache().clear()
}
