// @ts-nocheck - Skip type checking due to generic directive type constraints
/**
 * STX Directive API
 *
 * Enhanced API for creating custom directives with lifecycle hooks,
 * client-side support, and built-in utilities.
 *
 * @module directive-api
 *
 * @example
 * ```typescript
 * import { defineDirective } from 'stx'
 *
 * // Simple directive
 * const uppercase = defineDirective({
 *   name: 'uppercase',
 *   transform: (content) => content.toUpperCase()
 * })
 *
 * // Directive with parameters
 * const highlight = defineDirective({
 *   name: 'highlight',
 *   transform: (content, { color = 'yellow' }) =>
 *     `<mark style="background: ${color}">${content}</mark>`
 * })
 * ```
 */

import type { CustomDirective } from './types'

// =============================================================================
// Types
// =============================================================================

/** Directive parameter types */
export type DirectiveParams = Record<string, unknown>

/** Directive binding for client-side directives */
export interface DirectiveBinding<T = unknown> {
  /** The value passed to the directive */
  value: T
  /** Previous value (for updates) */
  oldValue?: T
  /** Argument passed after colon (v-directive:arg) */
  arg?: string
  /** Modifiers passed after dots (v-directive.mod1.mod2) */
  modifiers: Record<string, boolean>
  /** The directive instance */
  instance: unknown
  /** The directive definition */
  dir: ClientDirectiveDefinition<T>
}

/** Server-side directive definition */
export interface DirectiveDefinition<P extends DirectiveParams = DirectiveParams> {
  /** Directive name (without @) */
  name: string
  /** Whether directive has end tag (@name...@endname) */
  hasEndTag?: boolean
  /** Description for documentation */
  description?: string
  /** Transform content (server-side) */
  transform?: (
    content: string,
    params: P,
    context: Record<string, unknown>,
    filePath: string,
  ) => string | Promise<string>
  /** Validate parameters */
  validate?: (params: P) => boolean | string
  /** Default parameter values */
  defaults?: Partial<P>
  /** Generate client-side code */
  clientScript?: (params: P) => string
  /** Generate CSS */
  css?: (params: P) => string
}

/** Client-side directive hooks */
export interface ClientDirectiveDefinition<T = unknown> {
  /** Called when directive is first bound to element */
  created?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
  /** Called before element is inserted into DOM */
  beforeMount?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
  /** Called when element is inserted into DOM */
  mounted?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
  /** Called before the component is updated */
  beforeUpdate?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
  /** Called after the component has updated */
  updated?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
  /** Called before element is unmounted */
  beforeUnmount?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
  /** Called when element is unmounted */
  unmounted?: (el: HTMLElement, binding: DirectiveBinding<T>) => void
}

/** Combined directive (server + client) */
export interface FullDirectiveDefinition<
  P extends DirectiveParams = DirectiveParams,
  T = unknown,
> extends DirectiveDefinition<P> {
  /** Client-side hooks */
  client?: ClientDirectiveDefinition<T>
}

// =============================================================================
// Directive Registry
// =============================================================================

/** Global directive registry */
const directiveRegistry = new Map<string, FullDirectiveDefinition>()

/** Client directive registry */
const clientDirectiveRegistry = new Map<string, ClientDirectiveDefinition>()

/**
 * Register a directive globally.
 */
export function registerDirective<P extends DirectiveParams = DirectiveParams>(
  definition: FullDirectiveDefinition<P>,
): void {
  directiveRegistry.set(definition.name, definition as FullDirectiveDefinition)

  if (definition.client) {
    clientDirectiveRegistry.set(definition.name, definition.client)
  }
}

/**
 * Get a registered directive.
 */
export function getDirective(name: string): FullDirectiveDefinition | undefined {
  return directiveRegistry.get(name)
}

/**
 * Get all registered directives.
 */
export function getDirectives(): FullDirectiveDefinition[] {
  return Array.from(directiveRegistry.values())
}

/**
 * Unregister a directive.
 */
export function unregisterDirective(name: string): boolean {
  clientDirectiveRegistry.delete(name)
  return directiveRegistry.delete(name)
}

// =============================================================================
// Define Directive
// =============================================================================

/**
 * Define a custom directive.
 *
 * @example
 * ```typescript
 * // Simple transform directive
 * const uppercase = defineDirective({
 *   name: 'uppercase',
 *   transform: (content) => content.toUpperCase()
 * })
 *
 * // Directive with parameters and validation
 * const truncate = defineDirective({
 *   name: 'truncate',
 *   defaults: { length: 100, suffix: '...' },
 *   validate: ({ length }) => length > 0 || 'Length must be positive',
 *   transform: (content, { length, suffix }) =>
 *     content.length > length
 *       ? content.slice(0, length) + suffix
 *       : content
 * })
 *
 * // Client-side directive
 * const tooltip = defineDirective({
 *   name: 'tooltip',
 *   transform: (content, { text }) =>
 *     `<span data-tooltip="${text}">${content}</span>`,
 *   client: {
 *     mounted(el, { value }) {
 *       el.title = value
 *     }
 *   }
 * })
 * ```
 */
