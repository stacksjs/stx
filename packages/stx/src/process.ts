/* eslint-disable prefer-const, style/max-statements-per-line, no-super-linear-backtracking, regexp/no-unused-capturing-group */
/**
 * Core Template Processing Pipeline
 *
 * Orchestrates the full directive processing pipeline for STX templates.
 * Delegates to specialized modules for signals, components, runtime injection, etc.
 *
 * @module process
 */

import type { StxOptions } from './types'
import path from 'node:path'

// Directive processors
import { injectCrosswindCSS } from './dev-server/crosswind'
import { matchHtmlComment, maskAtElementPosition } from './html-masking'
import { processA11yDirectives } from './a11y'
import { generateLifecycleRuntime } from './composables'
import { processTemplateBindings } from './reactive-bindings'
import { injectAnalytics } from './analytics'
import { injectHeatmap } from './heatmap'
import { processAnimationDirectives } from './animation'
import { processEventDirectives } from './events'
import { processClientScript } from './client-script'
import { processReactiveDirectives } from './reactive'
import { processMarkdownFileDirectives } from './assets'
import { processAuthDirectives, processConditionals, processEnvDirective, processIssetEmptyDirectives } from './conditionals'
import { injectCspMetaTag, processCspDirectives } from './csp'
import { processCsrfDirectives } from './csrf'
import { processCustomDirectives } from './custom-directives'
import { devHelpers, errorLogger, errorRecovery, safeExecuteAsync, StxRuntimeError, StxValidationError } from './error-handling'
// Use static import for head module so we share the same currentHead instance
// with variable-extractor.ts. Dynamic await import() can resolve to a separate
// module instance in some Bun configurations.
import { getHead as getHeadStatic } from './head'
import { processExpressions, usesSignalsInScript } from './expressions'
import { processBasicFormDirectives, processErrorDirective, processFormInputDirectives } from './forms'
import { processTranslateDirective } from './i18n'
import { processIncludes, processStackPushDirectives, processStackReplacements } from './includes'
import { processJsDirectives, processTsDirectives } from './js-ts'
import { processLoops } from './loops'
import { processMarkdownDirectives } from './markdown'
import { processMethodDirectives } from './method-spoofing'
import { runPostProcessingMiddleware, runPreProcessingMiddleware } from './middleware'
import { performanceMonitor } from './performance-utils'
import { processRouteDirectives } from './routes'
import { injectSeoTags, processMetaDirectives, processSeoDirective, processStructuredData } from './seo'
import { fileExists, resolveTemplatePath } from './utils'
import { runComposers } from './view-composers'
import { processServerBindings } from './server-bindings'
import { processVueTemplate } from './vue-template'
import { processDynamicComponents } from './dynamic-components'
import { processScopedStyles } from './style-scoping'
import { ensureDocumentShell, injectCloakStyle } from './document-shell'

// Extracted modules
import { hasSignalsSyntax, convertSignalDirectivesToAttributes, convertSignalLoopsToAttributes, processSignals } from './signal-processing'
import { processComponents } from './component-renderer'
import { processInlineAssets } from './inline-assets'
import { addCloakToConditionalDirectives, addCloakToUnresolvedExpressions, processJsonDirective, processMemoDirective, processOnceDirective, processRefAttributes } from './misc-directives'
import { validateClientScript } from './script-validation'
import { safeEvaluate } from './safe-evaluator'
import { deriveLayoutGroup } from 'stx-router/layout-metadata'

// Re-export public API from extracted modules (preserves backwards compatibility)
export { injectRouterScript } from './runtime-injection'
export { processJsonDirective, processOnceDirective } from './misc-directives'
export { validateClientScript } from './script-validation'

/**
 * Marker substituted for `@parent` inside an extracted section so the
 * parent layout's content can be spliced in later. Hand-rolled instead
 * of a Symbol because we operate on raw template strings.
 *
 * Defined once because three call sites have to agree on the exact
 * literal — a typo in any of them silently breaks @parent merging in
 * nested layouts (no error thrown, just missing parent content).
 */
const PARENT_PLACEHOLDER = '<!--PARENT_CONTENT_PLACEHOLDER-->'

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Find the end of a `<script>` body that started at `from` (i.e. just
 * after the opening tag's `>`). Returns the byte index of the matching
 * `</script>` or -1 if none exists.
 *
 * Walks the body as JavaScript so `</script>` occurrences inside
 * strings, template literals, regex literals, or comments don't
 * terminate the scan. This matters most for server scripts: the body
 * is real JS and may contain the literal text "</script>" — naive
 * matching closes the tag early and leaks the tail to the client.
 *
 * Not a full JS parser. We track:
 *   - single/double quoted strings  ('...' / "...")
 *   - template literals             (`...`, including nested ${...} blocks)
 *   - line comments                 (// to end of line)
 *   - block comments                (/* ... *\/)
 *   - regex literals                (/.../flags) — distinguished from division
 *     by looking at the previous non-whitespace token, since `/` after a
 *     value (identifier, ), ], digit, ...) is division and after most
 *     punctuation (`=`, `(`, `,`, `;`, `!`, `?`, `:`, etc.) is a regex.
 *
 * Edge cases we accept being slightly wrong about (regex-vs-division
 * heuristic isn't perfect) all bias toward *finding* the close tag too
 * eagerly, which is the safer failure mode — a missing close is loud
 * (output looks broken in dev) while a leaked tail is silent.
 */
function findScriptBodyEnd(src: string, from: number): number {
  const len = src.length
  let i = from
  // Track whether the next `/` should be parsed as a regex literal vs
  // division. Start as "expects expression" because a script body can
  // begin with `/regex/`.
  let allowRegex = true
  // Stack tracks whether we're inside a template-literal `${...}` block;
  // top of stack holds the current "outer template literal" flag so we
  // know to switch back to template-literal mode after the closing `}`.
  const tmplStack: boolean[] = []

  const isCloseHere = (pos: number) =>
    pos + 9 <= len
    && src[pos] === '<'
    && src[pos + 1] === '/'
    && (src[pos + 2] === 's' || src[pos + 2] === 'S')
    && (src[pos + 3] === 'c' || src[pos + 3] === 'C')
    && (src[pos + 4] === 'r' || src[pos + 4] === 'R')
    && (src[pos + 5] === 'i' || src[pos + 5] === 'I')
    && (src[pos + 6] === 'p' || src[pos + 6] === 'P')
    && (src[pos + 7] === 't' || src[pos + 7] === 'T')
    && (src[pos + 8] === '>' || /\s/.test(src[pos + 8]))

  while (i < len) {
    const c = src[i]

    // Closing tag check — only valid in code context (not inside a
    // string/comment/regex). Reaching this point means we are.
    if (isCloseHere(i)) return i

    // Line comment: // ...\n
    if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i + 2)
      if (i === -1) return -1
      i += 1
      allowRegex = true
      continue
    }

    // Block comment: /* ... */
    if (c === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2)
      if (end === -1) return -1
      i = end + 2
      allowRegex = true
      continue
    }

    // Regex literal: /.../flags — but only if the previous token
    // suggests an expression context.
    if (c === '/' && allowRegex) {
      let j = i + 1
      let inClass = false
      while (j < len) {
        const cc = src[j]
        if (cc === '\\') { j += 2; continue }
        if (cc === '[') inClass = true
        else if (cc === ']') inClass = false
        else if (cc === '/' && !inClass) { j++; break }
        else if (cc === '\n') { j = -1; break }
        j++
      }
      if (j === -1) {
        // Wasn't actually a regex — fall through and treat as division.
        i++
        allowRegex = false
        continue
      }
      // Skip flags
      while (j < len && /[a-z]/.test(src[j])) j++
      i = j
      allowRegex = false
      continue
    }

    // String literal: '...' or "..."
    if (c === '\'' || c === '"') {
      const quote = c
      i++
      while (i < len) {
        if (src[i] === '\\') { i += 2; continue }
        if (src[i] === quote) { i++; break }
        if (src[i] === '\n') break // unterminated — treat as ended for safety
        i++
      }
      allowRegex = false
      continue
    }

    // Template literal
    if (c === '`') {
      i++
      while (i < len) {
        if (src[i] === '\\') { i += 2; continue }
        if (src[i] === '`') { i++; break }
        if (src[i] === '$' && src[i + 1] === '{') {
          // Enter ${...} expression — recurse via stack
          tmplStack.push(true)
          i += 2
          allowRegex = true
          break
        }
        i++
      }
      if (tmplStack.length === 0) allowRegex = false
      continue
    }

    // Closing brace might exit a template `${...}` — check stack
    if (c === '}' && tmplStack.length > 0) {
      tmplStack.pop()
      i++
      // Back to template-literal mode: scan to end of this template
      while (i < len) {
        if (src[i] === '\\') { i += 2; continue }
        if (src[i] === '`') { i++; allowRegex = false; break }
        if (src[i] === '$' && src[i + 1] === '{') {
          tmplStack.push(true)
          i += 2
          allowRegex = true
          break
        }
        i++
      }
      continue
    }

    // Update allowRegex based on this char (rough heuristic — see docstring).
    if (/\s/.test(c)) {
      // whitespace doesn't change context
    } else if (/[)\].\w$]/.test(c)) {
      // identifier-like / closing bracket / number-ish → division comes next
      allowRegex = false
    } else {
      // most other punctuation → regex comes next
      allowRegex = true
    }
    i++
  }

  return -1
}

