/**
 * Template Rendering API
 *
 * Renders .stx template files to HTML strings. This is the primary API
 * for rendering stx templates outside of the Bun plugin pipeline —
 * useful for native desktop apps, SSR, email templates, etc.
 *
 * @example
 * ```typescript
 * import { renderTemplate } from 'stx'
 *
 * // Render a template file
 * const html = await renderTemplate('./src/app.stx')
 *
 * // Render with additional context variables
 * const html = await renderTemplate('./src/app.stx', {
 *   title: 'My App',
 *   version: '1.0.0',
 * })
 *
 * // Render an inline template string
 * const html = await renderString('<h1>{{ title }}</h1>', {
 *   title: 'Hello World',
 * })
 * ```
 */

import { dirname, resolve } from 'node:path'
import { defaultConfig } from './config'
import { extractVariables } from './variable-extractor'
import { injectRouterScript, processDirectives } from './process'
import { extractBridgeData, processClientScript } from './client-script'
import type { StxOptions } from './types'

// ============================================================================
// Types
// ============================================================================

export interface RenderOptions {
  /** Additional context variables to inject */
  context?: Record<string, unknown>
  /** STX options override */
  options?: Partial<StxOptions>
  /** Whether to process client scripts. Default: true */
  processClientScripts?: boolean
  /** Whether to wrap output in a full HTML document. Default: false */
  wrapInDocument?: boolean
  /** Document title (used when wrapInDocument is true) */
  title?: string
  /** Whether to auto-inject Crosswind CSS from Tailwind classes. Default: false */
  injectCSS?: boolean
  /**
   * Layout template file path. When set, the page content is rendered first,
   * then injected as `content` into the layout template. All context variables
   * are forwarded to the layout.
   *
   * @example
   * ```ts
   * await renderTemplate('pages/index.stx', {
   *   context: { title: 'Home', packages: [...] },
   *   layout: 'pages/layout.stx',
   *   injectCSS: true,
   * })
   * ```
   */
  layout?: string
  /**
   * Template-only mode: only process directives and expressions.
   * Skips signals runtime, SPA router, and client script wrapping.
   * Ideal for non-SPA consumers like documentation engines.
   */
  templateOnly?: boolean
}

// ============================================================================
// Implementation
// ============================================================================

