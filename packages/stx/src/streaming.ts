/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Streaming and Hydration Module
 *
 * This module provides:
 * - Template streaming for progressive rendering
 * - Island-based partial hydration support
 * - Section-based template composition
 *
 * ## Section Pattern
 *
 * Sections use HTML comments for markers:
 * ```html
 * <!-- @section:name -->
 *   Content here
 * <!-- @endsection:name -->
 * ```
 *
 * **Note**: HTML comments are used because:
 * - They're valid in any position in HTML
 * - They don't affect the DOM structure
 * - They're stripped during minification
 *
 * Alternative using data attributes (for JS-based extraction):
 * ```html
 * <template data-section="name">Content</template>
 * ```
 *
 * ## Island Hydration
 *
 * Islands are client-side interactive regions in server-rendered content:
 * ```html
 * @island('counter', 'eager')
 *   <div>Count: {{ count }}</div>
 * @endisland
 * ```
 *
 * Priority levels:
 * - `eager` - Hydrate immediately on page load
 * - `lazy` (default) - Hydrate when visible (IntersectionObserver)
 * - `idle` - Hydrate during browser idle time (requestIdleCallback)
 *
 * ## Streaming
 *
 * Current implementation returns full content in a single chunk.
 * True chunked streaming requires:
 * 1. HTTP/2 or chunked transfer encoding
 * 2. Identifying suspense boundaries
 * 3. Streaming each section as it completes
 */

import type { CustomDirective, StreamingConfig, StreamRenderer, StxOptions } from './types'
import path from 'node:path'
import { defaultConfig } from './config'
import { escapeHtml } from './expressions'
import { processDirectives } from './process'
import { createDetailedErrorMessage, extractVariables } from './utils'

// =============================================================================
// Configuration
// =============================================================================

/**
 * Default streaming configuration
 */
const defaultStreamingConfig: StreamingConfig = {
  enabled: true,
  bufferSize: 1024 * 16, // 16KB chunks
  strategy: 'auto',
  timeout: 30000, // 30 seconds
}

/**
 * Section regex pattern to extract sections from templates.
 *
 * Pattern: `<!-- @section:name -->content<!-- @endsection:name -->`
 * - Uses HTML comments for maximum compatibility
 * - Names support word characters and hyphens: [\\w-]+
 * - Uses backreference \\1 to match opening/closing tags
 */
const SECTION_PATTERN = /<!-- @section:([\w-]+) -->([\s\S]*?)<!-- @endsection:\1 -->/g

/**
 * Alternative section pattern using data attributes (not currently used).
 * Could be enabled via configuration for environments that need DOM extraction.
 */
const _DATA_SECTION_PATTERN = /<template\s+data-section="([\w-]+)">([\s\S]*?)<\/template>/g

/**
 * Suspense boundary pattern for chunked streaming.
 * Matches: <!-- @suspense:name -->content<!-- @endsuspense:name -->
 */
const SUSPENSE_PATTERN = /<!-- @suspense:([\w-]+) -->([\s\S]*?)<!-- @endsuspense:\1 -->/g

/**
 * Shell boundary pattern to separate shell (immediate) from deferred content.
 * Content before the first suspense boundary is the shell.
 */
interface StreamChunk {
  type: 'shell' | 'suspense' | 'content'
  name?: string
  content: string
  priority?: number
}

/**
 * Parse template into streamable chunks.
 * Separates the shell (before any suspense) from suspense boundaries.
 */