// =============================================================================
// CORE TEMPLATE PROCESSING PIPELINE
// =============================================================================

// Signal processing, runtime injection, component processing, script validation,
// inline assets, and misc directives have been extracted to their own modules.
// See: signal-processing.ts, runtime-injection.ts, component-processing.ts,
//      script-validation.ts, inline-assets.ts, misc-directives.ts


/**
 * Process all template directives with enhanced error handling and performance monitoring
 */
export async function processDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  // When SSR is explicitly disabled AND we're serving (not building),
  // skip directive processing and return the raw template as an SPA shell.
  // NOTE: ssr: false in stx.config.ts means SSG mode (build at build time),
  // NOT "skip processing." SSG still needs full template processing — the
  // difference is WHEN it runs (build time vs request time), not WHETHER.
  // This guard only applies to the legacy SPA-shell serving mode.
  if (options.ssr === false && !options.autoShell && (options.buildMode as string) === 'spa') {
    return template
  }

  // Track if this is the top-level call (not a recursive call from layout/include)
  const isTopLevel = !context.__stxProcessingDepth
  if (!context.__stxProcessingDepth) {
    context.__stxProcessingDepth = 0
  }
  context.__stxProcessingDepth++

  // Use a request-scoped @once store so the global onceStore doesn't leak state
  // across separate processDirectives calls (e.g. between test runs or server requests)
  if (!context.__onceStore) {
    context.__onceStore = new Set<string>()
  }

  try {
    return await performanceMonitor.timeAsync('template-processing', async () => {
      let result = await processDirectivesInternal(template, context, filePath, options, dependencies)

      if (isTopLevel) {
        // Final pass: transform any remaining ref= attributes to data-stx-ref=
        // Must run at top level after ALL processing (layouts, includes, components)
        // because partials injected via layout resolution may bypass processOtherDirectives
        result = processRefAttributes(result)
      }

      // Auto-generate document shell if explicitly requested via autoShell option.
      // The serve paths (dev-server.ts, serve.ts) set this when serving pages.
      // Tests and programmatic usage don't set it, so output stays unwrapped.
      if (isTopLevel && options.autoShell && options.buildMode !== 'compile') {
        const baseHeadConfig = (options as any).app?.head || {}
        // Merge runtime useHead() state into the static config so per-page
        // useHead({ title, meta, link, ... }) calls actually affect the
        // generated <head>. Read from the context-bound copy first (set by
        // variable-extractor's useHead) and fall back to the head module's
        // global state. The context path is reliable across module instances;
        // the module-global path is the historical API.
        const contextHead = (context.__stx_runtime_head as Record<string, any>) || null
        const runtimeHead = contextHead ?? getHeadStatic()
        const headConfig = {
          ...baseHeadConfig,
          ...(runtimeHead.title && { title: runtimeHead.title }),
          meta: [...(baseHeadConfig.meta || []), ...(runtimeHead.meta || [])],
          link: [...(baseHeadConfig.link || []), ...(runtimeHead.link || [])],
          script: [...(baseHeadConfig.script || []), ...(runtimeHead.script || [])],
          ...(runtimeHead.htmlAttrs && { htmlAttrs: { ...(baseHeadConfig.htmlAttrs || {}), ...runtimeHead.htmlAttrs } }),
          ...(runtimeHead.bodyAttrs && { bodyAttrs: { ...(baseHeadConfig.bodyAttrs || {}), ...runtimeHead.bodyAttrs } }),
        }
        result = ensureDocumentShell(result, headConfig)

        // Inject layout meta tag for SPA layout-change detection
        const layoutComment = result.match(/<!-- stx-layout: ([^ ]+) -->/)
        if (layoutComment && result.includes('<head')) {
          const layoutName = layoutComment[1]
          const layoutGroup = deriveLayoutGroup(layoutName)
          result = result.replace(
            '<head>',
            `<head>\n  <meta name="stx-layout" content="${escapeHtmlAttribute(layoutName)}">\n  <meta name="stx-layout-group" content="${escapeHtmlAttribute(layoutGroup)}">`,
          )
        }

        // Ensure data-stx attribute is on <body> for __stx_setup functions.
        // processScriptSetup may have placed it on a non-body element (e.g. <aside>)
        // because <body> didn't exist before auto-shell wrapping.
        const setupMatch = result.match(/function (__stx_setup_\d+_\d+)\(/)
        if (setupMatch && result.includes('<body') && !result.match(/<body[^>]*data-stx=/)) {
          result = result.replace(/<body([^>]*)>/, `<body$1 data-stx="${setupMatch[1]}">`)
          // Remove data-stx from the wrong element (if it was placed elsewhere)
          const wrongAttrRegex = new RegExp(`(<(?!body)[a-zA-Z][^>]*) data-stx="${setupMatch[1]}"`, 'i')
          result = result.replace(wrongAttrRegex, '$1')
        }
      }

      // Ship the inline x-cloak <style> in the <head> so the rule is live
      // before first paint (#1736). Idempotent: a no-op when generateDocumentShell
      // already added it (auto-shell pages) or when there's no <head> (the
      // runtime's late injection covers those). Covers layout-supplied heads
      // that don't go through generateDocumentShell.
      if (isTopLevel) {
        result = injectCloakStyle(result)
      }

      // Auto-inject store definitions from storesDir.
      // MUST run AFTER the signals runtime (which defines defineStore/state/derived
      // as globals) and BEFORE any page scripts that call useStore().
      // The signals runtime is the first <script data-stx-scoped> — we inject
      // right after its closing </script> tag.
      if (isTopLevel) {
        try {
          const { getStoreScript } = await import('./store-loader')
          // Prefer the resolved storesDir from options (set by serve-app.ts to
          // point at the real app directory). Fall back to config lookup.
          const resolvedStoresDir = (options as any).storesDir as string | undefined
          const storeCode = await getStoreScript(resolvedStoresDir)
          if (storeCode) {
            const storeTag = `<script data-stx-stores>${storeCode}</script>`
            // Find the signals runtime: first <script data-stx-scoped> block
            const runtimeStart = result.indexOf('<script data-stx-scoped>')
            if (runtimeStart !== -1) {
              // Walk forward to find its </script> (browser-style parsing — the
              // first </script> after the opening tag closes the block)
              const runtimeClose = result.indexOf('</script>', runtimeStart + 24)
              if (runtimeClose !== -1) {
                const insertPos = runtimeClose + '</script>'.length
                result = result.slice(0, insertPos) + '\n' + storeTag + result.slice(insertPos)
              }
            }
          }
        }
        catch {
          // Store loading is optional
        }
      }

      // Generate and inject Crosswind CSS AFTER document shell wrapping
      // so bodyClass from stx.config.ts (e.g. 'bg-[#0a0a0f]') is included in the scan.
      // Skip when the caller has opted out via renderOptions.injectCSS=false —
      // renderTemplate sets __stx_inject_css=false on the inner page render of a
      // layout-wrapped template so injection only fires once, on the outer layout
      // render, after the page content has been embedded. Without this guard the
      // page render injects first, the early-return in injectCrosswindCSS fires on
      // the outer render, and layout-only utility classes never get scanned.
      if (isTopLevel && context.__stx_inject_css !== false) {
        result = await injectCrosswindCSS(result)
      }

      // Restore @@ escape placeholders to literal @ AFTER all directive processing
      result = result.replace(/\x00STX_ESCAPED_AT\x00/g, '@')

      return result
    })
  }
  catch (error: unknown) {
    // Validation errors are ALWAYS fatal - they enforce coding standards
    // and should never be recovered from, even in production
    if (error instanceof StxValidationError) {
      throw error
    }

    const msg = error instanceof Error ? error.message : String(error)
    const enhancedError = new StxRuntimeError(
      `Template processing failed: ${msg}`,
      filePath,
      undefined,
      undefined,
      template.substring(0, 200) + (template.length > 200 ? '...' : ''),
    )

    errorLogger.log(enhancedError, { filePath, context })
    devHelpers.logDetailedError(enhancedError, { filePath, template: template.substring(0, 500) })

    if (options.debug) {
      throw enhancedError
    }

    // In production, try to recover
    return errorRecovery.createFallbackContent('Template Processing', enhancedError)
  }
}