export function defineDirective<
  P extends DirectiveParams = DirectiveParams,
  T = unknown,
>(definition: FullDirectiveDefinition<P, T>): CustomDirective {
  // Store in registry
  registerDirective(definition)

  // Convert to CustomDirective format for the existing system
  const customDirective: CustomDirective = {
    name: definition.name,
    hasEndTag: definition.hasEndTag ?? true,
    description: definition.description,
    handler: async (content, params, context, filePath) => {
      // Parse params into object
      const parsedParams = parseParams<P>(params, definition.defaults)

      // Validate if validator provided
      if (definition.validate) {
        const validationResult = definition.validate(parsedParams)
        if (validationResult !== true) {
          const message = typeof validationResult === 'string'
            ? validationResult
            : `Invalid parameters for @${definition.name}`
          throw new Error(message)
        }
      }

      // Transform content
      let result = content
      if (definition.transform) {
        result = await definition.transform(content, parsedParams, context, filePath)
      }

      // Add client script if provided
      if (definition.clientScript) {
        const script = definition.clientScript(parsedParams)
        result += `<script>${script}</script>`
      }

      // Add CSS if provided
      if (definition.css) {
        const css = definition.css(parsedParams)
        result += `<style>${css}</style>`
      }

      return result
    },
  }

  return customDirective
}

/**
 * Define a client-only directive.
 */
export function defineClientDirective<T = unknown>(
  name: string,
  definition: ClientDirectiveDefinition<T> | ((el: HTMLElement, binding: DirectiveBinding<T>) => void),
): ClientDirectiveDefinition<T> {
  const normalized: ClientDirectiveDefinition<T> = typeof definition === 'function'
    ? { mounted: definition }
    : definition

  clientDirectiveRegistry.set(name, normalized as ClientDirectiveDefinition)
  return normalized
}

// =============================================================================
// Parameter Parsing
// =============================================================================

/**
 * Parse directive parameters from array to object.
 */
function parseParams<P extends DirectiveParams>(
  params: string[],
  defaults?: Partial<P>,
): P {
  const result: DirectiveParams = { ...defaults }

  for (const param of params) {
    // Handle key=value or key: value format
    const colonIndex = param.indexOf(':')
    const equalsIndex = param.indexOf('=')
    const separatorIndex = colonIndex >= 0 && (equalsIndex < 0 || colonIndex < equalsIndex)
      ? colonIndex
      : equalsIndex

    if (separatorIndex >= 0) {
      const key = param.slice(0, separatorIndex).trim()
      let value: unknown = param.slice(separatorIndex + 1).trim()

      // Parse value types
      if (value === 'true') value = true
      else if (value === 'false') value = false
      else if (value === 'null') value = null
      else if (!Number.isNaN(Number(value))) value = Number(value)
      else if (typeof value === 'string' && value.startsWith('{')) {
        try {
          value = JSON.parse(value)
        } catch {
          // Keep as string
        }
      }

      result[key] = value
    } else {
      // Positional parameter - use index as key or 'value' for first
      const index = Object.keys(result).filter(k => !defaults || !(k in defaults)).length
      result[index === 0 ? 'value' : `arg${index}`] = param
    }
  }

  return result as P
}

// =============================================================================
// Built-in Directives
// =============================================================================

/**
 * Create common built-in directives.
 */
