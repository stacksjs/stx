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

        // Extract script content
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        // Create context with data
        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        // Extract variables from script
        await extractVariables(scriptContent, context, templatePath)

        // Parse into streamable chunks
        const chunks = parseStreamableChunks(templateContent)
        const dependencies = new Set<string>()

        // Check if we have suspense boundaries for true streaming
        const hasSuspense = chunks.some(c => c.type === 'suspense')

        if (!hasSuspense) {
          // No suspense boundaries - fall back to chunked output
          const output = await processDirectives(templateContent, context, templatePath, fullOptions, dependencies)

          // Stream in chunks based on buffer size
          for (let i = 0; i < output.length; i += bufferSize) {
            const chunk = output.slice(i, i + bufferSize)
            controller.enqueue(chunk)

            // Yield to allow other async operations
            await new Promise(resolve => setTimeout(resolve, 0))
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
              try {
                const content = await promise
                // Send script to inject content into placeholder
                const escapedContent = content.replace(/`/g, '\\`').replace(/<\/script>/gi, '<\\/script>')
                controller.enqueue(`
<script>
window.__stxSuspense.resolve('${name}', \`${escapedContent}\`);
</script>`)
              }
              catch (error: any) {
                // Send error state for this suspense boundary
                controller.enqueue(`
<script>
window.__stxSuspense.resolve('${name}', '<div class="stx-error">Error loading content: ${escapeHtml(error.message)}</div>');
</script>`)
              }
            },
          )

          // Wait for all suspense boundaries to resolve
          await Promise.all(resolvePromises)
        }

        // Close the stream
        controller.close()
      }
      catch (error: any) {
        controller.error(error)
      }
    },
  })
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
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        const context: Record<string, any> = {
          ...data,
          __filename: templatePath,
          __dirname: path.dirname(templatePath),
        }

        await extractVariables(scriptContent, context, templatePath)

        const dependencies = new Set<string>()
        const output = await processDirectives(templateContent, context, templatePath, fullOptions, dependencies)

        // Stream output in chunks
        for (let i = 0; i < output.length; i += bufferSize) {
          controller.enqueue(output.slice(i, i + bufferSize))
        }

        controller.close()
      }
      catch (error: any) {
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

  // Extract script and template sections
  const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

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
      catch (error: any) {
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
export async function processSectionDirectives(
  content: string,
  context: Record<string, any>,
  filePath: string,
  _options: StxOptions = {},
): Promise<string> {
  // Just extract sections for now, actual processing is done by the stream renderer
  return content
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
      } catch (e) {
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
        } else if (component.default && component.default.hydrate) {
          await component.default.hydrate(element, props);
        }

        // Mark as hydrated
        delete element.dataset.hydrating;
        element.dataset.hydrated = 'true';
        this.islands.set(id, { element, component, props });

      } catch (error) {
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
      } else {
        // Fallback: hydrate all lazy immediately
        lazy.forEach(function(el) { stx.hydrateIsland(el); });
      }

      // Hydrate idle during browser idle time
      if (idle.length > 0 && 'requestIdleCallback' in window) {
        requestIdleCallback(function() {
          idle.forEach(function(el) { stx.hydrateIsland(el); });
        });
      } else {
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
  } else {
    stx.hydrate();
  }
})();`
}