/**
 * Internal template processing function
 */
async function processDirectivesInternal(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  // Resolve relative paths in options to absolute paths
  // Use process.cwd() (project root) as the base, not STX's __dirname
  const projectRoot = process.cwd()
  const resolvedOptions: StxOptions = {
    ...options,
    partialsDir: options.partialsDir && !path.isAbsolute(options.partialsDir)
      ? path.resolve(projectRoot, options.partialsDir)
      : options.partialsDir,
    componentsDir: options.componentsDir && !path.isAbsolute(options.componentsDir)
      ? path.resolve(projectRoot, options.componentsDir)
      : options.componentsDir,
    layoutsDir: options.layoutsDir && !path.isAbsolute(options.layoutsDir)
      ? path.resolve(projectRoot, options.layoutsDir)
      : options.layoutsDir,
  }

  // Use resolvedOptions throughout this function
  const opts = resolvedOptions

  let output = template

  await runViewComposersForTemplate(filePath, context)
  prepareDirectiveContext(context, opts)

  // Run "before" middleware against the raw template, before comments and
  // directives are masked. Middleware is allowed to use HTML comments as
  // placeholders, so masking first makes those hooks unreachable.
  output = await safeExecuteAsync(
    () => runPreProcessingMiddleware(output, context, filePath, opts),
    output,
    (error) => {
      errorLogger.log(error, { filePath, phase: 'pre-processing-middleware' }, 'warning')
      console.warn(`[stx] pre-processing middleware failed for ${filePath}: ${error.message}`)
    },
  )

  // First, remove all comments
  output = output.replace(/\{\{--[\s\S]*?--\}\}/g, '')

  // Mask HTML comments BEFORE directive expansion runs. Two distinct bugs
  // surface if we don't (see stacksjs/stx#1699):
  //   1. Backticks inside <!-- --> get pulled into the merged client-script
  //      IIFE and flip the JS parser into template-literal mode, killing
  //      every script after the comment.
  //   2. Directive names inside <!-- --> (e.g. "see @push('styles') below")
  //      get expanded at the comment location — splicing the push block
  //      into the middle of the comment and destroying the surrounding DOM.
  // Masking treats comments as opaque text. We restore them at each return.
  // Element-position-aware (see html-masking): a `<!-- … -->` sequence inside an
  // attribute value (e.g. `title="<!-- "><img onerror=…> -->"`) is NOT masked, so
  // it can't be restored raw past the renderer's escaping and break out — an XSS
  // class shared with the component <script> stash.
  const masked = maskAtElementPosition(
    output,
    matchHtmlComment,
    (_token, index) => `\x00STX_HTML_COMMENT_${index}\x00`,
  )
  output = masked.output
  const htmlComments = masked.tokens
  const unmaskHtmlComments = (s: string): string => htmlComments.length === 0
    ? s
    : s.replace(/\x00STX_HTML_COMMENT_(\d+)\x00/g, (_, i) => htmlComments[Number(i)] ?? '')

  // Replace @@ with a unique placeholder BEFORE directive processing,
  // so @@if(true) doesn't get evaluated as a real @if directive.
  // The placeholder is restored to a literal @ after all processing.
  const ESCAPED_AT_PLACEHOLDER = '\x00STX_ESCAPED_AT\x00'
  output = output.replace(/@@/g, ESCAPED_AT_PLACEHOLDER)

  // Process escaped @{{ }} expressions before other directives
  output = output.replace(/@\{\{([\s\S]*?)\}\}/g, (_, content) => {
    return `{{ ${content} }}`
  })

  // Transform Vue template syntax (v-if, v-for, v-show, v-model, :bind, etc.)
  // into stx directive equivalents before any directive processing
  output = processVueTemplate(output)

  // Process stx-inline attributes for external JS/CSS bundling
  // This allows: <script src="./file.js" stx-inline></script>
  // and: <link href="./file.css" stx-inline />
  output = await processInlineAssets(output, filePath, dependencies)

  // Store stacks for @push/@stack directives
  const stacks: Record<string, string[]> = {}

  // Process @push and @prepend directives first
  output = processStackPushDirectives(output, stacks)

  // Process sections and yields before includes
  // Start with any sections passed in from context (e.g., from parent layout)
  const sections: Record<string, string> = { ...(context.__sections || {}) }
  let layoutPath = ''

  // Handle @nolayout directive — strip it and skip auto-layout
  const hasNoLayout = /@nolayout\b/.test(output)
  if (hasNoLayout) {
    output = output.replace(/@nolayout\b\s*/g, '')
  }

  // Extract layout if used (@layout or @extends)
  const layoutMatch = output.match(/@(?:layout|extends)\(\s*['"]([^'"]+)['"]\s*\)/)
  if (layoutMatch) {
    layoutPath = layoutMatch[1]
    // Remove all @layout/@extends directives from the template
    output = output.replace(/@(?:layout|extends)\(\s*['"]([^'"]+)['"]\s*\)/g, '')
  }

  // Auto-layout: if no explicit layout and no @nolayout, auto-detect layout
  if (!layoutPath && !hasNoLayout && opts.defaultLayout) {
    const hasDoctype = /<!DOCTYPE\s/i.test(output)
    const hasSections = /@section\s*\(/.test(output)

    if (!hasDoctype || hasSections) {
      // Try to find _layout.stx by walking up directories from the file
      let autoLayoutPath = ''

      // Walk up directories to find _layout.stx
      let searchDir = path.dirname(filePath)
      const rootDir = opts.layoutsDir ? path.dirname(opts.layoutsDir) : process.cwd()
      for (let i = 0; i < 20; i++) {
        const candidate = path.join(searchDir, '_layout.stx')
        if (await fileExists(candidate)) {
          autoLayoutPath = candidate
          break
        }
        const parent = path.dirname(searchDir)
        if (parent === searchDir || parent.length < rootDir.length) break
        searchDir = parent
      }

      if (autoLayoutPath) {
        // Use the discovered _layout.stx directly as an absolute path
        layoutPath = autoLayoutPath
      }
      else if (opts.layoutsDir) {
        // Fall back to defaultLayout in layoutsDir
        const resolvedLayoutsDir = path.isAbsolute(opts.layoutsDir)
          ? opts.layoutsDir
          : path.resolve(process.cwd(), opts.layoutsDir)
        const defaultLayoutFile = path.join(resolvedLayoutsDir, `${opts.defaultLayout}.stx`)
        if (await fileExists(defaultLayoutFile)) {
          layoutPath = defaultLayoutFile
        }
      }

      // If auto-layout found and page has no sections, wrap content as 'content' section
      if (layoutPath && !hasSections) {
        output = `@section('content')\n${output.trim()}\n@endsection`
      }
    }
  }

  // Extract sections — three passes:
  //  1. inline form with a quoted string literal:    @section('title', 'My page')
  //  2. inline form with an expression:              @section('title', seoTitle)
  //  3. block form:                                  @section('title')…@endsection
  //
  // Order matters. We run the literal pass first because a literal is
  // strictly a special case of the expression form — but the expression
  // pass uses safeEvaluate, which would re-quote a quoted string back
  // into a quoted string with extra escaping work. Catching the
  // literal case up-front keeps the hot path cheap and avoids
  // round-tripping the value through the expression evaluator.
  //
  // The expression pass is the new bit — it lets per-page views set
  // dynamic title/description/og_image/etc. from <script server>
  // values:
  //
  //     <script server>
  //     const seoTitle = `${product.name} · PetStore`
  //     </script>
  //     @section('title', seoTitle)
  //
  // Without this, that line was silently a no-op (the regex required
  // both args to be quoted strings) and the layout's @yield('title',
  // default) would always fall through to its default — visible bug
  // report on pet-store: every product page had the same generic
  // <title> and og:title.
  // Pass 1: Extract inline sections with a quoted string literal:
  //   @section('name', 'value')
  output = output.replace(/@section\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g, (_, name, value) => {
    sections[name] = value
    return ''
  })

  // Pass 2: Extract inline sections with an expression as the second arg.
  // The capture greedily takes everything between the comma and the
  // closing paren so identifiers, member accesses (`product.name`),
  // template literals, ternaries, and function calls all flow through
  // — anything `safeEvaluate` can interpret. We only run this when
  // the body has at least one non-quoted character, so a malformed
  // `@section('title', '…)` (mismatched quotes, unlikely but possible)
  // doesn't get force-evaluated.
  output = output.replace(/@section\(\s*['"]([^'"]+)['"]\s*,\s*([^)]+?)\s*\)/g, (full, name, expr) => {
    // Skip strings already wrapped in matching quotes — those were the
    // shape pass 1 should have caught; if we see one here it means
    // pass 1's regex didn't match for some reason (e.g. mismatched
    // quote characters). Don't try to evaluate it as an expression.
    if (/^(['"]).*\1$/.test(expr.trim()))
      return full
    try {
      const value = safeEvaluate(expr.trim(), context)
      // safeEvaluate returns undefined for an unrecognized identifier;
      // leave the directive in place rather than silently emitting an
      // empty section, so the missed reference is debuggable.
      if (value === undefined)
        return full
      sections[name] = String(value ?? '')
      return ''
    }
    catch {
      // Evaluation failure — fall back to leaving the directive in
      // place. The unprocessed `@section(…)` is a clearer signal in
      // the rendered HTML than a silently empty value.
      return full
    }
  })

  // Pass 3: Extract block sections: @section('name')...@endsection
  output = output.replace(/@section\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?:@endsection|@show)/g, (_, name, content) => {
    // Process @parent directive in sections
    if (content.includes('@parent')) {
      sections[name] = content.replace('@parent', PARENT_PLACEHOLDER)
    }
    else {
      sections[name] = content.trim()
    }
    return ''
  })

  // Add sections to context
  context.__sections = sections

  // Replace yield/slot with section content (@slot is preferred, @yield is legacy)
  output = output.replace(/@(?:yield|slot)\(\s*['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)/g, (_, name, defaultContent) => {
    return sections[name] || defaultContent || ''
  })

  // Replace {{ slot }} with content section (simpler syntax for layouts)
  // Only do this when `slot` is not explicitly defined in the context (e.g., as a component prop)
  // so that component templates can use {{ slot }} as a normal expression
  if (!('slot' in context) || context.slot === undefined) {
    output = output.replace(/\{\{\s*slot\s*\}\}/g, () => {
      return sections.content || ''
    })
  }

  // Replace @stack directives with their content
  output = processStackReplacements(output, stacks)

  // Salvage view-level <script> / <style> blocks before the layout swallows
  // them. When a view uses @extends + explicit @section('content'), anything
  // OUTSIDE the sections (typically a top-level `<script client>`) was
  // silently dropped — the layout's <body> is rebuilt from @yield/@slot
  // substitution and the view's residue never made it in. Appending them
  // to `sections.content` lets view-level scripts participate in scope
  // registration the same way a component-level `<script client>` does.
  // See stacksjs/stx#1698.
  if (layoutPath) {
    const orphans: string[] = []
    output = output.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (m) => {
      orphans.push(m)
      return ''
    })
    if (orphans.length > 0) {
      const joined = orphans.join('\n')
      sections.content = sections.content
        ? `${sections.content}\n${joined}`
        : joined
      context.__sections = sections
    }
  }

  // Load and process the layout if one was specified
  if (layoutPath) {
    try {


      // If layoutPath is already absolute (from auto-layout: `_layout.stx`
      // walked up the page's directory tree, or the `defaultLayout` in
      // `layoutsDir`), use it directly. Add it to `dependencies` manually —
      // the absolute branch skips `resolveTemplatePath`, which is what
      // normally tracks the layout file. Without this, the dev-server
      // htmlCache wouldn't invalidate when a layout was edited and pages
      // would keep rendering with the stale layout until a server restart.
      let layoutFullPath: string | null
      if (path.isAbsolute(layoutPath)) {
        layoutFullPath = layoutPath
        dependencies.add(layoutPath)
      }
      else {
        layoutFullPath = await safeExecuteAsync(
          () => resolveTemplatePath(layoutPath, filePath, resolvedOptions, dependencies),
          null,
          () => {
            throw new StxRuntimeError(
              `Failed to resolve layout path: ${layoutPath}`,
              filePath,
              undefined,
              undefined,
              `Layout referenced from ${filePath}`,
            )
          },
        )
      }

      if (!layoutFullPath) {
        const warning = `Layout not found: ${layoutPath} (referenced from ${filePath})`
        errorLogger.log(new Error(warning), { layoutPath, filePath }, 'warning')

        if (resolvedOptions.debug) {
          throw new StxRuntimeError(warning, filePath)
        }

        return output
      }

      // Read the layout content with error handling
      const layoutContent = await safeExecuteAsync(
        () => Bun.file(layoutFullPath).text(),
        '',
        () => {
          throw new StxRuntimeError(
            `Failed to read layout file: ${layoutFullPath}`,
            filePath,
            undefined,
            undefined,
            `Layout content could not be loaded`,
          )
        },
      )

      // Check if the layout itself extends another layout (@layout or @extends)
      const nestedLayoutMatch = layoutContent.match(/@(?:layout|extends)\(\s*['"]([^'"]+)['"]\s*\)/)
      if (nestedLayoutMatch) {
        if (resolvedOptions.debug) {
          console.log(`Found nested layout: ${nestedLayoutMatch[1]} in ${layoutFullPath}`)
        }

        // First process the current layout
        // Extract layout sections for parent content
        const layoutSections: Record<string, string> = {}
        const processedLayout = layoutContent.replace(/@section\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?:@show|@endsection)/g, (_, name, content) => {
          layoutSections[name] = content.trim()
          return '' // Remove the section from the template
        })

        // Merge current sections with layout sections, handling @parent
        // This is important for nested layouts
        for (const [name, content] of Object.entries(layoutSections)) {
          if (sections[name] && sections[name].includes(PARENT_PLACEHOLDER)) {
            const idx = sections[name].indexOf(PARENT_PLACEHOLDER)
            sections[name] = sections[name].slice(0, idx) + content + sections[name].slice(idx + PARENT_PLACEHOLDER.length)
          }
          else if (!sections[name]) {
            sections[name] = content
          }
        }

        // Create a new context with merged sections for the nested layout
        const nestedContext = { ...context, __sections: sections }

        // Process the nested layout by recursively calling processDirectives
        // with the modified template that includes the @layout directive
        const nestedTemplate = `@layout('${nestedLayoutMatch[1]}')${processedLayout}`
        return await processDirectives(nestedTemplate, nestedContext, layoutFullPath, resolvedOptions, dependencies)
      }

      // This is the final layout (doesn't extend another one)
      // Strip comments from layout content
      const cleanedLayout = layoutContent.replace(/\{\{--[\s\S]*?--\}\}/g, '')
      // First process pushes and stacks in the layout
      let processedLayout = processStackPushDirectives(cleanedLayout, stacks)

      // Extract layout sections
      const layoutSections: Record<string, string> = {}
      processedLayout = processedLayout.replace(/@section\(\s*['"]([^'"]+)['"]\s*\)([\s\S]*?)(?:@show|@endsection)/g, (_, name, content) => {
        layoutSections[name] = content.trim()
        return `@slot('${name}')`
      })

      // Apply sections to slots in the layout, handling parent content
      processedLayout = processedLayout.replace(/@(?:yield|slot)\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/g, (_, sectionName, defaultContent) => {
        if (sections[sectionName]) {
          // If the section has a parent placeholder, replace it with the parent content
          let sectionContent = sections[sectionName]
          if (sectionContent.includes(PARENT_PLACEHOLDER)) {
            const parentContent = layoutSections[sectionName] || ''
            const idx = sectionContent.indexOf(PARENT_PLACEHOLDER)
            sectionContent = sectionContent.slice(0, idx) + parentContent + sectionContent.slice(idx + PARENT_PLACEHOLDER.length)
          }
          return sectionContent
        }
        return defaultContent || ''
      })

      // Replace {{ slot }} with content section (simpler syntax for layouts)
      processedLayout = processedLayout.replace(/\{\{\s*slot\s*\}\}/g, () => {
        return sections.content || ''
      })

      // Process stack replacements in the layout
      processedLayout = processStackReplacements(processedLayout, stacks)

      // Store the original page's file path so component resolution
      // can search relative to the page, not just relative to the layout
      context.__originalFilePath = filePath

      // Process the fully combined layout content with all other directives
      output = await processOtherDirectives(processedLayout, context, layoutFullPath, resolvedOptions, dependencies)
      // Embed layout identifier for SPA layout-change detection
      output = `<!-- stx-layout: ${layoutPath} -->\n${output}`
      return unmaskHtmlComments(output)
    }
    catch (error) {
      errorLogger.log(error instanceof Error ? error : new Error(String(error)), { layoutPath, filePath }, 'error')
      return `[Error processing layout: ${error instanceof Error ? error.message : String(error)}]`
    }
  }

  // If no layout, process all other directives
  return unmaskHtmlComments(await processOtherDirectives(output, context, filePath, resolvedOptions, dependencies))
}

function prepareDirectiveContext(context: Record<string, any>, opts: StxOptions): void {
  context.__stx_sfc_mode = true
  context.__stx_options = opts

  if (opts.buildMode)
    context.__stx_buildMode = opts.buildMode

  const envPrefix = opts.envPrefix || 'STX_PUBLIC_'
  const publicEnv: Record<string, string> = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith(envPrefix) && value !== undefined)
      publicEnv[key] = value
  }
  context.$env = publicEnv
}