export function createBuiltinDirectives(): CustomDirective[] {
  return [
    // @uppercase - Convert content to uppercase
    defineDirective({
      name: 'uppercase',
      description: 'Convert content to uppercase',
      transform: (content) => content.toUpperCase(),
    }),

    // @lowercase - Convert content to lowercase
    defineDirective({
      name: 'lowercase',
      description: 'Convert content to lowercase',
      transform: (content) => content.toLowerCase(),
    }),

    // @capitalize - Capitalize first letter
    defineDirective({
      name: 'capitalize',
      description: 'Capitalize first letter of content',
      transform: (content) =>
        content.charAt(0).toUpperCase() + content.slice(1),
    }),

    // @trim - Remove whitespace
    defineDirective({
      name: 'trim',
      description: 'Remove leading and trailing whitespace',
      transform: (content) => content.trim(),
    }),

    // @truncate(length, suffix) - Truncate text
    defineDirective<{ length: number; suffix: string }>({
      name: 'truncate',
      description: 'Truncate content to specified length',
      defaults: { length: 100, suffix: '...' },
      transform: (content, { length, suffix }) =>
        content.length > length
          ? content.slice(0, length) + suffix
          : content,
    }),

    // @highlight(color) - Highlight text
    defineDirective<{ color: string }>({
      name: 'highlight',
      description: 'Highlight content with background color',
      defaults: { color: 'yellow' },
      transform: (content, { color }) =>
        `<mark style="background-color: ${color}; padding: 0.1em 0.2em; border-radius: 0.2em;">${content}</mark>`,
    }),

    // @badge(variant) - Create a badge
    defineDirective<{ variant: string; color: string }>({
      name: 'badge',
      description: 'Create a badge/tag',
      defaults: { variant: 'default', color: '' },
      transform: (content, { variant, color }) => {
        const colors: Record<string, string> = {
          default: 'background: #e5e7eb; color: #374151;',
          primary: 'background: #3b82f6; color: white;',
          success: 'background: #10b981; color: white;',
          warning: 'background: #f59e0b; color: white;',
          danger: 'background: #ef4444; color: white;',
          info: 'background: #06b6d4; color: white;',
        }
        const style = color
          ? `background: ${color}; color: white;`
          : colors[variant] || colors.default

        return `<span style="${style} padding: 0.25em 0.5em; border-radius: 9999px; font-size: 0.875em; font-weight: 500;">${content}</span>`
      },
    }),

    // @code - Inline code styling
    defineDirective({
      name: 'code',
      description: 'Style content as inline code',
      transform: (content) =>
        `<code style="background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.25em; font-family: ui-monospace, monospace; font-size: 0.875em;">${content}</code>`,
    }),

    // @tooltip(text) - Add tooltip
    defineDirective<{ text: string; position: string }>({
      name: 'tooltip',
      description: 'Add a tooltip to content',
      defaults: { text: '', position: 'top' },
      hasEndTag: true,
      transform: (content, { text, position }) =>
        `<span class="stx-tooltip" data-tooltip="${text}" data-tooltip-position="${position}" style="position: relative; cursor: help;">${content}</span>`,
      css: () => `
        .stx-tooltip::after {
          content: attr(data-tooltip);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          padding: 0.5em 0.75em;
          background: #1f2937;
          color: white;
          font-size: 0.75rem;
          border-radius: 0.25rem;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
          z-index: 1000;
          margin-bottom: 0.25rem;
        }
        .stx-tooltip:hover::after {
          opacity: 1;
          visibility: visible;
        }
      `,
    }),

    // @clipboard - Copy to clipboard button
    defineDirective<{ label: string }>({
      name: 'clipboard',
      description: 'Add copy to clipboard functionality',
      defaults: { label: 'Copy' },
      transform: (content, { label }) => {
        const id = `clipboard-${Date.now()}-${Math.random().toString(36).slice(2)}`
        return `
          <span class="stx-clipboard" data-clipboard-id="${id}">
            <span class="stx-clipboard-content">${content}</span>
            <button type="button" class="stx-clipboard-btn" onclick="navigator.clipboard.writeText(document.querySelector('[data-clipboard-id=\\'${id}\\'] .stx-clipboard-content').textContent).then(() => { this.textContent = 'Copied!'; setTimeout(() => this.textContent = '${label}', 2000); })">${label}</button>
          </span>
        `
      },
      css: () => `
        .stx-clipboard {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
        }
        .stx-clipboard-btn {
          padding: 0.25em 0.5em;
          font-size: 0.75em;
          background: #e5e7eb;
          border: none;
          border-radius: 0.25em;
          cursor: pointer;
        }
        .stx-clipboard-btn:hover {
          background: #d1d5db;
        }
      `,
    }),

    // @time - Format as relative time
    defineDirective<{ date: string }>({
      name: 'time',
      description: 'Display relative time',
      defaults: { date: '' },
      hasEndTag: false,
      transform: (_content, { date }) => {
        const timestamp = date ? new Date(date).getTime() : Date.now()
        return `<time datetime="${new Date(timestamp).toISOString()}" data-stx-relative-time="${timestamp}"></time>`
      },
      clientScript: () => `
        document.querySelectorAll('[data-stx-relative-time]').forEach(el => {
          const timestamp = parseInt(el.dataset.stxRelativeTime);
          const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
          const diff = timestamp - Date.now();
          const seconds = Math.floor(diff / 1000);
          const minutes = Math.floor(seconds / 60);
          const hours = Math.floor(minutes / 60);
          const days = Math.floor(hours / 24);

          if (Math.abs(days) > 0) el.textContent = rtf.format(days, 'day');
          else if (Math.abs(hours) > 0) el.textContent = rtf.format(hours, 'hour');
          else if (Math.abs(minutes) > 0) el.textContent = rtf.format(minutes, 'minute');
          else el.textContent = rtf.format(seconds, 'second');
        });
      `,
    }),

    // @currency(amount, currency) - Format as currency
    defineDirective<{ amount: number; currency: string; locale: string }>({
      name: 'currency',
      description: 'Format number as currency',
      defaults: { amount: 0, currency: 'USD', locale: 'en-US' },
      hasEndTag: false,
      transform: (_content, { amount, currency, locale }) => {
        const formatted = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
        }).format(amount)
        return formatted
      },
    }),

    // @number(value, decimals) - Format number
    defineDirective<{ value: number; decimals: number; locale: string }>({
      name: 'number',
      description: 'Format number with locale',
      defaults: { value: 0, decimals: 2, locale: 'en-US' },
      hasEndTag: false,
      transform: (_content, { value, decimals, locale }) => {
        return new Intl.NumberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value)
      },
    }),

    // @pluralize(count, singular, plural) - Pluralization
    defineDirective<{ count: number; singular: string; plural: string }>({
      name: 'pluralize',
      description: 'Pluralize text based on count',
      defaults: { count: 0, singular: '', plural: '' },
      hasEndTag: false,
      transform: (_content, { count, singular, plural }) => {
        const word = count === 1 ? singular : (plural || singular + 's')
        return `${count} ${word}`
      },
    }),
  ]
}

