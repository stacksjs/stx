/**
 * STX Media - Video Module
 *
 * Video playback with native HTML5 and ts-video-player integration.
 *
 * This module provides a <Video> component that integrates with the
 * ts-video-player library for advanced playback features including:
 * - HLS/DASH streaming support
 * - YouTube/Vimeo embeds with custom controls
 * - Keyboard shortcuts
 * - Picture-in-Picture
 * - Full accessibility support
 *
 * With ts-videos integration:
 * - Video transcoding with quality presets
 * - Automatic poster/thumbnail generation
 * - HLS/DASH streaming manifest generation
 * - Sprite sheet generation for scrubbing preview
 *
 * @module media/video
 */

import type {
  VideoProps,
  VideoRenderResult,
  VideoSource,
  EnhancedVideoProps,
  TsVideosConfig,
  ProcessedVideoResult,
} from '../types'

// =============================================================================
// ts-videos Integration
// =============================================================================

/**
 * Lazy import processor to avoid blocking module initialization
 */
async function getProcessor(): Promise<typeof import('./processor') | null> {
  try {
    return await import('./processor')
  } catch {
    return null
  }
}

/**
 * Extended video render context with ts-videos config
 */
export interface ExtendedVideoRenderContext {
  /** Development mode */
  isDev?: boolean
  /** ts-videos configuration */
  tsVideosConfig?: TsVideosConfig
  /** Pre-processed video result */
  processedResult?: ProcessedVideoResult
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_CONTROLS = true
const DEFAULT_PRELOAD = 'metadata'
const TS_VIDEO_PLAYER_CDN = 'https://cdn.jsdelivr.net/npm/ts-video-player@latest/dist/index.min.js'

// =============================================================================
// Video Component
// =============================================================================

/**
 * Render a video component
 *
 * Supports both standard VideoProps and EnhancedVideoProps with ts-videos integration.
 *
 * @example
 * ```typescript
 * // Native HTML5 video
 * const result = await renderVideoComponent({
 *   src: '/videos/intro.mp4',
 *   poster: '/images/poster.jpg',
 *   controls: true,
 *   lazy: true,
 * })
 *
 * // With ts-video-player for advanced features
 * const result = await renderVideoComponent({
 *   src: 'https://youtube.com/watch?v=xxx',
 *   player: 'ts-video',
 *   lazy: true,
 * })
 *
 * // With ts-videos processing
 * const result = await renderVideoComponent({
 *   src: '/videos/raw.mov',
 *   process: true,
 *   quality: 'high',
 *   generatePoster: { timestamp: 5 },
 *   streaming: { format: 'hls' },
 * }, { tsVideosConfig: { enabled: true, outputDir: 'dist/videos' } })
 * ```
 */
export async function renderVideoComponent(
  props: VideoProps | EnhancedVideoProps,
  context: { isDev?: boolean } | ExtendedVideoRenderContext = {},
): Promise<VideoRenderResult> {
  const extendedContext = context as ExtendedVideoRenderContext
  const enhancedProps = props as EnhancedVideoProps

  // Check if ts-videos processing is requested
  if (enhancedProps.process && !enhancedProps.skipProcessing) {
    const tsVideosConfig = extendedContext.tsVideosConfig
    if (tsVideosConfig?.enabled && !extendedContext.isDev) {
      return renderWithTsVideos(enhancedProps, extendedContext)
    }
  }

  // Check if we have pre-processed results
  if (extendedContext.processedResult?.processed) {
    return renderFromProcessedResult(props, extendedContext.processedResult, context)
  }

  // Handle poster generation request (even without full processing)
  let generatedPoster: string | undefined
  if (enhancedProps.generatePoster && enhancedProps.src && !props.poster) {
    generatedPoster = await generatePosterOnDemand(enhancedProps, extendedContext)
  }

  const {
    src,
    sources = [],
    poster: originalPoster,
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

  const poster = generatedPoster || originalPoster

  const className = props.class
  const style = props.style
  const id = props.id || `stx-video-${Math.random().toString(36).slice(2, 8)}`

  // Use ts-video-player for advanced features
  if (player === 'ts-video') {
    return renderTsVideoPlayer(props, context)
  }

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
// ts-video-player Integration
// =============================================================================

/**
 * Render video using ts-video-player library
 *
 * This provides advanced features like:
 * - HLS/DASH streaming support
 * - YouTube/Vimeo with custom controls
 * - Keyboard shortcuts
 * - Picture-in-Picture
 * - Accessibility
 */
function renderTsVideoPlayer(
  props: VideoProps,
  context: { isDev?: boolean } = {},
): VideoRenderResult {
  const {
    src,
    sources = [],
    poster,
    controls = true,
    autoplay = false,
    muted = false,
    loop = false,
    preload = 'metadata',
    playsinline = true,
    lazy = true,
    width,
    height,
  } = props

  const className = props.class
  const style = props.style
  const id = props.id || `ts-video-${Math.random().toString(36).slice(2, 8)}`

  // Build player configuration
  const playerConfig = {
    src: sources.length > 0 ? sources : src,
    autoplay,
    loop,
    muted,
    playsinline,
    preload,
    poster,
    controls,
    title: props.title,
  }

  // Build container styles
  const containerStyle = [
    'position: relative',
    width ? `width: ${typeof width === 'number' ? width + 'px' : width}` : 'width: 100%',
    height ? `height: ${typeof height === 'number' ? height + 'px' : height}` : '',
    style || '',
  ].filter(Boolean).join('; ')

  // Build HTML container
  const html = `
<div
  id="${id}"
  class="ts-video-player${className ? ' ' + escapeAttr(className) : ''}"
  style="${containerStyle}"
  data-ts-video-player
  data-config='${JSON.stringify(playerConfig)}'
  ${lazy ? 'data-lazy' : ''}
>
  <div class="ts-video-player__container">
    ${poster ? `
    <div class="ts-video-player__placeholder" style="background-image: url('${escapeAttr(poster)}');">
      <button class="ts-video-player__play-button" aria-label="Play video">
        <svg viewBox="0 0 24 24" fill="currentColor" width="64" height="64">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>
    ` : ''}
  </div>
</div>
`.trim()

  // Generate initialization script
  const script = `
(function() {
  var container = document.getElementById('${id}');
  if (!container) return;

  var config = JSON.parse(container.dataset.config || '{}');
  var isLazy = container.hasAttribute('data-lazy');

  function loadPlayer() {
    if (typeof TSVideoPlayer !== 'undefined') {
      initPlayer();
      return;
    }

    // Load ts-video-player from CDN
    var script = document.createElement('script');
    script.src = '${TS_VIDEO_PLAYER_CDN}';
    script.onload = initPlayer;
    script.onerror = function() {
      console.error('[stx] Failed to load ts-video-player');
      fallbackToNative();
    };
    document.head.appendChild(script);
  }

  function initPlayer() {
    var player = TSVideoPlayer.createPlayer(container, config);
    if (config.src) {
      player.setSrc(config.src);
    }
    container.__tsVideoPlayer = player;

    // Remove placeholder
    var placeholder = container.querySelector('.ts-video-player__placeholder');
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  function fallbackToNative() {
    // Fallback to native video element
    var video = document.createElement('video');
    video.controls = config.controls !== false;
    video.autoplay = config.autoplay;
    video.muted = config.muted;
    video.loop = config.loop;
    video.playsInline = config.playsinline;
    video.preload = config.preload || 'metadata';
    if (config.poster) video.poster = config.poster;
    if (config.src) video.src = typeof config.src === 'string' ? config.src : config.src[0]?.src || config.src[0];
    video.style.width = '100%';
    video.style.height = '100%';

    var containerEl = container.querySelector('.ts-video-player__container');
    if (containerEl) {
      containerEl.innerHTML = '';
      containerEl.appendChild(video);
    }
  }

  if (isLazy) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          loadPlayer();
          observer.disconnect();
        }
      });
    }, { rootMargin: '50px' });
    observer.observe(container);
  } else {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadPlayer);
    } else {
      loadPlayer();
    }
  }

  // Handle play button click
  var playButton = container.querySelector('.ts-video-player__play-button');
  if (playButton) {
    playButton.addEventListener('click', function() {
      loadPlayer();
      var check = setInterval(function() {
        if (container.__tsVideoPlayer && container.__tsVideoPlayer.ready) {
          container.__tsVideoPlayer.play();
          clearInterval(check);
        }
      }, 100);
    });
  }
})();
`.trim()

  // Generate styles
  const css = `
.ts-video-player {
  position: relative;
  background: #000;
}

.ts-video-player__container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
}

.ts-video-player__container > * {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.ts-video-player__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #1a1a1a;
  background-size: cover;
  background-position: center;
  cursor: pointer;
}

.ts-video-player__play-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: rgba(0, 0, 0, 0.7);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.ts-video-player__play-button:hover {
  transform: scale(1.1);
  background: rgba(0, 0, 0, 0.9);
}

.ts-video-player__play-button svg {
  margin-left: 4px;
}
`.trim()

  return { html, script, css }
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

// =============================================================================
// ts-videos Integration Functions
// =============================================================================

/**
 * Render video using ts-videos processor
 */
async function renderWithTsVideos(
  props: EnhancedVideoProps,
  context: ExtendedVideoRenderContext,
): Promise<VideoRenderResult> {
  const processor = await getProcessor()
  if (!processor) {
    // Fallback to standard rendering
    return renderVideoComponent({ ...props, process: false } as VideoProps, context)
  }

  const tsConfig = context.tsVideosConfig!

  // Process video
  const processed = await processor.processVideo(
    props.src!,
    props,
    tsConfig,
    props.onProcessProgress,
  )

  if (processed.processed) {
    return renderFromProcessedResult(props, processed, context)
  }

  // Fallback if processing failed
  return renderVideoComponent({ ...props, process: false } as VideoProps, context)
}

/**
 * Generate poster on demand without full video processing
 */
async function generatePosterOnDemand(
  props: EnhancedVideoProps,
  context: ExtendedVideoRenderContext,
): Promise<string | undefined> {
  const processor = await getProcessor()
  if (!processor || !props.src) {
    return undefined
  }

  const posterOpts = typeof props.generatePoster === 'object'
    ? props.generatePoster
    : { timestamp: 0 }

  const tsConfig = context.tsVideosConfig || {
    enabled: true,
    outputDir: 'dist/videos',
    baseUrl: '/videos',
  }

  const poster = await processor.generatePoster(
    props.src,
    posterOpts,
    tsConfig.outputDir,
    tsConfig.baseUrl || '/videos',
  )

  return poster?.url
}

/**
 * Render from pre-processed result
 */
function renderFromProcessedResult(
  props: VideoProps | EnhancedVideoProps,
  processed: ProcessedVideoResult,
  context: { isDev?: boolean } | ExtendedVideoRenderContext,
): VideoRenderResult {
  const {
    controls = DEFAULT_CONTROLS,
    autoplay = false,
    muted = false,
    loop = false,
    preload = DEFAULT_PRELOAD,
    playsinline = true,
    lazy = true,
    width,
    height,
    crossorigin,
    disablePictureInPicture = false,
    disableRemotePlayback = false,
  } = props

  const className = props.class
  const style = props.style
  const id = props.id || `stx-video-${Math.random().toString(36).slice(2, 8)}`

  // Determine video source
  let videoSrc = props.src!
  let mimeType = detectMimeType(videoSrc)

  // Use transcoded video if available
  if (processed.transcoded) {
    videoSrc = processed.transcoded.url
    mimeType = 'video/mp4'
  }

  // Use streaming manifest if available
  const useStreaming = processed.streaming?.hls || processed.streaming?.dash
  if (useStreaming) {
    if (processed.streaming?.hls) {
      videoSrc = processed.streaming.hls.manifestUrl
      mimeType = 'application/x-mpegURL'
    } else if (processed.streaming?.dash) {
      videoSrc = processed.streaming.dash.manifestUrl
      mimeType = 'application/dash+xml'
    }
  }

  // Use generated poster if available
  const poster = processed.poster?.url || props.poster

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

  // Use processed dimensions if available
  const videoWidth = width || processed.metadata?.width
  const videoHeight = height || processed.metadata?.height
  if (videoWidth) attrs.push(`width="${videoWidth}"`)
  if (videoHeight) attrs.push(`height="${videoHeight}"`)

  if (className) attrs.push(`class="${escapeAttr(className)}"`)
  if (style) attrs.push(`style="${escapeAttr(style)}"`)

  // Build source tag
  const srcAttr = lazy ? `data-src="${escapeAttr(videoSrc)}"` : `src="${escapeAttr(videoSrc)}"`
  const sourceTag = `  <source ${srcAttr} type="${mimeType}" />`

  // Build HTML
  let html = `<video ${attrs.join(' ')}>
${sourceTag}
  Your browser does not support the video tag.
</video>`

  // Add sprite sheet data if available
  if (processed.spriteSheet) {
    html = `<div class="stx-video-wrapper" data-sprite-sheet="${escapeAttr(processed.spriteSheet.url)}" data-sprite-cols="${processed.spriteSheet.columns}" data-sprite-interval="${processed.spriteSheet.interval}">
${html}
</div>`
  }

  // Generate lazy load script
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

  // Generate CSS for streaming player if needed
  let css: string | undefined
  if (useStreaming) {
    css = `
.stx-video-wrapper {
  position: relative;
  width: 100%;
}
.stx-video-wrapper video {
  width: 100%;
  height: auto;
}
`.trim()
  }

  return { html, script, css }
}
