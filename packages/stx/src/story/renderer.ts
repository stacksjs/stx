/**
 * STX Story - Component Renderer
 * Real component rendering using the STX process module
 */

import type { ServerStoryFile, StoryContext } from './types'
import fs from 'node:fs'

/**
 * Render options
 */
export interface RenderOptions {
  /** Props to pass to the component */
  props?: Record<string, any>
  /** Slots content */
  slots?: Record<string, string>
  /** Include global styles */
  includeStyles?: boolean
  /** Include Headwind CSS */
  includeHeadwind?: boolean
}

/**
 * Render result
 */
export interface RenderResult {
  /** Rendered HTML */
  html: string
  /** CSS extracted from component */
  css: string
  /** JavaScript extracted from component */
  js: string
  /** Errors during rendering */
  errors: string[]
  /** Render duration in ms */
  duration: number
}

/**
 * Component cache for faster re-renders
 */
const componentCache = new Map<string, {
  content: string
  mtime: number
  analyzed: any
}>()

/**
 * Render a component with props
 */
export async function renderComponent(
  ctx: StoryContext,
  componentPath: string,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const startTime = performance.now()
  const errors: string[] = []

  try {
    // Check cache
    const stat = await fs.promises.stat(componentPath)
    const cached = componentCache.get(componentPath)

    let content: string
    if (cached && cached.mtime === stat.mtimeMs) {
      content = cached.content
    }
    else {
      content = await fs.promises.readFile(componentPath, 'utf-8')
      componentCache.set(componentPath, {
        content,
        mtime: stat.mtimeMs,
        analyzed: null,
      })
    }

    // Process the component using STX
    const { processDirectives } = await import('../process')

    // Build props context
    const propsContext = options.props || {}

    // Process the template
    const dependencies = new Set<string>()
    let html = await processDirectives(content, propsContext, componentPath, {}, dependencies)

    // Extract CSS
    const css = extractStyles(content)

    // Extract JS
    const js = extractScripts(content)

    // Inject props into rendered output
    html = injectPropsIntoHtml(html, propsContext)

    return {
      html,
      css,
      js,
      errors,
      duration: performance.now() - startTime,
    }
  }
  catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
    return {
      html: `<div class="stx-render-error">${escapeHtml(errors[0])}</div>`,
      css: '',
      js: '',
      errors,
      duration: performance.now() - startTime,
    }
  }
}

/**
 * Render a story variant
 */
export async function renderStoryVariant(
  ctx: StoryContext,
  story: ServerStoryFile,
  variantId: string,
  props?: Record<string, any>,
): Promise<RenderResult> {
  const variant = story.story?.variants.find(v => v.id === variantId)
  if (!variant) {
    return {
      html: '<div class="stx-render-error">Variant not found</div>',
      css: '',
      js: '',
      errors: ['Variant not found'],
      duration: 0,
    }
  }

  // Merge variant state with provided props
  const mergedProps = { ...variant.state, ...props }

  // If variant has source, render it directly
  if (variant.source) {
    return renderInlineTemplate(ctx, variant.source, mergedProps)
  }

  // Otherwise render the component file
  return renderComponent(ctx, story.path, { props: mergedProps })
}

/**
 * Render an inline template string
 */
export async function renderInlineTemplate(
  ctx: StoryContext,
  template: string,
  props: Record<string, any> = {},
): Promise<RenderResult> {
  const startTime = performance.now()
  const errors: string[] = []

  try {
    const { processDirectives } = await import('../process')

    const dependencies = new Set<string>()
    let html = await processDirectives(template, props, 'inline-template.stx', {}, dependencies)

    html = injectPropsIntoHtml(html, props)

    return {
      html,
      css: extractStyles(template),
      js: extractScripts(template),
      errors,
      duration: performance.now() - startTime,
    }
  }
  catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
    return {
      html: `<div class="stx-render-error">${escapeHtml(errors[0])}</div>`,
      css: '',
      js: '',
      errors,
      duration: performance.now() - startTime,
    }
  }
}

/**
 * Extract <style> content from template
 */
function extractStyles(content: string): string {
  const styles: string[] = []
  const styleRegex = /<style\b[^>]*>([\s\S]*?)<\/style>/gi

  let match = styleRegex.exec(content)
  while (match !== null) {
    styles.push(match[1].trim())
    match = styleRegex.exec(content)
  }

  return styles.join('\n')
}

/**
 * Extract <script> content from template
 */
function extractScripts(content: string): string {
  const scripts: string[] = []
  const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi

  let match = scriptRegex.exec(content)
  while (match !== null) {
    scripts.push(match[1].trim())
    match = scriptRegex.exec(content)
  }

  return scripts.join('\n')
}

/**
 * Inject props into HTML for client-side access
 */
function injectPropsIntoHtml(html: string, props: Record<string, any>): string {
  const propsScript = `<script>window.__stxProps = ${JSON.stringify(props)};</script>`
  return html + propsScript
}

/**
 * Escape HTML entities
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Clear the component cache
 */
export function clearComponentCache(): void {
  componentCache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number, entries: string[] } {
  return {
    size: componentCache.size,
    entries: Array.from(componentCache.keys()),
  }
}

/**
 * Preload components into cache
 */
export async function preloadComponents(paths: string[]): Promise<number> {
  let loaded = 0

  for (const componentPath of paths) {
    try {
      const stat = await fs.promises.stat(componentPath)
      const content = await fs.promises.readFile(componentPath, 'utf-8')

      componentCache.set(componentPath, {
        content,
        mtime: stat.mtimeMs,
        analyzed: null,
      })

      loaded++
    }
    catch {
      // Skip files that can't be read
    }
  }

  return loaded
}

/**
 * Generate preview HTML document
 */
export function generatePreviewDocument(
  result: RenderResult,
  options: {
    title?: string
    theme?: 'light' | 'dark'
    background?: string
    headwindCss?: string
  } = {},
): string {
  const { title = 'Preview', theme = 'light', background = '#ffffff', headwindCss = '' } = options

  return `<!DOCTYPE html>
<html lang="en" class="${theme === 'dark' ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: ${background};
    }
    .stx-render-error {
      padding: 16px;
      background: #fee2e2;
      border: 1px solid #ef4444;
      border-radius: 4px;
      color: #dc2626;
      font-family: monospace;
      white-space: pre-wrap;
    }
    ${headwindCss}
    ${result.css}
  </style>
</head>
<body>
  ${result.html}
  <script>
    ${result.js}
  </script>
</body>
</html>`
}
