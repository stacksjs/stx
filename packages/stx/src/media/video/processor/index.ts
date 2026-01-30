/**
 * STX Media - Video Processor
 *
 * Integration with ts-videos for build-time video processing.
 *
 * @module media/video/processor
 */

export { processVideo, analyzeVideo } from './transcoder'
export { generatePoster, generateThumbnails, generateSpriteSheet } from './thumbnail'
export { generateHLSManifest, generateDASHManifest } from './streaming'
export { getCachedVideoResult, setCachedVideoResult, clearVideoCache, VideoProcessorCache } from './cache'

// Re-export types for convenience
export type {
  EnhancedVideoProps,
  ProcessedVideoResult,
  TsVideosConfig,
  VideoQualityPreset,
  VideoPlatformPreset,
  TranscodeConfig,
  TranscodeResult,
  ThumbnailResult,
  HLSResult,
  DASHResult,
  StreamingConfig,
  StreamingQualityLevel,
  PosterGenerationConfig,
  SpriteSheetConfig,
  WaveformConfig,
} from '../../types'
