/**
 * STX Media - Video Streaming Manifest Generation
 *
 * Generate HLS and DASH manifests for adaptive streaming.
 *
 * @module media/video/processor/streaming
 */

import { resolve, basename, extname, join } from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import type {
  HLSResult,
  DASHResult,
  StreamingQualityLevel,
} from '../../types'
import { hashFile, fileExists } from '../../shared/hash'

/**
 * Lazy import ts-videos
 */
async function getTsVideos(): Promise<typeof import('ts-videos') | null> {
  try {
    return await import('ts-videos')
  } catch {
    return null
  }
}

/**
 * Default streaming quality levels
 */
export const DEFAULT_STREAMING_QUALITIES: StreamingQualityLevel[] = [
  { label: '1080p', width: 1920, height: 1080, bitrate: 5_000_000, audioBitrate: 192_000 },
  { label: '720p', width: 1280, height: 720, bitrate: 2_500_000, audioBitrate: 128_000 },
  { label: '480p', width: 854, height: 480, bitrate: 1_000_000, audioBitrate: 96_000 },
  { label: '360p', width: 640, height: 360, bitrate: 600_000, audioBitrate: 64_000 },
]

/**
 * Generate HLS (HTTP Live Streaming) manifest and segments
 */
export async function generateHLSManifest(
  src: string,
  qualities: StreamingQualityLevel[],
  outputDir: string,
  baseUrl: string,
  options?: {
    segmentDuration?: number
    playlistType?: 'vod' | 'event'
  },
): Promise<HLSResult | null> {
  const tsVideos = await getTsVideos()
  if (!tsVideos) {
    console.warn('[stx-media] ts-videos not installed, cannot generate HLS manifest')
    return null
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return null
    }

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))
    const hlsDir = join(outputDir, `${srcBasename}-${srcHash}-hls`)

    await mkdir(hlsDir, { recursive: true })

    const effectiveQualities = qualities.length > 0 ? qualities : DEFAULT_STREAMING_QUALITIES
    const segmentDuration = options?.segmentDuration || 6

    // Get video info for duration
    const input = new tsVideos.Input(srcPath)
    const info = await input.getInfo()
    const duration = info.duration || 0

    const playlists: HLSResult['playlists'] = []
    let totalSegments = 0

    // Generate variant playlist for each quality
    for (const quality of effectiveQualities) {
      const qualityDir = join(hlsDir, quality.label)
      await mkdir(qualityDir, { recursive: true })

      const playlistFilename = `${quality.label}.m3u8`
      const playlistPath = join(qualityDir, playlistFilename)

      try {
        // Use ts-videos to generate HLS segments
        const result = await tsVideos.generateHLS(srcPath, {
          outputDir: qualityDir,
          segmentDuration,
          width: quality.width,
          height: quality.height,
          videoBitrate: quality.bitrate,
          audioBitrate: quality.audioBitrate,
          playlistName: quality.label,
        })

        if (result) {
          playlists.push({
            quality,
            url: `${baseUrl}/${srcBasename}-${srcHash}-hls/${quality.label}/${playlistFilename}`,
            path: playlistPath,
          })
          totalSegments += result.segmentCount || Math.ceil(duration / segmentDuration)
        }
      } catch (error) {
        console.warn(`[stx-media] Failed to generate HLS for ${quality.label}: ${error}`)
      }
    }

    if (playlists.length === 0) {
      return null
    }

    // Generate master playlist
    const masterPlaylistPath = join(hlsDir, 'master.m3u8')
    const masterPlaylist = generateMasterPlaylist(playlists, baseUrl, srcBasename, srcHash)
    await writeFile(masterPlaylistPath, masterPlaylist)

    return {
      manifestUrl: `${baseUrl}/${srcBasename}-${srcHash}-hls/master.m3u8`,
      manifestPath: masterPlaylistPath,
      playlists,
      segmentCount: totalSegments,
      duration,
    }
  } catch (error) {
    console.warn(`[stx-media] Failed to generate HLS manifest: ${error}`)
    return null
  }
}

/**
 * Generate HLS master playlist content
 */
function generateMasterPlaylist(
  playlists: HLSResult['playlists'],
  baseUrl: string,
  srcBasename: string,
  srcHash: string,
): string {
  const lines = ['#EXTM3U', '#EXT-X-VERSION:3']

  for (const playlist of playlists) {
    const { quality } = playlist
    const bandwidth = quality.bitrate + (quality.audioBitrate || 128000)
    const resolution = `${quality.width}x${quality.height || Math.round(quality.width * 9 / 16)}`

    lines.push(
      `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution},NAME="${quality.label}"`,
      `${quality.label}/${quality.label}.m3u8`,
    )
  }

  return lines.join('\n')
}

/**
 * Generate DASH (Dynamic Adaptive Streaming over HTTP) manifest
 */