async function runViewComposersForTemplate(filePath: string, context: Record<string, any>): Promise<void> {
  await safeExecuteAsync(
    () => runComposers(filePath, context),
    undefined,
    (error) => {
      errorLogger.log(error, { filePath, phase: 'view-composer' }, 'warning')
      console.warn(`[stx] view composer failed for ${filePath}: ${error.message}`)
    },
  )
}

async function extractServerScriptVariables(output: string, context: Record<string, any>, filePath: string): Promise<void> {
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let scriptMatch: RegExpExecArray | null

  while ((scriptMatch = scriptRegex.exec(output)) !== null) {
    const attrs = scriptMatch[1]
    const scriptContent = scriptMatch[2]
    const isServerScript = /\bserver\b/.test(attrs)

    if (!isServerScript || !scriptContent.trim())
      continue

    try {
      const { extractVariables } = await import('./variable-extractor')
      /* Layouts and partials extracted here run AFTER the child page's
         `<script server>` has populated context (in render.ts). Passing
         `preserveExisting` means a layout-level stub like
         `const user = { avatarInitials: 'JD' }` no longer clobbers the
         full object the page declared on the same name. */
      await extractVariables(scriptContent, context, filePath, { preserveExisting: true })
    }
    catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      errorLogger.log(err, { filePath, phase: 'server-script-extraction' }, 'warning')
      console.warn(`[stx] server <script> extraction failed in ${filePath}: ${err.message}`)
    }
  }
}

