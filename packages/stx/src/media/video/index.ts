/**
 * STX Media - Video Module
 *
 * Video playback with native HTML5 and ts-video-player integration.
 *
 * Note: This module provides a <Video> component that will integrate
 * with the separate ts-video-player library (similar to vidstack)
 * for advanced playback features.
 *
 * @module media/video
 */

import type { VideoProps, VideoRenderResult, VideoSource } from '../types'

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONTROLS = true
const DEFAULT_PRELOAD = 'metadata'

// =============================================================================
// Video Component
// =============================================================================

/**
 * Render a video component
 *
 * For basic HTML5 video, this renders a standard <video> element.
 * For advanced features, use player="ts-video" to integrate with
 * the ts-video-player library.
 *
 * @example
 * ```typescript
 * const result = await renderVideoComponent({
 *   src: '/videos/intro.mp4',
 *   poster: '/images/poster.jpg',
 *   controls: true,
 *   lazy: true,
 * })
 * ```
 */
export async function renderVideoComponent(
  props: VideoProps,
  context: { isDev?: boolean } = {},
): Promise<VideoRenderResult> {
  const {
    src,
    sources = [],
    poster,
    posterPlaceholder,
    controls = DEFAULT_CONTROLS,
    autoplay = false,
    muted = false,
    loop = false,
    preload = DEFAULT_PRELOAD,
    playsinline = true,
    lazy = true,
    player = 'native',
    type: embedType,
    width,
    height,
    crossorigin,
    disablePictureInPicture = false,
    disableRemotePlayback = false,
  } = props

  const className = props.class
  const style = props.style
  const id = props.id || `stx-video-${Math.random().toString(36).slice(2, 8)}`

  // Check for external embed (YouTube, Vimeo, etc.)
  if (embedType && embedType !== 'video') {
    return renderEmbed(src || '', embedType, props)
  }

  // Build video sources
  const videoSources = sources.length > 0 ? sources : (src ? [{ src, type: detectMimeType(src) }] : [])

  // Build attributes
  const attrs: string[] = [`id="${id}"`]

  if (controls) attrs.push('controls')
  if (autoplay) attrs.push('autoplay')
  if (muted) attrs.push('muted')
  if (loop) attrs.push('loop')
  if (playsinline) attrs.push('playsinline')
  if (disablePictureInPicture) attrs.push('disablepictureinpicture')
  if (disableRemotePlayback) attrs.push('disableremoteplayback')
  if (crossorigin) attrs.push(`crossorigin="${crossorigin}"`)

  // Handle lazy loading
  if (lazy) {
    attrs.push(`data-preload="${preload}"`)
    attrs.push('preload="none"')
    if (poster) attrs.push(`data-poster="${escapeAttr(poster)}"`)
    attrs.push('data-stx-lazy')
  } else {
    attrs.push(`preload="${preload}"`)
    if (poster) attrs.push(`poster="${escapeAttr(poster)}"`)
  }

  if (width) attrs.push(`width="${width}"`)
  if (height) attrs.push(`height="${height}"`)
  if (className) attrs.push(`class="${escapeAttr(className)}"`)
  if (style) attrs.push(`style="${escapeAttr(style)}"`)

  // Build source tags
  const sourceTags = videoSources
    .map((source) => {
      const srcAttr = lazy ? `data-src="${escapeAttr(source.src)}"` : `src="${escapeAttr(source.src)}"`
      return `  <source ${srcAttr} type="${source.type}"${source.media ? ` media="${source.media}"` : ''} />`
    })
    .join('\n')

  // Standard HTML5 video
  const html = `<video ${attrs.join(' ')}>
${sourceTags}
  Your browser does not support the video tag.
</video>`

  // Generate lazy load script if needed
  let script: string | undefined
  if (lazy) {
    script = `
(function() {
  var video = document.getElementById('${id}');
  if (!video) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        // Load poster
        if (video.dataset.poster) {
          video.poster = video.dataset.poster;
          delete video.dataset.poster;
        }

        // Load sources
        var sources = video.querySelectorAll('source[data-src]');
        sources.forEach(function(source) {
          source.src = source.dataset.src;
          delete source.dataset.src;
        });

        // Set preload
        if (video.dataset.preload) {
          video.preload = video.dataset.preload;
          delete video.dataset.preload;
        }

        video.load();
        observer.disconnect();
      }
    });
  }, { rootMargin: '50px' });

  observer.observe(video);
})();
`.trim()
  }

  return { html, script }
}