function parseTemplate(content: string): {
  templateContent: string
  serverScripts: string[]
  clientScripts: string[]
  signalsScripts: string[]
} {
  // SFC Support: Extract <template> content if present (balanced matching for nested <template>)
  // Preserve templates with x-for, x-if, @for, @if, :for, :if — those are client-side elements
  let workingContent = content
  const templateOpenMatch = content.match(/<template\b(?![^>]*\b(?:id|x-for|x-if|@for|@if|:for|:if)\s*=)[^>]*>/i)
  if (templateOpenMatch && templateOpenMatch.index !== undefined) {
    const openEnd = templateOpenMatch.index + templateOpenMatch[0].length
    let depth = 1
    let pos = openEnd
    while (depth > 0 && pos < content.length) {
      const nextOpen = content.indexOf('<template', pos)
      const nextClose = content.indexOf('</template>', pos)
      if (nextClose === -1) break
      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Check it's actually a tag (not text)
        const after = content[nextOpen + '<template'.length]
        if (after === '>' || after === ' ' || after === '\n' || after === '\t') {
          depth++
        }
        pos = nextOpen + '<template'.length
      }
else {
        depth--
        if (depth === 0) {
          workingContent = content.slice(openEnd, nextClose).trim()
          break
        }
        pos = nextClose + '</template>'.length
      }
    }
  }

  // Extract all script tags and categorize them
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  const clientScripts: string[] = []
  const serverScripts: string[] = []
  const signalsScripts: string[] = []

  const usesSignalsAPI = (scriptContent: string) => /\b(?:state|derived|effect|batch)\s*(?:<[^<>()]*>)?\s*\(/.test(scriptContent)

  let scriptMatch: RegExpExecArray | null
  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const attrs = scriptMatch[1]
    const scriptContent = scriptMatch[2]
    const fullScript = scriptMatch[0]

    const isServerScript = attrs.includes('server')
    const isSignalsScript = usesSignalsAPI(scriptContent)

    if (isSignalsScript) {
      signalsScripts.push(fullScript)
    }
    else if (isServerScript) {
      serverScripts.push(scriptContent)
    }
    else {
      // Bare <script> and <script client> are both client-side
      clientScripts.push(fullScript)
    }
  }

  // Remove server and client script tags from template content.
  // Signals scripts STAY in the template — processDirectives handles them.
  let templateContent = workingContent

  // Re-inject signals scripts if they were in the original content
  // (they were classified separately but need to stay in the template)
  // Skip removal for signals scripts by only removing non-signals, non-client scripts
  {
    const serverScriptOpenRe = /<script\b(?![^>]*\b(?:client|type\s*=\s*["']module["']|src\s*=))[^>]*>/gi
    let sMatch: RegExpExecArray | null
    const removeRanges: { start: number, end: number }[] = []
    while ((sMatch = serverScriptOpenRe.exec(templateContent)) !== null) {
      const tagEnd = sMatch.index + sMatch[0].length
      // Find matching </script> accounting for nesting (script tags can't truly nest,
      // but we need to skip </script> inside strings)
      let sDepth = 1
      let sPos = tagEnd
      while (sPos < templateContent.length && sDepth > 0) {
        const nextOpen = templateContent.indexOf('<script', sPos)
        const nextClose = templateContent.indexOf('</script>', sPos)
        if (nextClose === -1) break
        if (nextOpen !== -1 && nextOpen < nextClose) {
          // Check if this is inside a string literal by looking for surrounding quotes
          // For simplicity, just track script nesting depth
          sDepth++
          sPos = nextOpen + '<script'.length
        }
        else {
          sDepth--
          if (sDepth === 0) {
            removeRanges.push({ start: sMatch.index, end: nextClose + '</script>'.length })
            break
          }
          sPos = nextClose + '</script>'.length
        }
      }
    }
    // Remove ranges in reverse order to preserve indices
    for (let ri = removeRanges.length - 1; ri >= 0; ri--) {
      templateContent = templateContent.substring(0, removeRanges[ri].start)
        + templateContent.substring(removeRanges[ri].end)
    }
  }

  // Remove client script tags by plain string matching
  for (const script of clientScripts) {
    templateContent = templateContent.replace(script, '')
  }

  return { templateContent, serverScripts, clientScripts, signalsScripts }
}

function wrapInHtmlDocument(html: string, title?: string): string {
  // Escape title to prevent XSS via HTML injection in <title> tag
  const safeTitle = (title || 'stx').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body>
${html}
</body>
</html>`
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Render a .stx template file to an HTML string.
 *
 * This is the primary rendering API. It:
 * 1. Reads the template file
 * 2. Extracts and executes server-side scripts
 * 3. Processes all stx directives (conditionals, loops, expressions, etc.)
 * 4. Injects client-side scripts
 * 5. Returns the final HTML string
 *
 * @param filePath - Path to the .stx template file
 * @param renderOptions - Additional rendering options
 * @returns The rendered HTML string
 */
export async function renderTemplate(
  filePath: string,
  renderOptions: RenderOptions = {},
): Promise<string> {
  const resolvedPath = resolve(filePath)

  const file = Bun.file(resolvedPath)
  if (!await file.exists()) {
    throw new Error(`Template file not found: ${resolvedPath}`)
  }

  const content = await file.text()

  // If layout is specified, render page first, then wrap in layout
  if (renderOptions.layout) {
    const layoutPath = resolve(renderOptions.layout)
    const layoutFile = Bun.file(layoutPath)
    if (!await layoutFile.exists()) {
      throw new Error(`Layout template not found: ${layoutPath}`)
    }

    // Render page content (without layout, without CSS injection yet)
    const { layout, injectCSS, ...pageOptions } = renderOptions
    const pageHtml = await renderTemplateString(content, resolvedPath, { ...pageOptions, injectCSS: false })

    // Render layout with page content injected as `content`
    const layoutContent = await layoutFile.text()
    const layoutContext = {
      ...(renderOptions.context || {}),
      content: pageHtml,
    }
    const layoutOptions: RenderOptions = {
      ...pageOptions,
      context: layoutContext,
      injectCSS,
    }
    return renderTemplateString(layoutContent, layoutPath, layoutOptions)
  }

  return renderTemplateString(content, resolvedPath, renderOptions)
}

/**
 * Render an inline stx template string to HTML.
 *
 * Useful when you have template content in memory rather than a file.
 *
 * @param template - The stx template string
 * @param context - Variables to make available in the template
 * @returns The rendered HTML string
 */
export async function renderString(
  template: string,
  context: Record<string, unknown> = {},
  options?: { templateOnly?: boolean },
): Promise<string> {
  return renderTemplateString(template, process.cwd(), { context, ...options })
}

/**
 * Internal: render a template string with a given file path context.
 */
async function renderTemplateString(
  content: string,
  filePath: string,
  renderOptions: RenderOptions = {},
): Promise<string> {
  const { templateContent, serverScripts, clientScripts } = parseTemplate(content)

  // Build STX options
  const options: StxOptions = {
    ...defaultConfig,
    ...renderOptions.options,
  } as StxOptions

  // Build context
  const context: Record<string, any> = {
    __filename: filePath,
    __dirname: dirname(filePath),
    __stx: {},
    __stx_options: options,
    __stx_sfc_mode: true,
    // Propagate the renderOptions.injectCSS choice down to processDirectives
    // so its top-level auto-inject (process.ts) can be skipped on the inner
    // page render of a layout-wrapped template — otherwise injection happens
    // before the layout wraps the content, the early-return guard fires on
    // the outer layout render, and any utility classes that only appear in
    // the layout (sticky, z-50, w-60, backdrop-blur-xl, …) silently drop
    // out of the generated CSS.
    __stx_inject_css: renderOptions.injectCSS !== false,
    ...(renderOptions.context || {}),
  }

  // Execute server scripts to extract variables
  // Server scripts can reference context variables and add new ones.
  // They should NOT be overridden by the caller's context afterwards,
  // since server scripts may compute derived values from context.
  for (const scriptContent of serverScripts) {
    await extractVariables(scriptContent, context, filePath)
  }

  // Track dependencies
  const dependencies = new Set<string>()

  // Process directives
  let output = templateContent
  output = await processDirectives(output, context, filePath, options, dependencies)

  if (renderOptions.templateOnly) {
    // Template-only mode: strip injected runtimes (signals, router, SEO tags).
    // Keep only the processed template HTML + any raw client scripts.
    output = output.replace(/<script data-stx-scoped>[\s\S]*?<\/script>\s*/gi, '')
    output = output.replace(/<!-- stx SEO Tags -->[\s\S]*?(?=<)/i, '')
    if (clientScripts.length > 0) {
      output += `\n${clientScripts.join('\n')}`
    }
  }
  else {
    // Process client scripts
    if (renderOptions.processClientScripts !== false && clientScripts.length > 0) {
      const eventBindings = (context.__stx_event_bindings || []) as any[]
      // Seed <script client> with referenced <script server> data (the bridge).
      const serverData = extractBridgeData(context as Record<string, unknown>)
      const transformedScripts = await Promise.all(clientScripts.map(async (fullScript: string) => {
        const contentMatch = fullScript.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)
        if (!contentMatch)
          return fullScript
        return await processClientScript(contentMatch[1], { eventBindings, templateContent: output, serverData })
      }))
      const scriptsHtml = transformedScripts.join('\n')
      const bodyEndMatch = output.match(/(<\/body>)/i)
      if (bodyEndMatch) {
        output = output.replace(/(<\/body>)/i, `${scriptsHtml}\n$1`)
      }
      else {
        output += `\n${scriptsHtml}`
      }
    }

    // Inject SPA router script for client-side navigation
    output = await injectRouterScript(output)
  }

  // Optionally wrap in full HTML document
  if (renderOptions.wrapInDocument) {
    // Only wrap if not already a full document
    if (!output.trim().toLowerCase().startsWith('<!doctype') && !output.trim().toLowerCase().startsWith('<html')) {
      output = wrapInHtmlDocument(output, renderOptions.title)
    }
  }

  // Optionally inject Crosswind CSS from Tailwind utility classes
  if (renderOptions.injectCSS) {
    try {
      const { injectCrosswindCSS } = await import('./dev-server/crosswind')
      output = await injectCrosswindCSS(output)
    }
    catch {
      // Crosswind not available, skip CSS injection
    }
  }

  return output
}
