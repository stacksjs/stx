/**
 * STX Media - Video Transcoder
 *
 * Wraps ts-videos for video transcoding and analysis.
 *
 * @module media/video/processor/transcoder
 */

import { resolve, basename, extname, join } from 'node:path'
import { mkdir } from 'node:fs/promises'
import type {
  EnhancedVideoProps,
  ProcessedVideoResult,
  TsVideosConfig,
  VideoQualityPreset,
  VideoPlatformPreset,
  TranscodeConfig,
  TranscodeResult,
  VideoCodec,
  AudioCodec,
} from '../../types'
import { hashFile, fileExists } from '../../shared/hash'
import { getCachedVideoResult, setCachedVideoResult } from './cache'
import { generatePoster, generateThumbnails } from './thumbnail'
import { generateHLSManifest, generateDASHManifest } from './streaming'

/**
 * Lazy import ts-videos to avoid blocking module initialization
 */
async function getTsVideos(): Promise<typeof import('ts-videos') | null> {
  try {
    return await import('ts-videos')
  } catch {
    return null
  }
}

/**
 * Get bitrate for quality preset
 */
function getQualityBitrate(preset: VideoQualityPreset): number {
  switch (preset) {
    case 'very-low': return 500_000
    case 'low': return 1_000_000
    case 'medium': return 2_500_000
    case 'high': return 5_000_000
    case 'very-high': return 10_000_000
    case 'lossless': return 0 // CRF mode
    default: return 2_500_000
  }
}

/**
 * Get platform-specific encoding settings
 */
