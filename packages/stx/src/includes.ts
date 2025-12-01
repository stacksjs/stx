/**
 * Includes Module
 *
 * Processes include, partial, and stack directives for template composition.
 * This module enables building complex templates from reusable pieces.
 *
 * ## Include Directives
 *
 * | Directive | Description |
 * |-----------|-------------|
 * | `@include('path')` | Include a partial template |
 * | `@include('path', { vars })` | Include with local variables |
 * | `@partial('path')` | Alias for @include |
 * | `@includeIf('path')` | Include only if file exists |
 * | `@includeWhen(cond, 'path')` | Include if condition is true |
 * | `@includeUnless(cond, 'path')` | Include if condition is false |
 * | `@includeFirst(['a','b'])` | Include first existing file |
 * | `@once...@endonce` | Include content only once per request |
 *
 * ## Stack Directives
 *
 * | Directive | Description |
 * |-----------|-------------|
 * | `@push('name')...@endpush` | Add content to end of stack |
 * | `@prepend('name')...@endprepend` | Add content to start of stack |
 * | `@stack('name')` | Output stack contents |
 *
 * ## Path Resolution
 *
 * Paths are resolved in this order:
 * 1. If path starts with `./` or `../`: Relative to current template
 * 2. Otherwise: Relative to `partialsDir` (from config)
 *
 * Paths without `.stx` extension automatically get it appended.
 *
 * ## Security
 *
 * Path traversal attacks are blocked. Includes must resolve to:
 * - The configured partials directory, OR
 * - The directory containing the current template
 *
 * Uses safe evaluation for expression evaluation to prevent code injection.
 *
 * ## @once Directive
 *
 * The `@once` directive ensures content is only rendered once per request.
 * This is useful for including scripts or styles that should not be duplicated.
 *
 * **Important**: In server environments, use request-scoped tracking:
 *
 * ```typescript
 * // Option 1: Clear global store per request
 * app.use((req, res, next) => {
 *   clearOnceStore()
 *   next()
 * })
 *
 * // Option 2: Use request-scoped store (recommended)
 * const context = {
 *   __onceStore: new Set<string>(),
 *   ...otherData
 * }
 * ```
 *
 * @module includes
 */

import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'
import { LRUCache } from './performance-utils'
import { createSafeFunction, isExpressionSafe, safeEvaluate, safeEvaluateObject } from './safe-evaluator'
import { createDetailedErrorMessage, fileExists } from './utils'

// Cache for partials to avoid repeated file reads (LRU with max 500 entries)
export const partialsCache = new LRUCache<string, string>(500)

// Global store to track what has been included via @once
// WARNING: This persists across requests in long-running servers!
// Use clearOnceStore() at the start of each request, or use request-scoped tracking via context.__onceStore
export const onceStore: Set<string> = new Set()

/**
 * Clear the @once store - useful for testing and resetting state
 *
 * IMPORTANT: In server environments, call this at the start of each request
 * to prevent @once content from being incorrectly skipped across requests.
 *
 * Alternatively, use request-scoped tracking by setting `context.__onceStore = new Set()`
 * before processing templates. The processor will use context.__onceStore if available.
 *
 * @example
 * ```typescript
 * // Option 1: Clear global store per request
 * app.use((req, res, next) => {
 *   clearOnceStore()
 *   next()
 * })
 *
 * // Option 2: Use request-scoped store (preferred)
 * const context = {
 *   __onceStore: new Set<string>(),
 *   ...otherData
 * }
 * await processDirectives(template, context, filePath, options)
 * ```
 */
export function clearOnceStore(): void {
  onceStore.clear()
}

/**
 * Get the @once store to use - prefers request-scoped if available
 */
function getOnceStore(context: Record<string, any>): Set<string> {
  // Prefer request-scoped store if available
  if (context.__onceStore instanceof Set) {
    return context.__onceStore
  }
  // Fall back to global store (with warning in debug mode)
  return onceStore
}