function parseStreamableChunks(content: string): StreamChunk[] {
  const chunks: StreamChunk[] = []
  let lastIndex = 0
  let match

  SUSPENSE_PATTERN.lastIndex = 0

  // Find all suspense boundaries
  // eslint-disable-next-line no-cond-assign
  while ((match = SUSPENSE_PATTERN.exec(content)) !== null) {
    // Add content before this suspense as shell/content
    if (match.index > lastIndex) {
      const beforeContent = content.slice(lastIndex, match.index)
      if (beforeContent.trim()) {
        chunks.push({
          type: chunks.length === 0 ? 'shell' : 'content',
          content: beforeContent,
        })
      }
    }

    // Add the suspense boundary with placeholder
    const suspenseName = match[1]
    const suspenseContent = match[2]

    // Add placeholder in shell for where suspense content will go
    chunks.push({
      type: 'suspense',
      name: suspenseName,
      content: suspenseContent,
    })

    lastIndex = match.index + match[0].length
  }

  // Add remaining content after last suspense
  if (lastIndex < content.length) {
    const remainingContent = content.slice(lastIndex)
    if (remainingContent.trim()) {
      chunks.push({
        type: chunks.length === 0 ? 'shell' : 'content',
        content: remainingContent,
      })
    }
  }

  // If no suspense boundaries found, return whole content as shell
  if (chunks.length === 0) {
    chunks.push({
      type: 'shell',
      content,
    })
  }

  return chunks
}

/**
 * Stream a template with data using chunked transfer encoding.
 *
 * This implements actual progressive streaming by:
 * 1. Sending the shell (content before suspense) immediately
 * 2. Processing suspense boundaries in parallel
 * 3. Streaming each resolved suspense content as it completes
 * 4. Using out-of-order streaming with client-side reordering
 *
 * @param templatePath Path to the template
 * @param data Data to render with the template
 * @param options stx options
 */