export async function generateDASHManifest(
  src: string,
  qualities: StreamingQualityLevel[],
  outputDir: string,
  baseUrl: string,
  options?: {
    segmentDuration?: number
    minBufferTime?: number
  },
): Promise<DASHResult | null> {
  const tsVideos = await getTsVideos()
  if (!tsVideos) {
    console.warn('[stx-media] ts-videos not installed, cannot generate DASH manifest')
    return null
  }

  try {
    const srcPath = resolve(src)
    if (!(await fileExists(srcPath))) {
      return null
    }

    const srcHash = await hashFile(srcPath)
    const srcBasename = basename(src, extname(src))
    const dashDir = join(outputDir, `${srcBasename}-${srcHash}-dash`)

    await mkdir(dashDir, { recursive: true })

    const effectiveQualities = qualities.length > 0 ? qualities : DEFAULT_STREAMING_QUALITIES
    const segmentDuration = options?.segmentDuration || 4
    const minBufferTime = options?.minBufferTime || 2

    // Get video info for duration
    const input = new tsVideos.Input(srcPath)
    const info = await input.getInfo()
    const duration = info.duration || 0

    const videoRepresentations: DASHResult['adaptationSets'][0]['representations'] = []
    const audioRepresentations: DASHResult['adaptationSets'][0]['representations'] = []

    // Generate segments for each quality
    for (const quality of effectiveQualities) {
      const qualityDir = join(dashDir, quality.label)
      await mkdir(qualityDir, { recursive: true })

      try {
        // Use ts-videos to generate DASH segments
        const result = await tsVideos.generateDASH(srcPath, {
          outputDir: qualityDir,
          segmentDuration,
          width: quality.width,
          height: quality.height,
          videoBitrate: quality.bitrate,
          audioBitrate: quality.audioBitrate,
        })

        if (result) {
          videoRepresentations.push({
            bandwidth: quality.bitrate,
            width: quality.width,
            height: quality.height || Math.round(quality.width * 9 / 16),
            url: `${baseUrl}/${srcBasename}-${srcHash}-dash/${quality.label}/video`,
          })

          if (quality.audioBitrate) {
            audioRepresentations.push({
              bandwidth: quality.audioBitrate,
              url: `${baseUrl}/${srcBasename}-${srcHash}-dash/${quality.label}/audio`,
            })
          }
        }
      } catch (error) {
        console.warn(`[stx-media] Failed to generate DASH for ${quality.label}: ${error}`)
      }
    }

    if (videoRepresentations.length === 0) {
      return null
    }

    // Generate MPD manifest
    const mpdPath = join(dashDir, 'manifest.mpd')
    const mpd = generateMPD(
      videoRepresentations,
      audioRepresentations,
      duration,
      segmentDuration,
      minBufferTime,
    )
    await writeFile(mpdPath, mpd)

    const adaptationSets: DASHResult['adaptationSets'] = [
      { type: 'video', representations: videoRepresentations },
    ]

    if (audioRepresentations.length > 0) {
      adaptationSets.push({ type: 'audio', representations: audioRepresentations })
    }

    return {
      manifestUrl: `${baseUrl}/${srcBasename}-${srcHash}-dash/manifest.mpd`,
      manifestPath: mpdPath,
      adaptationSets,
      duration,
    }
  } catch (error) {
    console.warn(`[stx-media] Failed to generate DASH manifest: ${error}`)
    return null
  }
}

/**
 * Generate DASH MPD (Media Presentation Description) content
 */
function generateMPD(
  videoReps: DASHResult['adaptationSets'][0]['representations'],
  audioReps: DASHResult['adaptationSets'][0]['representations'],
  duration: number,
  segmentDuration: number,
  minBufferTime: number,
): string {
  const durationISO = formatISODuration(duration)
  const minBufferISO = formatISODuration(minBufferTime)

  let mpd = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="urn:mpeg:dash:schema:mpd:2011 DASH-MPD.xsd"
     type="static"
     mediaPresentationDuration="${durationISO}"
     minBufferTime="${minBufferISO}"
     profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
  <Period>
    <AdaptationSet mimeType="video/mp4" codecs="avc1.64001f" segmentAlignment="true" startWithSAP="1">
`

  for (let i = 0; i < videoReps.length; i++) {
    const rep = videoReps[i]
    mpd += `      <Representation id="video${i}" bandwidth="${rep.bandwidth}" width="${rep.width}" height="${rep.height}">
        <BaseURL>${rep.url}/</BaseURL>
        <SegmentBase indexRange="0-999">
          <Initialization range="0-999"/>
        </SegmentBase>
      </Representation>
`
  }

  mpd += `    </AdaptationSet>
`

  if (audioReps.length > 0) {
    mpd += `    <AdaptationSet mimeType="audio/mp4" codecs="mp4a.40.2" segmentAlignment="true" startWithSAP="1">
`
    for (let i = 0; i < audioReps.length; i++) {
      const rep = audioReps[i]
      mpd += `      <Representation id="audio${i}" bandwidth="${rep.bandwidth}">
        <BaseURL>${rep.url}/</BaseURL>
        <SegmentBase indexRange="0-999">
          <Initialization range="0-999"/>
        </SegmentBase>
      </Representation>
`
    }
    mpd += `    </AdaptationSet>
`
  }

  mpd += `  </Period>
</MPD>`

  return mpd
}

/**
 * Format duration as ISO 8601 duration string
 */
function formatISODuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  let duration = 'PT'
  if (hours > 0) duration += `${hours}H`
  if (minutes > 0) duration += `${minutes}M`
  duration += `${secs}S`

  return duration
}
