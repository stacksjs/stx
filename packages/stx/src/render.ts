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

import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defaultConfig } from './config'
import { extractVariables } from './variable-extractor'
import { processDirectives } from './process'
import { processClientScript } from './client-script'
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
  // SFC Support: Extract <template> content if present
  let workingContent = content
  const templateTagMatch = content.match(/<template\b[^>]*>([\s\S]*?)<\/template>/i)
  if (templateTagMatch) {
    workingContent = templateTagMatch[1].trim()
  }

  // Extract all script tags and categorize them
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  const clientScripts: string[] = []
  const serverScripts: string[] = []
  const signalsScripts: string[] = []

  const usesSignalsAPI = (scriptContent: string) => /\b(?:state|derived|effect|batch)\s*\(/.test(scriptContent)

  let scriptMatch: RegExpExecArray | null
  while ((scriptMatch = scriptRegex.exec(content)) !== null) {
    const attrs = scriptMatch[1]
    const scriptContent = scriptMatch[2]
    const fullScript = scriptMatch[0]

    const isClientScript = attrs.includes('client') || attrs.includes('type="module"') || attrs.includes('src=')
    const isSignalsScript = usesSignalsAPI(scriptContent)

    if (isSignalsScript) {
      signalsScripts.push(fullScript)
    }
    else if (isClientScript) {
      clientScripts.push(fullScript)
    }
    else {
      serverScripts.push(scriptContent)
    }
  }

  // Remove all script tags from template content
  // Server scripts: match the inner content (serverScripts only has the content, not the tags)
  // Client scripts: match the full tag (clientScripts has the full <script>...</script>)
  let templateContent = workingContent

  // Remove server script tags by matching them with a fresh regex pass
  templateContent = templateContent.replace(/<script\b(?![^>]*\b(?:client|type\s*=\s*["']module["']|src\s*=))[^>]*>[\s\S]*?<\/script>/gi, '')

  // Remove client script tags by plain string matching
  for (const script of clientScripts) {
    templateContent = templateContent.replace(script, '')
  }

  return { templateContent, serverScripts, clientScripts, signalsScripts }
}

function wrapInHtmlDocument(html: string, title?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'stx'}</title>
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

  if (!existsSync(resolvedPath)) {
    throw new Error(`Template file not found: ${resolvedPath}`)
  }

  const content = readFileSync(resolvedPath, 'utf-8')
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
): Promise<string> {
  return renderTemplateString(template, process.cwd(), { context })
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
    ...(renderOptions.context || {}),
  }

  // Execute server scripts to extract variables
  for (const scriptContent of serverScripts) {
    await extractVariables(scriptContent, context, filePath)
  }

  // Merge any additional context
  if (renderOptions.context) {
    Object.assign(context, renderOptions.context)
  }

  // Track dependencies
  const dependencies = new Set<string>()

  // Process directives
  let output = templateContent
  output = await processDirectives(output, context, filePath, options, dependencies)

  // Process client scripts
  if (renderOptions.processClientScripts !== false && clientScripts.length > 0) {
    const eventBindings = (context.__stx_event_bindings || []) as any[]
    const transformedScripts = clientScripts.map((fullScript: string) => {
      const contentMatch = fullScript.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)
      if (!contentMatch)
        return fullScript
      return processClientScript(contentMatch[1], { eventBindings })
    })
    const scriptsHtml = transformedScripts.join('\n')
    const bodyEndMatch = output.match(/(<\/body>)/i)
    if (bodyEndMatch) {
      output = output.replace(/(<\/body>)/i, `${scriptsHtml}\n$1`)
    }
    else {
      output += `\n${scriptsHtml}`
    }
  }

  // Optionally wrap in full HTML document
  if (renderOptions.wrapInDocument) {
    // Only wrap if not already a full document
    if (!output.trim().toLowerCase().startsWith('<!doctype') && !output.trim().toLowerCase().startsWith('<html')) {
      output = wrapInHtmlDocument(output, renderOptions.title)
    }
  }

  return output
}
