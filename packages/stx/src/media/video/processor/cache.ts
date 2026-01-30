/**
 * STX Media - Video Processing Cache
 *
 * Specialized cache for video processing results.
 *
 * @module media/video/processor/cache
 */

import type {
  EnhancedVideoProps,
  ProcessedVideoResult,
  TsVideosConfig,
} from '../../types'
import {
  getCached,
  setCached,
  clearCache,
  type CacheConfig,
} from '../../shared/cache'

/**
 * Video processor cache configuration
 */
export interface VideoCacheConfig extends CacheConfig {
  /** Cache transcoded videos */
  cacheTranscoded?: boolean
  /** Cache thumbnails separately */
  cacheThumbnails?: boolean
  /** Cache streaming manifests */
  cacheManifests?: boolean
}

/**
 * Default video cache configuration
 */
const defaultVideoCacheConfig: VideoCacheConfig = {
  enabled: true,
  directory: '.stx/media-cache',
  maxAge: 30,
  maxSize: 2000, // Videos take more space
  cacheTranscoded: true,
  cacheThumbnails: true,
  cacheManifests: true,
}

/**
 * Video processor cache class
 */
export class VideoProcessorCache {
  private config: VideoCacheConfig

  constructor(config: Partial<VideoCacheConfig> = {}) {
    this.config = { ...defaultVideoCacheConfig, ...config }
  }

  /**
   * Get cached processing result
   */
  async get(
    src: string,
    options: Partial<EnhancedVideoProps>,
  ): Promise<ProcessedVideoResult | null> {
    return getCached<ProcessedVideoResult>(src, options, 'video', this.config)
  }

  /**
   * Set cached processing result
   */
  async set(
    src: string,
    options: Partial<EnhancedVideoProps>,
    result: ProcessedVideoResult,
  ): Promise<void> {
    return setCached(src, options, result, 'video', this.config)
  }

  /**
   * Clear the entire video cache
   */
  async clear(): Promise<void> {
    return clearCache('video', this.config)
  }

  /**
   * Update cache configuration
   */
  updateConfig(config: Partial<VideoCacheConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Global cache instance
let globalVideoCache: VideoProcessorCache | null = null

/**
 * Get or create global video cache
 */
function getVideoCache(config?: Partial<VideoCacheConfig>): VideoProcessorCache {
  if (!globalVideoCache) {
    globalVideoCache = new VideoProcessorCache(config)
  } else if (config) {
    globalVideoCache.updateConfig(config)
  }
  return globalVideoCache
}

/**
 * Get cached video processing result
 */
export async function getCachedVideoResult(
  src: string,
  options: Partial<EnhancedVideoProps>,
  config?: TsVideosConfig,
): Promise<ProcessedVideoResult | null> {
  const cacheConfig: Partial<VideoCacheConfig> = config
    ? { directory: `${config.outputDir}/../.cache` }
    : {}

  return getVideoCache(cacheConfig).get(src, options)
}

/**
 * Set cached video processing result
 */
export async function setCachedVideoResult(
  src: string,
  options: Partial<EnhancedVideoProps>,
  result: ProcessedVideoResult,
  config?: TsVideosConfig,
): Promise<void> {
  const cacheConfig: Partial<VideoCacheConfig> = config
    ? { directory: `${config.outputDir}/../.cache` }
    : {}

  return getVideoCache(cacheConfig).set(src, options, result)
}

/**
 * Clear video processing cache
 */
export async function clearVideoCache(): Promise<void> {
  return getVideoCache().clear()
}