export async function streamTemplate(
  templatePath: string,
  data: Record<string, any> = {},
  options: StxOptions = {},
): Promise<ReadableStream<string>> {
  const fullOptions = {
    ...defaultConfig,
    ...options,
    streaming: {
      ...defaultStreamingConfig,
      ...options.streaming,
    },
  }

  const bufferSize = fullOptions.streaming?.bufferSize || 16384

  return new ReadableStream<string>({
    async start(controller) {
      try {
        // Read the template file
        const content = await Bun.file(templatePath).text()

        // Extract only <script server> content for variable extraction
        const serverScriptMatch = content.match(/<script\b[^>]*\bserver\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = serverScriptMatch ? serverScriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

        // Create context with data
        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        // Extract variables from server script
        if (scriptContent.trim()) {
          await extractVariables(scriptContent, context, templatePath)
        }

        // Parse into streamable chunks
        const chunks = parseStreamableChunks(templateContent)
        const dependencies = new Set<string>()

        // Check if we have suspense boundaries for true streaming
        const hasSuspense = chunks.some(c => c.type === 'suspense')

        if (!hasSuspense) {
          const strategy = fullOptions.streaming?.strategy || 'auto'
          const sectionTestRegex = new RegExp(SECTION_PATTERN.source, 'g')
          const hasSections = strategy !== 'manual' && sectionTestRegex.test(templateContent)

          if (!hasSections) {
            // No sections — process entirely, byte-chunk as before
            const output = await processDirectives(templateContent, context, templatePath, fullOptions, dependencies)

            for (let i = 0; i < output.length; i += bufferSize) {
              controller.enqueue(output.slice(i, i + bufferSize))
              await new Promise(resolve => setTimeout(resolve, 0))
            }
          }
          else {
            // Has sections — process and flush each independently
            const sections: { name: string, content: string, start: number, end: number }[] = []
            const sectionRegex = new RegExp(SECTION_PATTERN.source, 'g')
            let match
            // eslint-disable-next-line no-cond-assign
            while ((match = sectionRegex.exec(templateContent)) !== null) {
              sections.push({ name: match[1], content: match[2], start: match.index, end: match.index + match[0].length })
            }

            let lastEnd = 0
            for (const section of sections) {
              // Flush shell content before this section
              if (section.start > lastEnd) {
                const shellPart = templateContent.slice(lastEnd, section.start)
                if (shellPart.trim()) {
                  const processed = await processDirectives(shellPart, context, templatePath, fullOptions, dependencies)
                  controller.enqueue(processed)
                  await new Promise(resolve => setTimeout(resolve, 0))
                }
              }
              // Process and flush this section
              const processed = await processDirectives(section.content, context, templatePath, fullOptions, dependencies)
              controller.enqueue(processed)
              await new Promise(resolve => setTimeout(resolve, 0))
              lastEnd = section.end
            }
            // Flush remaining content after last section
            if (lastEnd < templateContent.length) {
              const remaining = templateContent.slice(lastEnd)
              if (remaining.trim()) {
                const processed = await processDirectives(remaining, context, templatePath, fullOptions, dependencies)
                controller.enqueue(processed)
              }
            }
          }
        }
        else {
          // Has suspense boundaries - use progressive streaming
          const suspensePromises: Map<string, Promise<string>> = new Map()

          // First pass: send shell with placeholders, start suspense processing
          for (const chunk of chunks) {
            if (chunk.type === 'shell' || chunk.type === 'content') {
              // Process and send immediately
              const processed = await processDirectives(chunk.content, context, templatePath, fullOptions, dependencies)
              controller.enqueue(processed)
            }
            else if (chunk.type === 'suspense' && chunk.name) {
              // Send placeholder for suspense content
              const placeholderId = `stx-suspense-${chunk.name}`
              controller.enqueue(`<div id="${placeholderId}" data-suspense="${chunk.name}" style="display:contents;">
  <template data-suspense-fallback>Loading...</template>
</div>`)

              // Start processing suspense content in parallel
              suspensePromises.set(
                chunk.name,
                processDirectives(chunk.content, context, templatePath, fullOptions, dependencies),
              )
            }
          }

          // Send streaming runtime script
          controller.enqueue(`
<script>
(function() {
  window.__stxSuspense = window.__stxSuspense || {
    resolve: function(name, content) {
      var el = document.querySelector('[data-suspense="' + name + '"]');
      if (el) {
        // Create a template to parse the HTML
        var template = document.createElement('template');
        template.innerHTML = content;
        // Replace placeholder with actual content
        el.replaceWith(template.content);
      }
    }
  };
})();
</script>`)

          // Stream resolved suspense content as it completes
          const resolvePromises = Array.from(suspensePromises.entries()).map(
            async ([name, promise]) => {
              controller.enqueue(await buildSuspenseResolveScript(name, promise))
            },
          )

          // Wait for all suspense boundaries to resolve
          await Promise.all(resolvePromises)
        }

        // Close the stream
        controller.close()
      }
      catch (error: unknown) {
        controller.error(error)
      }
    },
  })
}

/**
 * Build the <script> chunk that resolves a single suspense boundary.
 *
 * On success it injects the rendered content (backtick- and
 * </script>-escaped so it can't break out of the template literal). On
 * rejection it injects a marked-up, HTML-escaped error UI instead of
 * letting the failure take down the whole stream — one boundary's error
 * is isolated to that boundary's placeholder.
 *
 * Extracted from the inline resolve loop so the error path is directly
 * unit-testable with a rejecting promise, without mocking the render
 * pipeline (the previous test mocked `processDirectives` via
 * `mock.module`, which is process-global in Bun and leaked into every
 * later test in the run — the root cause of a large cross-contamination
 * cluster). See stacksjs/stx#1711.
 */
export async function buildSuspenseResolveScript(name: string, promise: Promise<string>): Promise<string> {
  try {
    const content = await promise
    const escapedContent = content.replace(/`/g, '\\`').replace(/<\/script>/gi, '<\\/script>')
    return `
<script>
window.__stxSuspense.resolve('${name}', \`${escapedContent}\`);
</script>`
  }
  catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return `
<script>
window.__stxSuspense.resolve('${name}', '<div class="stx-error">Error loading content: ${escapeHtml(errorMsg)}</div>');
</script>`
  }
}

/**
 * Client receiver for streamed boundaries. Emitted once, right after the shell:
 * defines `window.__stxSuspense.resolve(id, html)`, which swaps the boundary's
 * fallback placeholder (`[data-suspense="id"]`) for the streamed content.
 * Idempotent (`|| { … }`) so multiple streamed renders on one document — or a
 * re-run after SPA nav — don't clobber an in-flight receiver.
 */
export const SUSPENSE_RESOLVER_RUNTIME: string = `
<script>
(function(){
  window.__stxSuspense = window.__stxSuspense || {
    resolve: function(name, content){
      var el = document.querySelector('[data-suspense="' + name + '"]');
      if (!el) return;
      var t = document.createElement('template');
      t.innerHTML = content;
      // Keep handles to the inserted nodes — the fragment is emptied on insert.
      var nodes = Array.prototype.slice.call(t.content.childNodes);
      el.replaceWith(t.content);
      // Hydrate the streamed content so interactive islands/directives inside
      // it come alive (no-op when the signals runtime isn't on the page).
      if (window.stx && typeof window.stx.hydrate === 'function') {
        nodes.forEach(function(n){ if (n.nodeType === 1) window.stx.hydrate(n); });
      }
    }
  };
})();
</script>`

/** A deferred streaming boundary: its `render` does the server-side async work. */
export interface StreamBoundary {
  /** Boundary id — matches the `data-suspense="<id>"` placeholder in the shell. */
  id: string
  /**
   * Server-side async render for this boundary: fetch + render, resolving to the
   * final HTML. Runs AFTER the shell has been flushed, so the slow data work
   * here doesn't block first paint.
   */
  render: () => Promise<string>
}

/**
 * Render a streaming-SSR page (#1746 Phase 3). Flushes the shell — which carries
 * each boundary's fallback in a `[data-suspense="<id>"]` placeholder — to the
 * browser immediately, then streams each boundary's HTML as its server-side
 * async `render()` resolves, in completion order. The browser paints the shell
 * at once and each slow region swaps in when its data is ready.
 *
 * Per-boundary errors are isolated (`buildSuspenseResolveScript` emits an error
 * UI into that boundary instead of failing the whole stream). Pair with
 * `streamToResponse` to get a chunked HTTP `Response`.
 */
export interface RenderStreamingOptions {
  /**
   * Per-boundary timeout in ms. A boundary whose `render()` doesn't resolve in
   * time is rejected (→ an error UI in its placeholder) so a hung data source
   * can't keep the stream open forever. `0` (default) = no timeout.
   */
  timeoutMs?: number
}

/** Reject `promise` if it doesn't settle within `ms`; clears its timer either way. */
function withTimeout(promise: Promise<string>, ms: number, id: string): Promise<string> {
  if (!ms || ms <= 0)
    return promise
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<string>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`streaming boundary "${id}" timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

export function renderStreamingPage(
  shellHtml: string,
  boundaries: StreamBoundary[] = [],
  options: RenderStreamingOptions = {},
): ReadableStream<string> {
  const timeoutMs = options.timeoutMs ?? 0
  return new ReadableStream<string>({
    async start(controller) {
      try {
        // 1. Shell (with fallback placeholders) — flush immediately.
        controller.enqueue(shellHtml)
        if (boundaries.length > 0) {
          // 2. The client receiver, once.
          controller.enqueue(SUSPENSE_RESOLVER_RUNTIME)
          // 3. Each boundary streams independently, in resolution order — a slow
          //    one doesn't hold back a fast one; a hung one times out (if set).
          await Promise.all(boundaries.map(async (boundary) => {
            const render = withTimeout(boundary.render(), timeoutMs, boundary.id)
            controller.enqueue(await buildSuspenseResolveScript(boundary.id, render))
          }))
        }
        controller.close()
      }
      catch (error: unknown) {
        controller.error(error)
      }
    },
  })
}

// Captures the inner template of an `@stream('id') … @fallback … @endstream`
// block. `@fallback` is optional; everything before it is the deferred content,
// everything after is the fallback shown until the boundary resolves.
const STREAM_DIRECTIVE_RE = /@stream\s*\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)@endstream/gi

/**
 * Declarative streaming-SSR sugar (#1746 Phase 3). Extracts each
 * `@stream('id') <content> @fallback <fallback> @endstream` block, stashes the
 * RAW inner template on `context.__streamTemplates[id]` (re-rendered later with
 * `$boundary` data, so its `{{ }}` / directives stay un-evaluated now), and
 * replaces the block with the fallback inside a `data-suspense="id"` placeholder
 * — which flows through the normal pipeline. Distinct from the client-side
 * `@suspense` directive (suspense.ts), so the two don't collide.
 *
 * Runs early (before loops/expressions) so the captured template is pristine.
 */
export function processStreamDirectives(template: string, context: Record<string, any>): string {
  return template.replace(STREAM_DIRECTIVE_RE, (_match, rawId: string, inner: string) => {
    const id = rawId.trim()
    const parts = inner.split(/@fallback/i)
    const content = parts[0].trim()
    const fallback = parts.length > 1 ? parts.slice(1).join('@fallback').trim() : ''
    if (!context.__streamTemplates)
      context.__streamTemplates = {}
    context.__streamTemplates[id] = content
    return `<div data-suspense="${id}">${fallback}</div>`
  })
}

/**
 * Read streaming-SSR boundaries off a rendered page's server context (#1746
 * Phase 3). A page opts in by exporting `streamBoundaries` from `<script
 * server>` — a map of boundary id → server-side async render. Returns the
 * boundary list (sorted-stable by declaration), or `undefined` when the page
 * declared none. Non-function entries are ignored.
 */
export function extractStreamBoundaries(
  context: Record<string, unknown> | undefined | null,
): StreamBoundary[] | undefined {
  const map = context?.streamBoundaries as Record<string, () => Promise<string>> | undefined
  if (!map || typeof map !== 'object')
    return undefined
  const entries = Object.entries(map).filter(([, fn]) => typeof fn === 'function')
  return entries.length > 0 ? entries.map(([id, render]) => ({ id, render })) : undefined
}

/**
 * Stream a template with data (simple version without suspense).
 * Returns full content in chunks based on buffer size.
 *
 * @param templatePath Path to the template
 * @param data Data to render with the template
 * @param options stx options
 */
export async function streamTemplateSimple(
  templatePath: string,
  data: Record<string, any> = {},
  options: StxOptions = {},
): Promise<ReadableStream<string>> {
  const fullOptions = {
    ...defaultConfig,
    ...options,
    streaming: {
      ...defaultStreamingConfig,
      ...options.streaming,
    },
  }

  const bufferSize = fullOptions.streaming?.bufferSize || 16384

  return new ReadableStream<string>({
    async start(controller) {
      try {
        const content = await Bun.file(templatePath).text()
        const serverScriptMatch = content.match(/<script\b[^>]*\bserver\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = serverScriptMatch ? serverScriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        if (scriptContent.trim()) {
          await extractVariables(scriptContent, context, templatePath)
        }

        const dependencies = new Set<string>()
        const strategy = fullOptions.streaming?.strategy || 'auto'
        const sectionTestRegex = new RegExp(SECTION_PATTERN.source, 'g')
        const hasSections = strategy !== 'manual' && sectionTestRegex.test(templateContent)

        if (!hasSections) {
          // No sections — process entirely, byte-chunk as before
          const output = await processDirectives(templateContent, context, templatePath, fullOptions, dependencies)

          for (let i = 0; i < output.length; i += bufferSize) {
            controller.enqueue(output.slice(i, i + bufferSize))
          }
        }
        else {
          // Has sections — process and flush each independently
          const sections: { name: string, content: string, start: number, end: number }[] = []
          const sectionRegex = new RegExp(SECTION_PATTERN.source, 'g')
          let match
          // eslint-disable-next-line no-cond-assign
          while ((match = sectionRegex.exec(templateContent)) !== null) {
            sections.push({ name: match[1], content: match[2], start: match.index, end: match.index + match[0].length })
          }

          let lastEnd = 0
          for (const section of sections) {
            if (section.start > lastEnd) {
              const shellPart = templateContent.slice(lastEnd, section.start)
              if (shellPart.trim()) {
                const processed = await processDirectives(shellPart, context, templatePath, fullOptions, dependencies)
                controller.enqueue(processed)
              }
            }
            const processed = await processDirectives(section.content, context, templatePath, fullOptions, dependencies)
            controller.enqueue(processed)
            lastEnd = section.end
          }
          if (lastEnd < templateContent.length) {
            const remaining = templateContent.slice(lastEnd)
            if (remaining.trim()) {
              const processed = await processDirectives(remaining, context, templatePath, fullOptions, dependencies)
              controller.enqueue(processed)
            }
          }
        }

        controller.close()
      }
      catch (error: unknown) {
        controller.error(error)
      }
    },
  })
}

/**
 * Create a stream renderer for progressive loading
 * @param templatePath Path to the template
 * @param options stx options
 */
export async function createStreamRenderer(
  templatePath: string,
  options: StxOptions = {},
): Promise<StreamRenderer> {
  const fullOptions = {
    ...defaultConfig,
    ...options,
    streaming: {
      ...defaultStreamingConfig,
      ...options.streaming,
    },
  }

  // Read the template file
  const content = await Bun.file(templatePath).text()

  // Extract only <script server> for variable extraction
  const serverScriptMatch = content.match(/<script\b[^>]*\bserver\b[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = serverScriptMatch ? serverScriptMatch[1] : ''
  const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')

  // Store template original content
  const originalTemplate = templateContent

  // Extract sections from the template
  const sections: Record<string, string> = {}
  let match

  // Reset the regex
  SECTION_PATTERN.lastIndex = 0

  // Extract all sections
  // eslint-disable-next-line no-cond-assign
  while ((match = SECTION_PATTERN.exec(templateContent)) !== null) {
    const sectionName = match[1]
    const sectionContent = match[2]
    sections[sectionName] = sectionContent
  }

  // Replace all sections with placeholders to create the shell
  const shellTemplate = templateContent.replace(SECTION_PATTERN, '')

  // Create the stream renderer
  const renderer: StreamRenderer = {
    // Render the shell (initial HTML)
    renderShell: async (data: Record<string, any> = {}): Promise<string> => {
      // Create context with data
      const context: Record<string, any> = {
        ...data,
        __filename: templatePath,
        __dirname: path.dirname(templatePath),
      }

      // Extract variables from script
      await extractVariables(scriptContent, context, templatePath)

      // Process shell template
      const dependencies = new Set<string>()
      return processDirectives(shellTemplate, context, templatePath, fullOptions, dependencies)
    },

    // Render a specific section
    renderSection: async (sectionName: string, data: Record<string, any> = {}): Promise<string> => {
      try {
        if (!sections[sectionName]) {
          return `<div class="error-message">Section "${escapeHtml(sectionName)}" not found in template "${escapeHtml(templatePath)}"</div>`
        }

        // Create context with data
        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        // Extract variables from script (though we might already have done this in renderShell)
        await extractVariables(scriptContent, context, templatePath)

        // Process section template
        const dependencies = new Set<string>()
        return await processDirectives(sections[sectionName], context, templatePath, fullOptions, dependencies)
      }
      catch (error: unknown) {
        // Handle errors gracefully
        const errorMessage = error instanceof Error ? error.message : String(error)
        return createDetailedErrorMessage(
          'Expression',
          errorMessage,
          templatePath,
          sections[sectionName] || '',
          0,
          sections[sectionName] || '',
        )
      }
    },

    // Get all section names
    getSections: (): string[] => {
      return Object.keys(sections)
    },

    // Get the original template content
    getTemplate: (): string => {
      return originalTemplate
    },
  }

  return renderer
}

/**
 * Custom directive for marking suspense boundaries in streaming templates.
 *
 * Usage:
 * ```html
 * @suspense('heavy-content')
 *   <div>This content will stream after the shell</div>
 * @endsuspense
 * ```
 *
 * The content inside suspense boundaries will be:
 * 1. Replaced with a placeholder in the initial shell
 * 2. Processed in parallel with other suspense boundaries
 * 3. Streamed to the client as it resolves
 * 4. Injected into the placeholder via client-side JavaScript
 */
export const streamingSuspenseDirective: CustomDirective = {
  name: 'suspense',
  hasEndTag: true,
  handler: (content: string, params: string[], _context: Record<string, any>, _filePath: string): string => {
    if (!params || params.length === 0) {
      throw new Error('Suspense directive requires a name parameter')
    }

    const suspenseName = params[0].replace(/['"`]/g, '')

    // Wrap content in suspense markers for streaming detection
    return `<!-- @suspense:${suspenseName} -->${content}<!-- @endsuspense:${suspenseName} -->`
  },
}