async function interpolateClientScriptExpressions(output: string, context: Record<string, any>, filePath: string): Promise<string> {
  try {
    const { interpolateScriptsInTemplate } = await import('./expressions')
    return interpolateScriptsInTemplate(output, context, { skipServer: true })
  }
  catch (e) {
    const err = e instanceof Error ? e : new Error(String(e))
    errorLogger.log(err, { filePath, phase: 'script-expression-interpolation' }, 'warning')
    console.warn(`[stx] script expression interpolation failed in ${filePath}: ${err.message}`)
    return output
  }
}

// Helper function to process all non-layout directives
async function processOtherDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Use opts as alias for options (consistent with processDirectivesInternal)
  const opts = options

  // Extract variables from <script server> tags (SFC support)
  // Only scripts with explicit 'server' attribute are executed server-side
  // All other scripts (no attribute, 'client', 'type="module"', 'src=') are client-side
  await extractServerScriptVariables(output, context, filePath)

  // Interpolate server-side {{ expr }} / {!! expr !!} inside every non-server
  // <script> body (client / signals / bare) so pages can splice server data
  // into client code: `const PRICE = {{ car.price }}` → `const PRICE = 89`.
  //
  // Rules (see expressions.ts `interpolateScriptExpressions`):
  //   - {{ expr }} emits JSON.stringify(value) — safe JS (strings quoted,
  //     objects/arrays as JSON literals).
  //   - {!! expr !!} emits raw String(value) — user-serialized splice.
  //   - Unresolved expressions are preserved for client-side signal handling.
  //   - Server-side scripts are skipped (they're executed, not embedded).
  //   - Scripts with data-raw / type="application/json" / src= opt out.
  //
  // This must run AFTER server-var extraction so values are in context, and
  // BEFORE any downstream processing that consumes script bodies (script
  // setup wrapping, signals transformation, minification).
  output = await interpolateClientScriptExpressions(output, context, filePath)

  // Process JS/TS directives FIRST - these define variables needed by other directives
  // These execute server-side code and populate the context with variables
  output = await processJsDirectives(output, context, filePath)
  output = await processTsDirectives(output, context, filePath)

  // Process custom directives
  output = await processCustomDirectives(output, context, filePath, opts)

  // For templates that use signals, convert @if/@for directive blocks to attribute-style
  // MUST run BEFORE processLoops/processConditionals so signal loops aren't evaluated server-side
  // Pass context so loops referencing server-side data are kept for server-side processing
  if (usesSignalsInScript(output)) {
    output = convertSignalDirectivesToAttributes(output, context)
    output = convertSignalLoopsToAttributes(output, context)
  }

  // Process loops FIRST - BEFORE components so that loop variables are evaluated
  // when components are processed, not after components have already been expanded
  output = processLoops(output, context, filePath, opts)


  // Process all components: @import, @component, custom elements, builtins
  // Single unified pass replaces processImportDirectives, processBuiltInComponents,
  // processComponentDirectives, processCustomElements, and expandStxLinks
  output = await processComponents(output, context, filePath, opts, dependencies)

  // Process dynamic components (<component :is="expr">)
  output = await processDynamicComponents(output, context, filePath, opts, dependencies)

  // Process animations and transitions
  output = processAnimationDirectives(output, context, filePath, opts)

  // Process defer directives (@defer for lazy loading)
  const { processDeferDirectives } = await import('./defer')
  output = processDeferDirectives(output, context, filePath)

  // Process teleport directives (@teleport for DOM portals)
  const { processTeleportDirectives } = await import('./teleport')
  output = processTeleportDirectives(output, context, filePath)

  // Process transition directives (@transition for animations)
  const { processTransitionDirectives, processTransitionAttributes } = await import('./transitions')
  output = processTransitionDirectives(output, context, filePath)
  output = processTransitionAttributes(output)

  // Process error boundary directives (@errorBoundary for graceful error handling)
  const { processErrorBoundaryDirectives } = await import('./error-boundaries')
  output = processErrorBoundaryDirectives(output, context, filePath)

  // Process suspense directives (@suspense for coordinating async loading)
  const { processSuspenseDirectives } = await import('./suspense')
  output = processSuspenseDirectives(output, context, filePath)

  // Process async component directives (@async for lazy loading)
  const { processAsyncDirectives } = await import('./async-components')
  output = processAsyncDirectives(output, context, filePath)

  // Process keep-alive directives (@keepAlive for caching component state)
  const { processKeepAliveDirectives } = await import('./keep-alive')
  output = processKeepAliveDirectives(output, context, filePath)

  // Process virtual scrolling directives (@virtualList, @virtualGrid, @infiniteList)
  const { processVirtualListDirectives, processVirtualGridDirectives, processInfiniteListDirectives } = await import('./virtual-scrolling')
  output = processVirtualListDirectives(output, context, filePath)
  output = processVirtualGridDirectives(output, context, filePath)
  output = processInfiniteListDirectives(output, context, filePath)

  // Process partial hydration directives (@client:load, @client:idle, @client:visible, etc.)
  const { processPartialHydrationDirectives, processStaticDirectives } = await import('./partial-hydration')
  output = processPartialHydrationDirectives(output, context, filePath)
  output = processStaticDirectives(output)

  // Process computed directives (@computed, @watch)
  const { processComputedDirectives, processWatchDirectives } = await import('./computed')
  output = processComputedDirectives(output, context, filePath)
  output = processWatchDirectives(output, context, filePath)

  // Process form validation directives (@error, @errors, @hasErrors)
  const { processFormValidationDirectives } = await import('./forms-validation')
  output = processFormValidationDirectives(output, context, filePath)

  // Process head directives (@head, @title, @meta)
  const { processHeadDirective, processTitleDirective, processMetaDirective, resetHead } = await import('./head')
  // Reset head state unless the caller has already populated it via useHead() /
  // useSeoMeta() from a server script. variable-extractor stashes both on the
  // context as `__stx_runtime_head` when these composables fire, so its presence
  // is a reliable "head was populated by this page" signal — no matter which
  // entrypoint (bun-plugin, dev-server, custom serve.ts) ran the extraction.
  if (!context.__stx_head_preset && !context.__stx_runtime_head) {
    resetHead()
  }
  const headResult = processHeadDirective(output)
  output = headResult.content
  output = processTitleDirective(output, context)
  output = processMetaDirective(output, context)

  // Process route directives
  output = processRouteDirectives(output)

  // Process authentication directives
  output = processAuthDirectives(output, context)

  // Process CSRF directives
  output = processCsrfDirectives(output)

  // Process method spoofing directives
  output = processMethodDirectives(output)

  // Process includes (@include, @component, etc.)
  output = await processIncludes(output, context, filePath, opts, dependencies)

  // Second component pass — catch components introduced by @include (e.g. StxLink in sidebar partials)
  output = await processComponents(output, context, filePath, opts, dependencies)

  // Strip any `@push(...) ... @endpush` markers that survived past
  // include resolution. The page-level push pass at line 495 ran
  // BEFORE includes were resolved, so push directives inside
  // included partials (e.g. RichTextEditor's `@push('styles')`)
  // never got harvested by the stack collector and leak through as
  // literal text on the rendered page. Any `<style>` inside the
  // block has already moved to a sibling position via the SFC
  // style-extraction pass; we just need to nuke the bare wrappers.
  output = output.replace(/@push\s*\(\s*['"][^'"]+['"]\s*\)[\s\S]*?@endpush/g, '')

  // Process @ref attributes for DOM references
  // Must run AFTER processIncludes so ref= attributes in partials/components are transformed
  output = processRefAttributes(output)

  // Process conditionals (@if, @unless, etc.) - AFTER loops to allow loop variables in scope
  output = processConditionals(output, context, filePath)

  // Process isset/empty directives
  output = processIssetEmptyDirectives(output, context)

  // Process env directive
  output = processEnvDirective(output, context)

  // Process form directives (basic: @csrf, @method; input: @form, @input, @textarea, @select, @checkbox, @radio, @file, @label)
  output = processBasicFormDirectives(output, context)
  output = processFormInputDirectives(output, context)

  // Process error directive
  output = processErrorDirective(output, context)

  // Note: JS/TS directives are processed at the beginning of processOtherDirectives
  // to ensure variables are available for conditionals, loops, and expressions

  // Process markdown files - new directive for including .md files with frontmatter
  output = await processMarkdownFileDirectives(output, context, filePath, opts)

  // Process markdown directives (@markdown)
  output = await processMarkdownDirectives(output, context, filePath)

  // Process translate directives (@translate, @t)
  output = await processTranslateDirective(output, context, filePath, opts)

  // Process accessibility directives (@a11y, @screenReader)
  output = processA11yDirectives(output, context, filePath, opts)

  // Process SEO directives (@meta, @seo, @structuredData)
  output = processMetaDirectives(output, context, filePath, opts)
  output = processStructuredData(output, context, filePath)
  output = processSeoDirective(output, context, filePath, opts)

  // Process CSP directives (@csp, @cspNonce)
  output = processCspDirectives(output, context, filePath, opts)

  // Process @json directive
  output = processJsonDirective(output, context)

  // Process @once directive
  output = processOnceDirective(output)

  // Process @memo directive — transform to data-stx-memo for runtime memoization
  output = processMemoDirective(output)

  // Process event directives (@click, @keydown.enter, etc.) - Alpine-style events
  // Skip for signal components - runtime handles @click etc. via processElement()
  if (!opts.skipEventDirectives) {
    output = processEventDirectives(output, context, filePath)
  }

  // Process reactive directives (x-data, x-model, x-show, etc.) - Alpine-style reactivity
  output = processReactiveDirectives(output, context, filePath)

  // Dev warning: detect mixing of Alpine-style (x-data) and signals (state/derived/effect)
  // in the same template. Both systems work on the same page but not on the same element.
  if (opts.debug) {
    const hasXData = /\bx-data\s*=/.test(output)
    const hasSignals = hasSignalsSyntax(template)
    if (hasXData && hasSignals) {
      console.warn(
        `[stx] ${filePath}: Template mixes Alpine-style (x-data) and signals (state/derived/effect) reactivity.\n`
        + `  Both work on the same page, but they manage separate scopes.\n`
        + `  Prefer signals (state/derived/effect) for new components.`,
      )
    }
  }

  // Resolve server-side :attr="expr" bindings (e.g., :src, :href, :class, :disabled)
  // before expression processing so they can use the full server context
  output = processServerBindings(output, context)

  // Process expressions now (delayed to allow other directives to generate expressions)
  output = await processExpressions(output, context, filePath)

  // Add x-cloak to elements containing unresolved {{ }} expressions (preserved for client-side).
  // This prevents FOUC — raw mustache syntax flashing before the JS runtime processes them.
  // The signals runtime removes x-cloak after binding, identical to Vue's v-cloak approach.
  output = addCloakToUnresolvedExpressions(output)

  // Auto-stamp x-cloak on elements carrying a reactive conditional/visibility
  // directive (:if, :else, :else-if, :show, x-*, @if, @show). Paired with the
  // inline cloak <style> shipped in the SSR <head>, this hides false branches
  // and hidden elements until the runtime mounts — preventing the FOUC in
  // stacksjs/stx#1736 without per-element opt-in. The runtime strips x-cloak
  // as it processes each element.
  output = addCloakToConditionalDirectives(output)

  // Process reactive bindings (:class, :text, stx-class, stx-bind:class, etc.)
  // This generates client-side JS for store-aware reactive updates
  output = processTemplateBindings(output)

  // Process x-element directives (x-data, x-model, x-text, etc.)
  // Injects lightweight reactivity runtime for two-way binding
  const { processXElementDirectives } = await import('./x-element')
  output = processXElementDirectives(output)

  // Process STX signals for reactive UI (state, derived, effect, :if, :for, :model, etc.)
  // This injects the signals runtime and processes <script setup> blocks.
  // Prefer the original page's filePath (when present) over the layout's so
  // the client-script bundler can rebase relative `import './...'` lines
  // against the page directory rather than the layout's directory.
  const pageFilePath = (context.__originalFilePath as string | undefined) || filePath
  output = await processSignals(output, opts, pageFilePath)

  // Run post-processing middleware
  output = await runPostProcessingMiddleware(output, context, filePath, opts)

  // Auto-discover .webp/.avif siblings next to plain <img src="*.jpg|png">
  // refs and wrap them in <picture>. Opt-in via media.image.autoSiblings —
  // off by default because every render adds an FS stat call per <img>.
  if (opts.media?.image?.autoSiblings) {
    const publicDir = opts.publicDir || 'public'
    const { rewriteImagesWithSiblings } = await import('./image-optimization/auto-sibling')
    output = await rewriteImagesWithSiblings(output, { publicDir })
  }

  // Auto-inject SEO tags if enabled
  if (opts.seo?.enabled) {
    output = injectSeoTags(output, context, opts)
  }

  // Inject rendered head content from useHead/useSeoMeta calls. Prefer the
  // context-bound copy (set by variable-extractor's wrapped composables) over
  // the module-global — the context copy is per-page and survives even when
  // Bun's resolution serves a different head.ts instance to the page script.
  const { renderHead, getHead } = await import('./head')
  const contextHead = context.__stx_runtime_head as any
  const headConfig = contextHead && (contextHead.title || contextHead.meta?.length || contextHead.link?.length)
    ? contextHead
    : getHead()
  if (headConfig.title || headConfig.meta?.length || headConfig.link?.length) {
    const renderedHead = renderHead(headConfig)
    if (renderedHead) {
      // Inject before </head> or at start of document
      if (output.includes('</head>')) {
        output = output.replace('</head>', `${renderedHead}\n</head>`)
      }
else if (output.includes('<head>')) {
        output = output.replace('<head>', `<head>\n${renderedHead}`)
      }
    }
  }

  // Also inject head content from @head directive blocks
  if (headResult.headContent) {
    if (output.includes('</head>')) {
      output = output.replace('</head>', `${headResult.headContent}\n</head>`)
    }
else if (output.includes('<head>')) {
      output = output.replace('<head>', `<head>\n${headResult.headContent}`)
    }
  }

  // Auto-inject CSP meta tag if enabled
  if (opts.csp?.enabled && opts.csp.addMetaTag) {
    output = injectCspMetaTag(output, opts.csp as any, context)
  }

  // Auto-inject analytics if enabled
  if (opts.analytics?.enabled) {
    output = injectAnalytics(output, opts)
  }

  // Auto-inject heatmap tracking if enabled
  if (opts.heatmap?.enabled) {
    output = injectHeatmap(output, opts)
  }

  // Auto-inject PWA tags if enabled
  if (opts.pwa?.enabled && opts.pwa.autoInject !== false) {
    const { injectPwaTags } = await import('./pwa/inject')
    output = injectPwaTags(output, opts)
  }

  // Auto-inject STX lifecycle runtime if client scripts use STX APIs
  // This provides window.STX with useRefs, el, onKey, activeElement, escapeHtml, etc.
  const hasClientScripts = /<script\b(?![^>]*\bserver\b)[^>]*>[\s\S]*?<\/script>/i.test(output)
  const hasStxUsage = /\bSTX\.\w+/.test(output)
  const alreadyHasRuntime = /window\.STX\s*=/.test(output)

  if (hasClientScripts && hasStxUsage && !alreadyHasRuntime) {
    const runtimeCode = generateLifecycleRuntime()
    const runtimeScript = `<script data-stx-scoped>\n${runtimeCode}\n</script>`

    // Inject in head before other scripts, or at start of body
    if (output.includes('</head>')) {
      // Find the first <script in the head section and insert runtime before it
      const headEndPos = output.indexOf('</head>')
      const headSection = output.slice(0, headEndPos)
      const firstScriptPos = headSection.indexOf('<script')

      if (firstScriptPos !== -1) {
        // Insert runtime script right before the first script tag
        const before = output.slice(0, firstScriptPos)
        const after = output.slice(firstScriptPos)
        output = before + runtimeScript + '\n' + after
      }
else {
        // No scripts in head, insert before </head>
        output = output.replace('</head>', `${runtimeScript}\n</head>`)
      }
    }
else if (output.includes('<body')) {
      output = output.replace(/<body([^>]*)>/, `<body$1>\n${runtimeScript}`)
    }
else {
      // No head or body, prepend to output
      output = runtimeScript + '\n' + output
    }
  }

  // Strip server-only scripts (marked with 'server' attribute).
  //
  // These are used for SSR variable extraction and shouldn't appear in
  // the client output. Finding the matching `</script>` is non-trivial
  // because the body is JavaScript: the literal `</script>` can legally
  // appear inside a string, template literal, line/block comment, or
  // regex literal — e.g. `const x = "</script>"`. A naive
  // `indexOf('</script>')` would terminate the script early there,
  // leaving the real tail (including any subsequent code) leaked into
  // the client-visible output.
  //
  // findScriptBodyEnd walks the body as JS, tracking string/comment/regex
  // state, and returns the index of the *real* close tag.
  {
    const serverScriptRe = /<script\s+server\b[^>]*>/gi
    let serverMatch: RegExpExecArray | null
    const serverRemoveRanges: { start: number, end: number }[] = []
    while ((serverMatch = serverScriptRe.exec(output)) !== null) {
      const tagEnd = serverMatch.index + serverMatch[0].length
      const closeIdx = findScriptBodyEnd(output, tagEnd)
      if (closeIdx === -1) {
        // Unclosed server script — don't strip a partial range, just
        // skip it and let the (broken) output surface so the author sees
        // the problem in their template rather than silently swallowing
        // half the file.
        continue
      }
      let rangeEnd = closeIdx + '</script>'.length
      // Also consume trailing whitespace
      while (rangeEnd < output.length && /\s/.test(output[rangeEnd])) rangeEnd++
      serverRemoveRanges.push({ start: serverMatch.index, end: rangeEnd })
    }
    // Remove in reverse order to preserve indices
    for (let ri = serverRemoveRanges.length - 1; ri >= 0; ri--) {
      const { start, end } = serverRemoveRanges[ri]
      output = output.substring(0, start) + output.substring(end)
    }
  }

  // Process <style scoped> blocks: scope CSS selectors and add scope attributes to elements
  const scopedResult = processScopedStyles(output, filePath)
  if (scopedResult.hasScoped) {
    output = scopedResult.html
  }

  // Transform client <script> blocks: resolve @stores imports, inject event
  // bindings into the script scope, and auto-wrap in a scoped IIFE.
  // Client scripts include: <script>, <script client>, <script type="module">, etc.
  // Excludes: <script server>, <script src="...">, <script data-stx-scoped>
  const eventBindings = (context.__stx_event_bindings || []) as import('./events').ParsedEvent[]
  let clientScriptsTransformed = false
  const clientScriptMatches: { match: string, attrs: string, content: string }[] = []
  // Detect : prefix directives in the template output (for stx.mount() decision)
  const hasColonDirectives = /\s:[a-z][\w.-]*\s*=/.test(output)
  // Use a browser-style scanner so we don't false-match `<script>` text inside
  // OTHER scripts' bodies (e.g. a comment mentioning `<script client>` inside
  // the signals runtime). A flat regex would hoist that fragment and try to
  // transpile it as TypeScript.
  //
  // Non-JS script types are skipped entirely. The browser only executes
  //   `<script>`, `<script type="text/javascript">`, `<script type="application/javascript">`,
  //   `<script type="module">`
  // — anything else is a data block (`application/ld+json` for SEO,
  // `application/json` for embedded config, `importmap`, `text/template`,
  // `speculationrules`, …) and must pass through verbatim. Wrapping a
  // JSON-LD block in `;(function(){'use strict'; …}())` corrupts it and
  // strips the type, which is what surfaced the original report (Google
  // never saw the Product schema).
  const { scanScriptTags } = await import('./signal-processing')
  for (const s of scanScriptTags(output, {
    skipAttrs: /\bserver\b|\bsrc\s*=|\bdata-stx-scoped\b|\bdata-stx-router\b|\btype\s*=\s*["'](?!(?:text\/javascript|application\/javascript|module)["'])[^"']*["']/,
  })) {
    clientScriptMatches.push({ match: s.fullMatch, attrs: s.attrs, content: s.body })
  }

  for (const { match, attrs, content } of clientScriptMatches) {
    clientScriptsTransformed = true
    // eslint-disable-next-line pickier/no-unused-vars
    let processedContent = content

    // Validate client scripts for prohibited patterns
    validateClientScript(content, filePath, options.strict)

    // Use callback form of replace to avoid $ pattern interpretation in replacement string
    // Note: processClientScript handles transpilation internally based on attrs
    const scriptResult = await processClientScript(content, { eventBindings, attrs, hasColonDirectives, templateContent: template, filePath, projectRoot: process.cwd(), production: options.buildMode === 'compile' })
    output = output.replace(match, () => scriptResult)
  }
  // Only clear event bindings if scripts were found and transformed.
  // When processing a component whose scripts were extracted separately
  // (e.g., renderComponentWithSlot), bindings must be preserved for the caller.
  if (clientScriptsTransformed) {
    context.__stx_event_bindings = []
  }

  // Note: Crosswind CSS injection is done at the top level in processDirectives
  // to avoid duplicate injection for includes/layouts/components

  return output
}
