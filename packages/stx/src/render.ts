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
import { findSfcTemplateBlock } from './sfc-template'
import type { StxOptions } from './types'
import { isMarkdownPath, renderMarkdownView } from './markdown-view'
import { responseBindings, syncRecordedResponse } from './page-response'

// ============================================================================
// Types
// ============================================================================

export interface RenderOptions {
  /**
   * Markdown renderer for `.md` templates.
   *
   * Lets a docs site supply its own - bunpress, for instance - without stx
   * taking a dependency on one.
   */
  markdownRenderer?: (source: string) => string | Promise<string>

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
  // SFC Support: extract the explicit wrapper, preserving runtime templates.
  let workingContent = content
  const templateBlock = findSfcTemplateBlock(content)
  if (templateBlock)
    workingContent = templateBlock.content.trim()

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

      /*
       * A script element ends at its FIRST `</script>`. It does not nest.
       *
       * This used to depth-count `<script` occurrences, so a complete opening
       * tag inside a string literal — `const alpha = "VAL <script>x"` — counted
       * as a nested element and demanded a second closing tag. The range then
       * ran past the server block and swallowed the page's whole
       * `<script client>`: no setup function, no server-to-client bridge, and a
       * 200 response with an entirely inert page (stacksjs/stx#1904).
       *
       * Nesting is not a thing an HTML parser does here either. Once it is in
       * script-data state only an end tag leaves it, which is exactly why the
       * emitters in this codebase escape `<` as `\u003c` when they write a
       * value into a script body — a literal `</script>` in a string really
       * would close the element in a browser.
       */
      const closeAt = templateContent.indexOf('</script>', tagEnd)
      if (closeAt === -1)
        continue

      removeRanges.push({ start: sMatch.index, end: closeAt + '</script>'.length })

      // Resume scanning AFTER this element. Everything between its tags is
      // script data, so an opening tag in there is text — and the scan would
      // otherwise match the `<script>` inside `"VAL <script>x"` and push a
      // second, overlapping range that runs into the block below.
      serverScriptOpenRe.lastIndex = closeAt + '</script>'.length
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

  let content = await file.text()
  let markdownFrontmatter: Record<string, any> | null = null

  // A .md file is a template like any other: convert it, then let the normal
  // pipeline process the result, so stx syntax works inside prose.
  if (isMarkdownPath(resolvedPath)) {
    const view = await renderMarkdownView(content, { renderer: renderOptions.markdownRenderer })
    content = view.html
    markdownFrontmatter = view.frontmatter
  }

  // Frontmatter is context, and it loses to an explicit context value so a
  // caller can always override what the file declares.
  if (markdownFrontmatter) {
    renderOptions = {
      ...renderOptions,
      context: { ...markdownFrontmatter, ...(renderOptions.context || {}) },
    }
  }

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
  options: Omit<RenderOptions, 'context'> = {},
): Promise<string> {
  return renderTemplateString(template, process.cwd(), { context, ...options })
}

/**
 * Render template content that is already in memory, resolving includes and
 * components relative to `filePath`.
 *
 * Use this when the template cannot be read from disk at runtime — most often an
 * app compiled to a single binary, where the `.stx` file is embedded at build
 * time via `import source from './app.stx' with { type: 'text' }` and
 * `filePath` only anchors relative lookups.
 *
 * @param content - The stx template source
 * @param filePath - Path the template came from, used to resolve relative includes
 * @param renderOptions - Additional rendering options
 */
export async function renderTemplateString(
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
    __stx_inject_css: renderOptions.injectCSS === true,
    /**
     * Declared even when there is no request, so naming it is never a crash.
     *
     * The serve path sets this to the real request context. Every other path -
     * a render from a test, a static build, a router that mounts views itself -
     * never set it at all, which is not the same as setting it to undefined:
     * an *undeclared* identifier is a ReferenceError, and optional chaining
     * does not save it. `__stxServeContext?.cookies` throws before the chain is
     * reached, and because that happens inside the server script's IIFE it
     * takes every other binding in the file down with it. The page then renders
     * its empty-state branch and reads as a correct answer.
     *
     * Declaring it here costs one key and makes the guarded spelling every
     * consumer already writes actually work. The serve path overwrites it below
     * via renderOptions.context, so a real request is unaffected.
     */
    __stxServeContext: undefined,

    /*
     * The server context, as harmless defaults for every path that is not `serve`.
     *
     * The type checker declares these names (`STX_SERVER_CONTEXT` in
     * `stx-virtual-ts.ts`) and `serve.ts` provides real implementations, so a
     * page written against them checks clean and works in development. Every
     * other path - a router that mounts views itself, a static build, a test -
     * provided none of them, and calling one threw a ReferenceError *inside the
     * server script's IIFE*, which takes every other binding in that file down
     * with it.
     *
     * The page then renders its empty-state branch and reads as a correct
     * answer. That is the worst failure available here: an application whose
     * not-found page calls `setResponseStatus(404)` renders "not found" for
     * exactly the reason it intended, while every other branch of the same file
     * is silently blank - and nothing anywhere reports it.
     *
     * **Only the functions are defaulted, deliberately.** `setResponseStatus`,
     * `setResponseHeader` and `definePageMeta` do nothing useful without a host
     * and a no-op is an honest answer to that. `params`, `query` and `cookies`
     * are *data* the host must supply, and defaulting them to `{}` would turn a
     * loud failure into a wrong one: a page filtering on `query.state` would
     * quietly render the unfiltered list, which is indistinguishable from
     * working. A host that renders views itself has to provide those, and the
     * ReferenceError is what tells it so.
     *
     * `setResponseStatus` and `setResponseHeader` record what the page asked
     * for on the context, so a host rendering directly can read it back and
     * answer with it rather than discarding the intent.
     */
    /*
     * The three response bindings, from the one implementation every host
     * shares (`responseBindings` in page-response.ts). They record on
     * `renderOptions.context` — the object the caller handed in — so a host
     * rendering directly reads back what the page asked for with
     * `readResponseStatus` / `readResponseHeaders` rather than discarding it.
     *
     * `renderOptions.context` may be undefined, in which case the recording is
     * a no-op and calling one of these is still harmless — which is the point.
     */
    ...responseBindings((renderOptions.context ?? {}) as Record<string, any>),
    definePageMeta: () => {},

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

  /*
   * Hand back what the page decided about its response.
   *
   * `context` is a fresh object built from the caller's, so a `@status(404)`
   * or a `setResponseStatus(404)` records on an object nobody outside this
   * function can read. Without this line the page's intent dies here, and the
   * host answers 200 for a document that says "not found" — the exact soft-404
   * the feature exists to remove.
   */
  syncRecordedResponse(context, renderOptions.context)

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
        // `filePath` anchors the bundler's relative-import resolution. Without
        // it the bundler saw an empty path, rebased `./x` against the process
        // cwd, failed to find the module, and fell back to emitting the raw
        // `import` statement inside an IIFE — a SyntaxError at runtime, with
        // the only clue a "File not found" line in the build log.
        return await processClientScript(contentMatch[1], {
          eventBindings,
          templateContent: output,
          serverData,
          filePath,
        })
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