function getPlatformSettings(platform: VideoPlatformPreset): Partial<TranscodeConfig> {
  switch (platform) {
    case 'youtube':
      return {
        codec: 'h264',
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 30,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'twitter':
      return {
        codec: 'h264',
        maxWidth: 1280,
        maxHeight: 720,
        frameRate: 30,
        bitrate: 5_000_000,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'instagram-feed':
      return {
        codec: 'h264',
        maxWidth: 1080,
        maxHeight: 1080,
        frameRate: 30,
        bitrate: 3_500_000,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'instagram-story':
    case 'instagram-reels':
      return {
        codec: 'h264',
        maxWidth: 1080,
        maxHeight: 1920,
        frameRate: 30,
        bitrate: 3_500_000,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'tiktok':
      return {
        codec: 'h264',
        maxWidth: 1080,
        maxHeight: 1920,
        frameRate: 30,
        bitrate: 4_000_000,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'discord':
      return {
        codec: 'h264',
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 60,
        bitrate: 8_000_000,
        audioCodec: 'aac',
        audioBitrate: 192_000,
      }
    case 'linkedin':
      return {
        codec: 'h264',
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 30,
        bitrate: 5_000_000,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'facebook':
      return {
        codec: 'h264',
        maxWidth: 1280,
        maxHeight: 720,
        frameRate: 30,
        bitrate: 4_000_000,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    case 'web-progressive':
      return {
        codec: 'h264',
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 30,
        audioCodec: 'aac',
        audioBitrate: 128_000,
        twoPass: true,
      }
    case 'web-streaming':
      return {
        codec: 'h264',
        maxWidth: 1920,
        maxHeight: 1080,
        frameRate: 30,
        audioCodec: 'aac',
        audioBitrate: 128_000,
      }
    default:
      return {}
  }
}

/**
 * Analyze video to get metadata
 */
export async function analyzeVideo(
  src: string,
): Promise<ProcessedVideoResult['metadata'] | null> {
  const tsVideos = await getTsVideos()
  if (!tsVideos) {
    return null
  }

  try {
    const srcPath = resolve(src)
    const input = new tsVideos.Input(srcPath)
    const info = await input.getInfo()

    return {
      duration: info.duration || 0,
      width: info.width || 0,
      height: info.height || 0,
      frameRate: info.frameRate || 0,
      bitrate: info.bitrate || 0,
      codec: info.videoCodec || '',
      audioCodec: info.audioCodec,
    }
  } catch (error) {
    console.warn(`[stx-media] Failed to analyze video: ${error}`)
    return null
  }
}

/**
 * Process a video with ts-videos
 */
export async function processVideo(
  src: string,
  options: Partial<EnhancedVideoProps>,
  config: TsVideosConfig,
  onProgress?: (progress: { percentage: number; stage: string }) => void,
): Promise<ProcessedVideoResult> {
  const tsVideos = await getTsVideos()

  // Return unprocessed result if ts-videos not available
  if (!tsVideos) {
    console.warn('[stx-media] ts-videos not installed, skipping processing')
    return { src, processed: false }
  }

  // Check cache first
  const cached = await getCachedVideoResult(src, options, config)
  if (cached) {
    return cached
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return { src, processed: false, errors: [`Source file not found: ${src}`] }
    }

    const outputDir = config.outputDir || 'dist/videos'
    const baseUrl = config.baseUrl || '/videos'

    await mkdir(outputDir, { recursive: true })

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))

    const result: ProcessedVideoResult = {
      src,
      processed: true,
      hash: srcHash,
    }

    // Get video metadata
    onProgress?.({ percentage: 5, stage: 'analyzing' })
    result.metadata = await analyzeVideo(srcPath) || undefined

    // Determine encoding settings
    const qualitySettings: Partial<TranscodeConfig> = {}
    if (options.quality) {
      qualitySettings.bitrate = getQualityBitrate(options.quality)
    }
    if (options.platform) {
      Object.assign(qualitySettings, getPlatformSettings(options.platform))
    }
    if (options.transcode) {
      Object.assign(qualitySettings, options.transcode)
    }

    // Transcode if settings provided
    if (Object.keys(qualitySettings).length > 0 || options.process) {
      onProgress?.({ percentage: 10, stage: 'transcoding' })

      const outputFilename = `${srcBasename}-${srcHash}.mp4`
      const outputPath = join(outputDir, outputFilename)

      try {
        const transcodeResult = await transcodeVideo(
          srcPath,
          outputPath,
          qualitySettings,
          tsVideos,
          (p) => onProgress?.({ percentage: 10 + p * 0.5, stage: 'transcoding' }),
        )

        if (transcodeResult) {
          result.transcoded = {
            path: outputPath,
            url: `${baseUrl}/${outputFilename}`,
            duration: transcodeResult.duration,
            size: transcodeResult.size,
            video: {
              codec: (qualitySettings.codec || 'h264') as VideoCodec,
              width: transcodeResult.width,
              height: transcodeResult.height,
              bitrate: transcodeResult.bitrate,
              frameRate: transcodeResult.frameRate,
            },
            audio: transcodeResult.audioCodec
              ? {
                  codec: (qualitySettings.audioCodec || 'aac') as AudioCodec,
                  bitrate: qualitySettings.audioBitrate || 128_000,
                  sampleRate: qualitySettings.sampleRate || 48000,
                  channels: qualitySettings.channels || 2,
                }
              : undefined,
          }
        }
      } catch (error) {
        result.errors = result.errors || []
        result.errors.push(`Transcoding failed: ${error}`)
      }
    }

    // Generate poster if requested
    if (options.generatePoster) {
      onProgress?.({ percentage: 65, stage: 'generating-poster' })
      const posterOpts = typeof options.generatePoster === 'object'
        ? options.generatePoster
        : { timestamp: 0 }

      const poster = await generatePoster(srcPath, posterOpts, outputDir, baseUrl)
      if (poster) {
        result.poster = poster
      }
    }

    // Generate thumbnails if configured
    if (config.thumbnails?.enabled) {
      onProgress?.({ percentage: 70, stage: 'generating-thumbnails' })
      const thumbnails = await generateThumbnails(
        srcPath,
        config.thumbnails,
        outputDir,
        baseUrl,
      )
      if (thumbnails.length > 0) {
        result.thumbnails = thumbnails
      }
    }

    // Generate streaming manifests if requested
    if (options.streaming) {
      onProgress?.({ percentage: 80, stage: 'generating-manifests' })
      const streamConfig = typeof options.streaming === 'object'
        ? options.streaming
        : config.streaming || { format: 'hls' }

      if (streamConfig.format === 'hls' || streamConfig.format === undefined) {
        const hls = await generateHLSManifest(
          srcPath,
          streamConfig.qualities || config.streaming?.defaultQualities || [],
          outputDir,
          baseUrl,
        )
        if (hls) {
          result.streaming = { ...result.streaming, hls }
        }
      }

      if (streamConfig.format === 'dash') {
        const dash = await generateDASHManifest(
          srcPath,
          streamConfig.qualities || config.streaming?.defaultQualities || [],
          outputDir,
          baseUrl,
        )
        if (dash) {
          result.streaming = { ...result.streaming, dash }
        }
      }
    }

    // Generate sprite sheet if requested
    if (options.spriteSheet) {
      onProgress?.({ percentage: 90, stage: 'generating-sprite-sheet' })
      // Sprite sheet generation would go here
      // This is a complex feature that requires frame extraction
    }

    onProgress?.({ percentage: 100, stage: 'complete' })

    // Cache the result
    await setCachedVideoResult(src, options, result, config)

    return result
  } catch (error) {
    return {
      src,
      processed: false,
      errors: [`Processing failed: ${error}`],
    }
  }
}

/**
 * Internal transcode function
 */
async function transcodeVideo(
  input: string,
  output: string,
  config: Partial<TranscodeConfig>,
  tsVideos: typeof import('ts-videos'),
  onProgress?: (progress: number) => void,
): Promise<{
  duration: number
  size: number
  width: number
  height: number
  bitrate: number
  frameRate: number
  audioCodec?: string
} | null> {
  try {
    // Create conversion with ts-videos
    const conversion = new tsVideos.Conversion(input, output, {
      videoCodec: config.codec,
      videoBitrate: config.bitrate,
      width: config.maxWidth,
      height: config.maxHeight,
      frameRate: config.frameRate,
      audioCodec: config.audioCodec,
      audioBitrate: config.audioBitrate,
      sampleRate: config.sampleRate,
      channels: config.channels,
    })

    // Run conversion with progress
    const result = await conversion.run((progress) => {
      onProgress?.(progress.percentage / 100)
    })

    return {
      duration: result.duration || 0,
      size: result.size || 0,
      width: result.width || config.maxWidth || 0,
      height: result.height || config.maxHeight || 0,
      bitrate: result.bitrate || config.bitrate || 0,
      frameRate: result.frameRate || config.frameRate || 30,
      audioCodec: result.audioCodec,
    }
  } catch (error) {
    console.error(`[stx-media] Transcoding failed: ${error}`)
    return null
  }
}
