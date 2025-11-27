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
 * Stream a template with data
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

  // Create a ReadableStream
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

        // Process template with directives
        const dependencies = new Set<string>()
        const output = await processDirectives(templateContent, context, templatePath, fullOptions, dependencies)

        // Enqueue the processed template
        controller.enqueue(output)

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