/**
 * Custom directive for creating islands (for partial hydration)
 */
export const islandDirective: CustomDirective = {
  name: 'island',
  hasEndTag: true,
  handler: (content: string, params: string[], _context: Record<string, any>, _filePath: string): string => {
    if (!params || params.length === 0) {
      throw new Error('Island directive requires a name parameter')
    }

    const islandName = params[0].replace(/['"`]/g, '') // Remove quotes
    const priority = params[1] ? params[1].replace(/['"`]/g, '') : 'lazy'
    const id = `island-${islandName}-${Math.random().toString(36).substring(2, 9)}`

    // Extract props from content (if any)
    const propsMatch = content.match(/<script\s+props\s*>([\s\S]*?)<\/script>/i)
    const propsScript = propsMatch ? propsMatch[1].trim() : ''

    // Remove props script from content if found
    const contentWithoutProps = propsMatch
      ? content.replace(propsMatch[0], '')
      : content

    // Create hydration wrapper
    return `<div data-island="${islandName}" data-island-id="${id}" data-priority="${priority}">
      ${contentWithoutProps}
      <script type="application/json" data-island-props="${id}">
        ${propsScript ? `{${propsScript}}` : '{}'}
      </script>
    </div>`
  },
}

/**
 * Register streaming and hydration directives
 */
export function registerStreamingDirectives(options: StxOptions = {}): CustomDirective[] {
  const directives: CustomDirective[] = []

  // Add streaming directive if enabled
  if (options.streaming?.enabled) {
    directives.push(streamingSuspenseDirective)
  }

  // Add hydration directives if enabled
  if (options.hydration?.enabled) {
    directives.push(islandDirective)
  }

  return directives
}

/**
 * Process section directives
 * @param content Template content
 * @param context Data context
 * @param filePath Template file path
 * @param _options stx options
 */
// eslint-disable-next-line pickier/no-unused-vars
export async function processSectionDirectives(
  content: string,
  context: Record<string, any>,
  filePath: string,
  _options: StxOptions = {},
): Promise<string> {
  // Just extract sections for now, actual processing is done by the stream renderer
  return content
}

/**
 * Wrap a ReadableStream<string> in a proper Response with chunked transfer encoding headers.
 *
 * Makes it trivial to use streaming from a Bun server handler:
 *
 * @example
 * ```typescript
 * const server = Bun.serve({
 *   async fetch(req) {
 *     const stream = await streamTemplate('index.stx', { title: 'Home' })
 *     return streamToResponse(stream)
 *   }
 * })
 * ```
 *
 * @param stream - The template ReadableStream
 * @param init - Optional additional ResponseInit (headers, status, etc.)
 * @returns A Response with proper streaming headers
 */
export function streamToResponse(
  stream: ReadableStream<string>,
  init: ResponseInit = {},
): Response {
  // Convert string stream to Uint8Array stream for Response
  const encoder = new TextEncoder()
  const byteStream = stream.pipeThrough(new TransformStream<string, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(encoder.encode(chunk))
    },
  }))

  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'text/html; charset=utf-8')
  }
  if (!headers.has('Transfer-Encoding')) {
    headers.set('Transfer-Encoding', 'chunked')
  }
  // Disable buffering for true streaming
  if (!headers.has('X-Content-Type-Options')) {
    headers.set('X-Content-Type-Options', 'nosniff')
  }
  // Tell reverse proxies NOT to buffer this response — nginx (and others) buffer
  // proxied responses by default, which would hold the shell back until the
  // whole stream completes, defeating streaming SSR. `X-Accel-Buffering: no`
  // opts this response out (nginx honors it; harmless elsewhere).
  if (!headers.has('X-Accel-Buffering')) {
    headers.set('X-Accel-Buffering', 'no')
  }

  return new Response(byteStream, {
    ...init,
    headers,
  })
}