/**
 * Render an external video embed (YouTube, Vimeo, etc.)
 */
function renderEmbed(
  url: string,
  type: 'youtube' | 'vimeo' | 'dailymotion' | 'twitch',
  props: VideoProps,
): VideoRenderResult {
  const { width = 640, height = 360 } = props
  const className = props.class
  const style = props.style
  const id = props.id || `stx-embed-${Math.random().toString(36).slice(2, 8)}`

  let embedUrl: string
  let videoId: string | null = null

  // Extract video ID
  switch (type) {
    case 'youtube':
      videoId = extractYouTubeId(url)
      embedUrl = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : url
      break
    case 'vimeo':
      videoId = extractVimeoId(url)
      embedUrl = videoId ? `https://player.vimeo.com/video/${videoId}` : url
      break
    case 'dailymotion':
      videoId = url.split('/').pop() || ''
      embedUrl = `https://www.dailymotion.com/embed/video/${videoId}`
      break
    case 'twitch':
      videoId = url.split('/').pop() || ''
      embedUrl = `https://player.twitch.tv/?video=${videoId}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`
      break
    default:
      embedUrl = url
  }

  const attrs: string[] = [
    `id="${id}"`,
    `src="${escapeAttr(embedUrl)}"`,
    `width="${width}"`,
    `height="${height}"`,
    'frameborder="0"',
    'allowfullscreen',
    'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"',
  ]

  if (className) attrs.push(`class="${escapeAttr(className)}"`)
  if (style) attrs.push(`style="${escapeAttr(style)}"`)

  if (props.lazy) {
    attrs.push('loading="lazy"')
  }

  const html = `<div class="stx-video-embed" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;">
  <iframe ${attrs.join(' ')} style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe>
</div>`

  return { html }
}

// =============================================================================
// Helpers
// =============================================================================

function detectMimeType(src: string): string {
  const ext = src.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogg':
    case 'ogv':
      return 'video/ogg'
    case 'mov':
      return 'video/quicktime'
    case 'avi':
      return 'video/x-msvideo'
    case 'mkv':
      return 'video/x-matroska'
    case 'm3u8':
      return 'application/x-mpegURL'
    default:
      return 'video/mp4'
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/v\/([^?]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/)
  return match ? match[1] : null
}

function escapeAttr(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// =============================================================================
// Directive
// =============================================================================

/**
 * Parse @video directive options
 */
export function parseVideoDirectiveOptions(
  content: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
): VideoProps {
  if (params.src) {
    return {
      src: String(params.src),
      ...params as Partial<VideoProps>,
    }
  }

  // Parse from content
  let args = content.trim()
  if (args.startsWith('@video(') || args.startsWith('(')) {
    args = args.replace(/^@video\(/, '').replace(/^\(/, '').replace(/\)$/, '')
  }

  // Simple parsing: first arg is src, second is options object
  const commaIdx = args.indexOf(',')
  if (commaIdx === -1) {
    return { src: args.replace(/^['"]|['"]$/g, '') }
  }

  const src = args.slice(0, commaIdx).trim().replace(/^['"]|['"]$/g, '')
  const optStr = args.slice(commaIdx + 1).trim()

  try {
    const opts = JSON.parse(optStr)
    return { src, ...opts }
  } catch {
    return { src }
  }
}