// =============================================================================
// Client-Side Runtime
// =============================================================================

/**
 * Generate client-side directive runtime.
 */
export function generateDirectiveRuntime(): string {
  return `
// STX Directive Runtime
(function() {
  if (typeof window === 'undefined') return;

  window.STX = window.STX || {};
  window.STX.directives = window.STX.directives || {};

  // Register a client-side directive
  window.STX.directive = function(name, definition) {
    if (typeof definition === 'function') {
      definition = { mounted: definition };
    }
    window.STX.directives[name] = definition;
  };

  // Apply directive to element
  window.STX.applyDirective = function(el, name, value, arg, modifiers) {
    const directive = window.STX.directives[name];
    if (!directive) {
      console.warn('[stx] Unknown directive:', name);
      return;
    }

    const binding = {
      value: value,
      arg: arg,
      modifiers: modifiers || {},
      dir: directive
    };

    // Store binding on element for updates
    el.__stx_directives__ = el.__stx_directives__ || {};
    el.__stx_directives__[name] = binding;

    // Call lifecycle hooks
    if (directive.created) directive.created(el, binding);
    if (directive.beforeMount) directive.beforeMount(el, binding);

    // Defer mounted until DOM is ready
    requestAnimationFrame(function() {
      if (directive.mounted) directive.mounted(el, binding);
    });
  };

  // Update directive on element
  window.STX.updateDirective = function(el, name, newValue) {
    const binding = el.__stx_directives__ && el.__stx_directives__[name];
    if (!binding) return;

    const directive = binding.dir;
    const oldValue = binding.value;
    binding.oldValue = oldValue;
    binding.value = newValue;

    if (directive.beforeUpdate) directive.beforeUpdate(el, binding);
    if (directive.updated) directive.updated(el, binding);
  };

  // Remove directive from element
  window.STX.removeDirective = function(el, name) {
    const binding = el.__stx_directives__ && el.__stx_directives__[name];
    if (!binding) return;

    const directive = binding.dir;
    if (directive.beforeUnmount) directive.beforeUnmount(el, binding);
    if (directive.unmounted) directive.unmounted(el, binding);

    delete el.__stx_directives__[name];
  };

  // Auto-apply directives on page load
  document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('[data-stx-directive]').forEach(function(el) {
      const directives = el.dataset.stxDirective.split(';');
      directives.forEach(function(d) {
        const [name, value] = d.split(':').map(s => s.trim());
        window.STX.applyDirective(el, name, value);
      });
    });
  });

  console.log('[stx] Directive runtime initialized');
})();
`
}

// =============================================================================
// Directive Attribute Processing
// =============================================================================

/**
 * Process v-directive attributes in templates.
 * Converts v-directive:arg.mod="value" to data attributes and client setup.
 */
export function processDirectiveAttributes(template: string): string {
  // Match v-directivename:arg.mod1.mod2="value"
  const directiveRegex = /v-(\w+)(?::(\w+))?(?:\.([\w.]+))?="([^"]*)"/g

  return template.replace(directiveRegex, (match, name, arg, modifiers, value) => {
    const mods = modifiers ? modifiers.split('.') : []
    const modObj = mods.reduce((acc: Record<string, boolean>, m: string) => {
      acc[m] = true
      return acc
    }, {})

    return `data-stx-directive="${name}:${value}" data-stx-directive-arg="${arg || ''}" data-stx-directive-modifiers='${JSON.stringify(modObj)}'`
  })
}