// =============================================================================
// Client-Side Hydration Runtime
// =============================================================================

/**
 * Configuration for hydration runtime generation
 */
export interface HydrationRuntimeConfig {
  /** Include full runtime or just the loader */
  mode: 'full' | 'loader'
  /** Component registry mapping island names to component paths */
  components?: Record<string, string>
  /** Whether to use dynamic imports */
  dynamicImports?: boolean
}

/**
 * Generate client-side hydration runtime script.
 *
 * This script handles:
 * - Finding islands in the DOM
 * - Loading island components based on priority
 * - Hydrating islands with their props
 *
 * Usage: Include the generated script in your page, then call
 * `window.__stx.hydrate()` when ready.
 *
 * @example
 * ```html
 * <script>
 *   {{ generateHydrationRuntime({ mode: 'full' }) }}
 * </script>
 * ```
 */
export function generateHydrationRuntime(config: HydrationRuntimeConfig = { mode: 'full' }): string {
  const { mode, components = {}, dynamicImports = true } = config

  // Component registry initialization
  const componentRegistry = Object.entries(components)
    .map(([name, path]) => `'${name}': ${dynamicImports ? `() => import('${path}')` : `require('${path}')`}`)
    .join(',\n      ')

  if (mode === 'loader') {
    // Minimal loader - expects components to be registered separately
    return `
(function() {
  window.__stx = window.__stx || {};
  window.__stx.islands = new Map();
  window.__stx.registerComponent = function(name, component) {
    window.__stx.islands.set(name, component);
  };
})();`
  }

  // Full hydration runtime
  return `
(function() {
  'use strict';

  // Hydration runtime for stx islands
  const stx = {
    // Component registry
    components: {
      ${componentRegistry}
    },

    // Loaded island instances
    islands: new Map(),

    // Register a component for hydration
    registerComponent: function(name, loader) {
      this.components[name] = loader;
    },

    // Get props for an island by ID
    getIslandProps: function(id) {
      const propsScript = document.querySelector('[data-island-props="' + id + '"]');
      if (!propsScript) return {};
      try {
        return JSON.parse(propsScript.textContent || '{}');
      }
catch (e) {
        console.warn('[stx] Failed to parse island props:', id, e);
        return {};
      }
    },

    // Hydrate a single island
    hydrateIsland: async function(element) {
      const name = element.dataset.island;
      const id = element.dataset.islandId;

      if (!name || this.islands.has(id)) return;

      const loader = this.components[name];
      if (!loader) {
        console.warn('[stx] Unknown island component:', name);
        return;
      }

      try {
        const component = typeof loader === 'function' ? await loader() : loader;
        const props = this.getIslandProps(id);

        // Mark as hydrating
        element.dataset.hydrating = 'true';

        // Call component's hydrate method if available
        if (component.hydrate) {
          await component.hydrate(element, props);
        }
else if (component.default && component.default.hydrate) {
          await component.default.hydrate(element, props);
        }

        // Mark as hydrated
        delete element.dataset.hydrating;
        element.dataset.hydrated = 'true';
        this.islands.set(id, { element, component, props });

      }
catch (error) {
        console.error('[stx] Failed to hydrate island:', name, error);
        element.dataset.hydrateError = 'true';
      }
    },

    // Hydrate all islands based on priority
    hydrate: function() {
      const islands = document.querySelectorAll('[data-island]');

      // Group by priority
      const eager = [];
      const lazy = [];
      const idle = [];

      islands.forEach(function(el) {
        const priority = el.dataset.priority || 'lazy';
        if (priority === 'eager') eager.push(el);
        else if (priority === 'idle') idle.push(el);
        else lazy.push(el);
      });

      // Hydrate eager immediately
      eager.forEach(function(el) { stx.hydrateIsland(el); });

      // Hydrate lazy on intersection
      if (lazy.length > 0 && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              observer.unobserve(entry.target);
              stx.hydrateIsland(entry.target);
            }
          });
        }, { rootMargin: '50px' });

        lazy.forEach(function(el) { observer.observe(el); });
      }
else {
        // Fallback: hydrate all lazy immediately
        lazy.forEach(function(el) { stx.hydrateIsland(el); });
      }

      // Hydrate idle during browser idle time
      if (idle.length > 0 && 'requestIdleCallback' in window) {
        requestIdleCallback(function() {
          idle.forEach(function(el) { stx.hydrateIsland(el); });
        });
      }
else {
        // Fallback: hydrate after a delay
        setTimeout(function() {
          idle.forEach(function(el) { stx.hydrateIsland(el); });
        }, 200);
      }
    }
  };

  // Expose to window
  window.__stx = stx;

  // Auto-hydrate on DOMContentLoaded if not SSR
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { stx.hydrate(); });
  }
else {
    stx.hydrate();
  }
})();`
}