/**
 * Process @include, @partial, @includeIf, @includeWhen, @includeUnless,
 * @includeFirst, and @once directives.
 *
 * This is the main function for include processing. It handles all include
 * variants and the @once directive for deduplication.
 *
 * @param template - The template string to process
 * @param context - Template context with variables
 * @param filePath - Path to the current template file
 * @param options - STX processing options
 * @param dependencies - Set to track included file dependencies (for caching)
 * @returns The processed template with includes resolved
 *
 * @example
 * ```typescript
 * const deps = new Set<string>()
 * const result = await processIncludes(
 *   '@include("header") <main>Content</main> @include("footer")',
 *   { title: 'My Page' },
 *   '/app/views/home.stx',
 *   options,
 *   deps
 * )
 * // deps now contains paths to header.stx and footer.stx
 * ```
 */
export async function processIncludes(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
  includeStack: Set<string> = new Set(),
): Promise<string> {
  // Get the partials directory and resolve to absolute path if needed
  let partialsDir = options.partialsDir || path.join(path.dirname(filePath), 'partials')

  // Resolve relative paths to absolute - check if it's already absolute
  if (partialsDir && !path.isAbsolute(partialsDir)) {
    // Resolve relative to the directory containing the stx package
    // This handles cases like '../../examples/components' in stx.config.ts
    const configDir = path.resolve(__dirname, '..')
    partialsDir = path.resolve(configDir, partialsDir)
  }

  // First handle partial alias (replace @partial with @include)
  let output = template.replace(/@partial\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (_, includePath, varsString) => `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`)

  // Process @once directive - content that should only be included once per request
  // Uses request-scoped store if available (context.__onceStore), otherwise falls back to global
  const activeOnceStore = getOnceStore(context)

  output = output.replace(/@once([\s\S]*?)@endonce/g, (match, content, _offset) => {
    // Create a unique key for this @once block based on content hash
    const contentHash = content.trim()
    const onceKey = `${filePath}:${contentHash}`

    if (activeOnceStore.has(onceKey)) {
      // Already included, return empty string
      return ''
    }

    // Mark as included and return the content
    activeOnceStore.add(onceKey)
    return content
  })

  // Process special include directives first
  // Process @includeIf directive
  output = output.replace(/@includeIf\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (_, includePath, varsString) => {
    const includeFilePath = resolvePath(includePath, partialsDir, filePath)
    if (includeFilePath && fs.existsSync(includeFilePath)) {
      // Track dependency
      dependencies.add(includeFilePath)
      return `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`
    }
    return ''
  })

  // Process @includeWhen directive using safe evaluation
  output = output.replace(/@includeWhen\s*\(([^,]+),\s*['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (match, condition, includePath, varsString, offset) => {
    try {
      // Evaluate the condition using safe evaluation
      const condExpr = `Boolean(${condition})`
      let shouldInclude: boolean
      if (isExpressionSafe(condExpr)) {
        const conditionFn = createSafeFunction(condExpr, Object.keys(context))
        shouldInclude = Boolean(conditionFn(...Object.values(context)))
      }
      else {
        shouldInclude = Boolean(safeEvaluate(condExpr, context))
      }

      if (shouldInclude) {
        // Track dependency if condition is true
        const includeFilePath = resolvePath(includePath, partialsDir, filePath)
        if (includeFilePath && fs.existsSync(includeFilePath)) {
          dependencies.add(includeFilePath)
        }
        return `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`
      }
      return ''
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Include',
        `Error evaluating @includeWhen condition: ${error.message}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Process @includeUnless directive using safe evaluation
  output = output.replace(/@includeUnless\s*\(([^,]+),\s*['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (match, condition, includePath, varsString, offset) => {
    try {
      // Evaluate the condition using safe evaluation
      const condExpr = `Boolean(${condition})`
      let conditionResult: boolean
      if (isExpressionSafe(condExpr)) {
        const conditionFn = createSafeFunction(condExpr, Object.keys(context))
        conditionResult = Boolean(conditionFn(...Object.values(context)))
      }
      else {
        conditionResult = Boolean(safeEvaluate(condExpr, context))
      }

      if (!conditionResult) {
        // Track dependency if condition is false
        const includeFilePath = resolvePath(includePath, partialsDir, filePath)
        if (includeFilePath && fs.existsSync(includeFilePath)) {
          dependencies.add(includeFilePath)
        }
        return `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`
      }
      return ''
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Include',
        `Error evaluating @includeUnless condition: ${error.message}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Process @includeFirst directive
  // This tries multiple includes and uses the first one that exists
  // Supports optional fallback: @includeFirst(['a', 'b'], {}, 'fallback content')
  const includeFirstRegex = /@includeFirst\s*\(\s*(\[[^\]]+\])\s*(?:,\s*(\{[^}]*\})\s*)?(?:,\s*['"]([^'"]*)['"]\s*)?\)/g
  let includeFirstMatch

  // eslint-disable-next-line no-cond-assign
  while (includeFirstMatch = includeFirstRegex.exec(output)) {
    const [fullMatch, pathArrayString, varsString, fallbackContent] = includeFirstMatch
    const matchOffset = includeFirstMatch.index

    try {
      // Parse the array of paths
      const pathArray = JSON.parse(pathArrayString.replace(/'/g, '"'))

      // Parse local variables if provided using safe evaluation
      let localVars: Record<string, unknown> = {}
      if (varsString) {
        try {
          localVars = safeEvaluateObject(varsString, context)
        }
        catch (error: any) {
          // In production, use fallback; in debug mode, show error
          if (options.debug) {
            output = output.replace(
              fullMatch,
              createDetailedErrorMessage(
                'Include',
                `Error parsing includeFirst variables: ${error.message}`,
                filePath,
                template,
                matchOffset,
                fullMatch,
              ),
            )
          }
          else {
            output = output.replace(fullMatch, fallbackContent || '')
          }
          continue
        }
      }

      // Try each path in order
      let foundValidPath = false
      for (const includePath of pathArray) {
        // Get the actual file path
        const includeFilePath = resolvePath(includePath, partialsDir, filePath)
        if (!includeFilePath) {
          continue // Skip to next path
        }

        // Check if file exists
        if (await fileExists(includeFilePath)) {
          // Process the include with our helper function
          const processed = await processIncludeHelper(includePath, localVars, template, matchOffset)
          output = output.replace(fullMatch, processed)
          foundValidPath = true
          break
        }
      }

      // No valid include found - use fallback or show error based on debug mode
      if (!foundValidPath) {
        if (fallbackContent !== undefined) {
          // Use provided fallback content
          output = output.replace(fullMatch, fallbackContent)
        }
        else if (options.debug) {
          // Show detailed error in debug mode
          output = output.replace(
            fullMatch,
            createDetailedErrorMessage(
              'Include',
              `None of the includeFirst paths exist: ${pathArrayString}`,
              filePath,
              template,
              matchOffset,
              fullMatch,
            ),
          )
        }
        else {
          // In production without fallback, silently remove the directive
          // to prevent breaking the page layout
          output = output.replace(fullMatch, '')
        }
      }
    }
    catch (error: any) {
      output = output.replace(
        fullMatch,
        createDetailedErrorMessage(
          'Include',
          `Error processing @includeFirst: ${error.message}`,
          filePath,
          template,
          matchOffset,
          fullMatch,
        ),
      )
    }

    // Reset regex to start from beginning since we've modified the string
    includeFirstRegex.lastIndex = 0
  }

  // Helper function to resolve paths with path traversal protection
  function resolvePath(includePath: string, partialsDir: string, filePath: string): string | null {
    try {
      // Determine the actual file path
      let includeFilePath = includePath

      // If it doesn't end with .stx, add the extension
      if (!includePath.endsWith('.stx')) {
        includeFilePath = `${includePath}.stx`
      }

      // Normalize the partials directory and template directory for comparison
      const normalizedPartialsDir = path.resolve(partialsDir)
      const templateDir = path.resolve(path.dirname(filePath))

      let resolvedPath: string

      // If it's a relative path without ./ or ../, assume it's in the partials directory
      if (!includeFilePath.startsWith('./') && !includeFilePath.startsWith('../')) {
        resolvedPath = path.resolve(partialsDir, includeFilePath)
      }
      else {
        // Otherwise, resolve from the current template directory
        resolvedPath = path.resolve(templateDir, includeFilePath)
      }

      // Normalize the resolved path
      const normalizedResolvedPath = path.normalize(resolvedPath)

      // Security: Prevent path traversal attacks
      // The resolved path must be within the partials directory or the template directory
      const isWithinPartialsDir = normalizedResolvedPath.startsWith(normalizedPartialsDir + path.sep)
        || normalizedResolvedPath === normalizedPartialsDir
      const isWithinTemplateDir = normalizedResolvedPath.startsWith(templateDir + path.sep)
        || normalizedResolvedPath === templateDir

      if (!isWithinPartialsDir && !isWithinTemplateDir) {
        console.error(`Security: Path traversal attempt blocked for include path: ${includePath}`)
        console.error(`  Resolved to: ${normalizedResolvedPath}`)
        console.error(`  Allowed dirs: ${normalizedPartialsDir}, ${templateDir}`)
        return null
      }

      return normalizedResolvedPath
    }
    catch (error) {
      console.error(`Error resolving path ${includePath}: ${error}`)
      return null
    }
  }

  // Add current file to include stack for circular detection
  // Use resolved absolute path for accurate tracking across recursive calls
  const currentFilePath = path.resolve(filePath)
  includeStack.add(currentFilePath)

  // Define a helper function to process a single include
  async function processIncludeHelper(includePath: string, localVars: Record<string, any> = {}, templateStr: string, offsetPos: number): Promise<string> {
    // Get resolved path first to check for circular includes
    const includeFilePath = resolvePath(includePath, partialsDir, filePath)
    if (!includeFilePath) {
      return createDetailedErrorMessage(
        'Include',
        `Could not resolve path for include: ${includePath}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }

    // Check for circular includes using resolved absolute path
    const resolvedIncludePath = path.resolve(includeFilePath)
    if (includeStack.has(resolvedIncludePath)) {
      // Build the include chain for a helpful error message
      const chain = [...includeStack, resolvedIncludePath].map(p => path.basename(p)).join(' -> ')
      return createDetailedErrorMessage(
        'Include',
        `Circular include detected: ${chain}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }

    try {
      // Path already resolved above, no need to resolve again
      if (!includeFilePath) {
        return createDetailedErrorMessage(
          'Include',
          `Could not resolve path for include: ${includePath}`,
          filePath,
          templateStr,
          offsetPos,
        )
      }

      // Track dependency
      dependencies.add(includeFilePath)

      // Check if the partial is cached
      let partialContent = partialsCache.get(includeFilePath)

      if (!partialContent) {
        // Read the file
        try {
          partialContent = await Bun.file(includeFilePath).text()
          // Cache for future use
          partialsCache.set(includeFilePath, partialContent)
        }
        catch (error: any) {
          return createDetailedErrorMessage(
            'Include',
            `Error loading include file ${includePath}: ${error.message}`,
            filePath,
            templateStr,
            offsetPos,
          )
        }
      }

      // Create a new context with local variables
      // Make sure parent variables are accessible in includes
      const includeContext = { ...context }

      // Add local variables to the context, ensuring array references are preserved
      for (const [key, value] of Object.entries(localVars)) {
        includeContext[key] = value
      }

      // Process the partial content
      // Process any nested includes first, passing the includeStack for circular detection
      if (partialContent.includes('@include') || partialContent.includes('@partial')) {
        partialContent = await processIncludes(partialContent, includeContext, includeFilePath, options, dependencies, includeStack)
      }

      // Process loops first to handle array iterations
      const { processLoops } = await import('./loops')
      let processedContent = processLoops(partialContent, includeContext, includeFilePath)

      // Process conditionals
      processedContent = processConditionals(processedContent, includeContext, includeFilePath)

      // Process expressions
      processedContent = processExpressions(processedContent, includeContext, includeFilePath)

      return processedContent
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Include',
        `Error processing include ${includePath}: ${error.message}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }
  }

  // Find all includes in the template
  const includeRegex = /@include\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g
  let match

  // We need to be careful with the regex to avoid an infinite loop
  // eslint-disable-next-line no-cond-assign
  while (match = includeRegex.exec(output)) {
    const [fullMatch, includePath, varsString] = match
    const matchOffset = match.index
    let localVars: Record<string, unknown> = {}

    // Parse local variables if provided using safe evaluation
    if (varsString) {
      try {
        localVars = safeEvaluateObject(varsString, context)
      }
      catch (error: any) {
        output = output.replace(
          fullMatch,
          createDetailedErrorMessage(
            'Include',
            `Error parsing include variables for ${includePath}: ${error.message}`,
            filePath,
            template,
            matchOffset,
          ),
        )
        continue
      }
    }

    // Process the include
    const processedContent = await processIncludeHelper(includePath, localVars, template, matchOffset)

    // Replace in the output
    output = output.replace(fullMatch, processedContent)

    // Reset regex index to start from the beginning
    // since we've modified the string
    includeRegex.lastIndex = 0
  }

  return output
}

// =============================================================================
// Stack Directives
// =============================================================================

/**
 * Process @push and @prepend directives to collect content into named stacks.
 *
 * This function extracts stack content and removes the directives from output.
 * The collected content is stored in the `stacks` object for later rendering.
 *
 * @param template - The template string to process
 * @param stacks - Object to collect stack content (mutated)
 * @returns Template with @push/@prepend directives removed
 *
 * @example
 * ```typescript
 * const stacks: Record<string, string[]> = {}
 * const result = processStackPushDirectives(`
 *   @push('scripts')
 *     <script src="app.js"></script>
 *   @endpush
 *   <div>Content</div>
 * `, stacks)
 * // result = '\n  <div>Content</div>\n'
 * // stacks = { scripts: ['<script src="app.js"></script>'] }
 * ```
 */
export function processStackPushDirectives(template: string, stacks: Record<string, string[]>): string {
  let result = template

  // Process @push directives
  result = result.replace(/@push\(['"]([^'"]+)['"]\)([\s\S]*?)@endpush/g, (match, name, content) => {
    if (!stacks[name]) {
      stacks[name] = []
    }

    // Add content to the end of the stack
    stacks[name].push(content)

    // Remove the directive from the output
    return ''
  })

  // Process @prepend directives
  result = result.replace(/@prepend\(['"]([^'"]+)['"]\)([\s\S]*?)@endprepend/g, (match, name, content) => {
    if (!stacks[name]) {
      stacks[name] = []
    }

    // Add content to the beginning of the stack
    stacks[name].unshift(content)

    // Remove the directive from the output
    return ''
  })

  return result
}

/**
 * Process @stack directives by replacing them with collected stack content.
 *
 * This should be called AFTER `processStackPushDirectives` has collected
 * all @push and @prepend content.
 *
 * @param template - The template string with @stack directives
 * @param stacks - Object containing collected stack content
 * @returns Template with @stack directives replaced by their content
 *
 * @example
 * ```typescript
 * const stacks = {
 *   scripts: ['<script src="a.js"></script>', '<script src="b.js"></script>'],
 *   styles: ['<link rel="stylesheet" href="app.css">']
 * }
 * const result = processStackReplacements(`
 *   <head>@stack('styles')</head>
 *   <body>...@stack('scripts')</body>
 * `, stacks)
 * ```
 */
export function processStackReplacements(template: string, stacks: Record<string, string[]>): string {
  // Replace @stack directives with their content
  return template.replace(/@stack\(['"]([^'"]+)['"]\)/g, (match, name) => {
    // No content? Return empty string
    if (!stacks[name] || stacks[name].length === 0) {
      return ''
    }

    // Join all stack entries with newlines to preserve formatting
    return stacks[name].join('\n')
  })
}
