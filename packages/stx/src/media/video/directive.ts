/**
 * STX Media - Video Directive
 *
 * @video directive for declarative video rendering with ts-videos integration.
 *
 * @module media/video/directive
 *
 * @example
 * ```html
 * @video('/videos/intro.mp4', { controls: true, lazy: true })
 * @video('/videos/movie.mp4', { quality: 'high', generatePoster: true })
 * @video(dynamicSrc, { streaming: { format: 'hls' } })
 * ```
 */

import { defineDirective } from '../../directive-api'
import type { CustomDirective } from '../../types'
import type { VideoProps, EnhancedVideoProps, VideoDirectiveOptions } from '../types'
import { renderVideoComponent, type ExtendedVideoRenderContext } from './index'

// =============================================================================
// Directive Definition
// =============================================================================

/**
 * Create the @video directive
 */
export function createVideoDirective(): CustomDirective {
  return defineDirective<{
    src: string
    options: VideoDirectiveOptions
  }>({
    name: 'video',
    hasEndTag: false,
    description: 'Render a video with optional ts-videos processing, streaming, and poster generation',

    transform: async (content, params, context, filePath) => {
      // Parse arguments from content
      const { src, options } = parseVideoArgs(content, params, context)

      if (!src) {
        console.warn('@video directive: missing src argument')
        return '<!-- @video: missing src -->'
      }

      // Build component props
      const props: VideoProps | EnhancedVideoProps = {
        src,
        poster: options.poster,
        controls: options.controls !== false,
        autoplay: options.autoplay || false,
        muted: options.muted || false,
        loop: options.loop || false,
        preload: options.preload || 'metadata',
        playsinline: options.playsinline !== false,
        lazy: options.lazy !== false,
        player: options.player || 'native',
        type: options.type,
        width: options.width,
        height: options.height,
        class: options.class,
        style: options.style,
        id: options.id,
        crossorigin: options.crossorigin,
        disablePictureInPicture: options.disablePictureInPicture,
        disableRemotePlayback: options.disableRemotePlayback,
        title: options.title,
        // Enhanced props (ts-videos integration)
        quality: (options as any).quality,
        platform: (options as any).platform,
        process: (options as any).process,
        generatePoster: (options as any).generatePoster,
        streaming: (options as any).streaming,
        transcode: (options as any).transcode,
        spriteSheet: (options as any).spriteSheet,
        waveform: (options as any).waveform,
      }

      // Build render context
      const isDev = context.__isDev as boolean || false
      const renderContext: ExtendedVideoRenderContext = {
        isDev,
        tsVideosConfig: context.__tsVideosConfig as any,
      }

      // Render the component
      const result = await renderVideoComponent(props, renderContext)

      // Combine all outputs
      let output = result.html

      // Add styles if present
      if (result.css) {
        output += `\n<style>${result.css}</style>`
      }

      // Add script if present
      if (result.script) {
        output += `\n<script>${result.script}</script>`
      }

      return output
    },

    // Default parameter values
    defaults: {
      src: '',
      options: {
        controls: true,
        lazy: true,
        preload: 'metadata',
      },
    },
  })
}

// =============================================================================
// Argument Parsing
// =============================================================================

/**
 * Parse @video directive arguments
 *
 * Supports:
 * - @video('/path/to/video.mp4', { options })
 * - @video('/path/to/video.mp4')
 * - @video(srcVariable, optionsVariable)
 */
function parseVideoArgs(
  content: string,
  params: Record<string, unknown>,
  context: Record<string, unknown>,
): { src: string; options: VideoDirectiveOptions } {
  // If params already structured, use them
  if (params.src) {
    return {
      src: String(params.src),
      options: (params.options || {}) as VideoDirectiveOptions,
    }
  }

  // Parse from content string: @video('src', { options })
  let args = content.trim()

  // Remove @video( prefix and ) suffix if present
  if (args.startsWith('@video(') || args.startsWith('(')) {
    args = args.replace(/^@video\(/, '').replace(/^\(/, '').replace(/\)$/, '')
  }

  // Parse arguments
  const parsed = parseArguments(args)

  // Resolve variable references from context
  const src = resolveValue(parsed[0], context) as string || ''
  let options: VideoDirectiveOptions = {}

  // Parse options object if present
  if (parsed[1]) {
    const resolvedOptions = resolveValue(parsed[1], context)
    if (typeof resolvedOptions === 'object' && resolvedOptions !== null) {
      options = resolvedOptions as VideoDirectiveOptions
    } else if (typeof parsed[1] === 'string') {
      try {
        options = JSON.parse(parsed[1])
      } catch {
        // Options parsing failed, use empty
      }
    }
  }

  return { src, options }
}

/**
 * Parse comma-separated arguments with proper quote and brace handling
 */
function parseArguments(argsStr: string): unknown[] {
  const args: unknown[] = []
  let current = ''
  let inString = false
  let stringChar = ''
  let braceDepth = 0
  let bracketDepth = 0

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i]
    const prevChar = i > 0 ? argsStr[i - 1] : ''

    // Handle string delimiters
    if ((char === '"' || char === '\'' || char === '`') && prevChar !== '\\') {
      if (!inString) {
        inString = true
        stringChar = char
      } else if (char === stringChar) {
        inString = false
        stringChar = ''
      } else {
        current += char
      }
      continue
    }

    // Track braces/brackets when not in string
    if (!inString) {
      if (char === '{') braceDepth++
      if (char === '}') braceDepth--
      if (char === '[') bracketDepth++
      if (char === ']') bracketDepth--

      // Comma delimiter at top level
      if (char === ',' && braceDepth === 0 && bracketDepth === 0) {
        args.push(current.trim())
        current = ''
        continue
      }
    }

    current += char
  }

  // Push last argument
  if (current.trim()) {
    args.push(current.trim())
  }

  return args
}

/**
 * Resolve a value that might be a variable reference
 */
function resolveValue(value: unknown, context: Record<string, unknown>): unknown {
  if (typeof value !== 'string') return value

  // Remove quotes if present
  const trimmed = value.trim()
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1)
  }

  // Check if it's a variable reference (no quotes, not a path, not an object)
  if (!trimmed.startsWith('/') &&
      !trimmed.startsWith('.') &&
      !trimmed.startsWith('http') &&
      !trimmed.startsWith('{')) {
    const contextValue = context[trimmed]
    if (contextValue !== undefined) {
      return contextValue
    }
  }

  // Try to parse as JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      // Not valid JSON
    }
  }

  return trimmed
}

// =============================================================================
// Export
// =============================================================================

/**
 * The @video directive instance
 */
export const videoDirective = createVideoDirective()
