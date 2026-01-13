import type { StxOptions } from './types'
import path from 'node:path'
import { processA11yDirectives } from './a11y'
import { processTemplateBindings } from './reactive-bindings'
import { injectAnalytics } from './analytics'
import { processAnimationDirectives } from './animation'
import { processEventDirectives } from './events'
import { processReactiveDirectives } from './reactive'
import { processMarkdownFileDirectives } from './assets'
import { processAuthDirectives, processConditionals, processEnvDirective, processIssetEmptyDirectives } from './conditionals'
import { injectCspMetaTag, processCspDirectives } from './csp'
import { processCsrfDirectives } from './csrf'
import { processCustomDirectives } from './custom-directives'
import { devHelpers, errorLogger, errorRecovery, safeExecuteAsync, StxRuntimeError } from './error-handling'
import { processExpressions } from './expressions'
import { processBasicFormDirectives, processErrorDirective } from './forms'
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
import { renderComponentWithSlot, resolveTemplatePath } from './utils'
import { runComposers } from './view-composers'

// =============================================================================
// DIRECTIVE PROCESSING ORDER
// =============================================================================
//
// The order in which directives are processed is CRITICAL for correct template
// rendering. Directives are processed in a specific sequence to ensure that:
//
// 1. Variables are defined before they're used
// 2. Layouts are resolved before content directives
// 3. Loop variables are available within conditionals
// 4. Expressions are evaluated after all directives generate their output
//
// PROCESSING ORDER (processDirectivesInternal):
// ---------------------------------------------
// Phase 1: Pre-processing
//   1. Remove comments: {{-- ... --}}
//   2. Process escaped directives: @@ -> @
//   3. Process escaped expressions: @{{ }} -> {{ }}
//   4. Process @push/@prepend (collect stack content)
//
// Phase 2: Layout Resolution
//   5. Extract @layout/@extends directive (layout path)
//   6. Extract @section directives (including @parent handling)
//   7. Replace @yield and {{ slot }} with section content
//   8. Replace @stack with collected content
//   9. If layout exists: recursively process layout with sections
//
// Phase 3: Directive Processing (processOtherDirectives):
//   10. Run view composers
//   11. Run pre-processing middleware
//   12. @js, @ts directives (FIRST - defines variables for other directives)
//   13. Custom directives (user-registered)
//   14. @component directives
//   15. Custom element components (PascalCase/kebab-case tags)
//   16. @transition, @animationGroup, etc.
//   17. @route directives
//   18. @auth, @guest, @can, @cannot directives
//   19. @csrf directives
//   20. @method directives
//   21. @include, @partial, @includeIf, etc.
//   22. @foreach, @for, @while, @forelse (BEFORE conditionals)
//   23. @if, @unless, @switch (AFTER loops - loop vars in scope)
//   24. @isset, @empty directives
//   25. @env, @production, @development, etc.
//   26. @form directives
//   27. @error directives
//   28. @markdown file directives
//   29. @markdown block directives
//   30. @translate, @t directives
//   31. @a11y, @screenReader directives
//   32. @meta, @seo, @structuredData directives
//   33. @json directive
//   34. @once directive
//   35. @click, @keydown, etc. (Alpine-style event directives)
//   36. x-data, x-model, x-show, etc. (Alpine-style reactive directives)
//   37. {{ }} expressions (LAST - after all directive output)
//   38. Run post-processing middleware
//   39. Auto-inject SEO tags (if enabled)
//
// IMPORTANT: Changing this order may break template rendering!
// =============================================================================

// =============================================================================
// ASYNC/SYNC FUNCTION CONVENTION
// =============================================================================
//
// Directive processors follow this convention:
//
// ASYNC functions (return Promise<string>):
//   - Functions that perform or MAY perform I/O operations (file reads, network)
//   - Functions that call other async functions
//   - Examples: processIncludes, processMarkdownDirectives, processJsDirectives
//
// SYNC functions (return string):
//   - Pure transformation functions with no I/O
//   - Functions that only manipulate strings/data in memory
//   - Examples: processConditionals, processLoops, processExpressions
//
// CALLING CONVENTION:
//   - All processors can be awaited safely (awaiting a sync function works)
//   - Use `await` consistently in processOtherDirectives for clarity
//   - New directive processors should be async if they might need I/O in the future
//
// RATIONALE:
//   - Async functions can call sync functions, but not vice versa
//   - Keeping I/O-capable functions async allows for future extensibility
//   - Sync functions are kept sync for performance (no promise overhead)
//
// =============================================================================

/**
 * Convert PascalCase to kebab-case with proper handling of consecutive uppercase letters.
 *
 * Examples:
 * - `UserCard` → `user-card`
 * - `XMLParser` → `xml-parser` (not `x-m-l-parser`)
 * - `HTMLElement` → `html-element`
 * - `MyURLParser` → `my-url-parser`
 * - `IOStream` → `io-stream`
 *
 * The algorithm:
 * 1. Insert hyphen before uppercase letters that follow lowercase letters
 * 2. Insert hyphen before the last uppercase in a sequence of uppercase letters (before lowercase)
 * 3. Convert to lowercase
 */
function pascalToKebab(str: string): string {
  return str
    // Insert hyphen between lowercase and uppercase: userCard → user-Card
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    // Insert hyphen between consecutive uppercase and lowercase: XMLParser → XML-Parser
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase()
}

/**
 * Parse HTML/JSX-like attributes from a string.
 *
 * Properly handles:
 * - Simple attributes: `name="value"`
 * - Boolean attributes: `disabled`
 * - Dynamic values: `prop="{{ expr }}"` (evaluated at SSR)
 * - Attributes with `=` in values: `url="https://example.com?a=1&b=2"`
 * - Single and double quoted values
 * - Escaped quotes within values
 *
 * ## Dynamic Data Syntax
 *
 * Use `{{ }}` for all dynamic data interpolation:
 * ```html
 * <Component title="{{ pageTitle }}" count="{{ items.length }}" />
 * <div class="{{ isActive ? 'active' : '' }}">{{ content }}</div>
 * ```
 *
 * ## Event Syntax (Alpine-style)
 *
 * ```html
 * <button @click="handleClick()">Click me</button>
 * <form @submit.prevent="handleSubmit()">...</form>
 * <input @keydown.enter="send()" @keydown.escape="cancel()">
 * ```
 *
 * @param attributesStr - The attributes portion of a tag (between tag name and closing)
 * @returns Array of parsed attributes with name and value
 */
interface ParsedAttribute {
  name: string
  value: string | true // true for boolean attributes
}

/**
 * Component tag match result
 */
interface ComponentTagMatch {
  fullMatch: string
  tagName: string
  attributes: string
  content: string
  startIndex: number
  endIndex: number
  isSelfClosing: boolean
}

/**
 * Find component tags in HTML, properly handling quoted strings
 * This solves the issue where `>` inside attribute values would incorrectly end the tag
 *
 * @param html - The HTML string to search
 * @param tagPattern - Regex pattern for tag name (for PascalCase components)
 * @param skipTags - Optional set of tag names to skip (for HTML tags)
 * @returns Array of found component tags
 */
function findComponentTags(html: string, tagPattern: RegExp, skipTags?: Set<string>): ComponentTagMatch[] {
  const matches: ComponentTagMatch[] = []
  let pos = 0

  while (pos < html.length) {
    // Find the start of a potential tag
    const tagStart = html.indexOf('<', pos)
    if (tagStart === -1)
      break

    // Check if this matches our tag pattern
    const afterLt = html.slice(tagStart + 1)
    const tagNameMatch = afterLt.match(new RegExp(`^(${tagPattern.source})`))

    if (!tagNameMatch) {
      pos = tagStart + 1
      continue
    }

    const tagName = tagNameMatch[1]

    // Skip HTML tags - only advance past the opening tag, not the content
    if (skipTags && skipTags.has(tagName.toLowerCase())) {
      // Find the end of just the opening tag
      let currentPos = tagStart + 1 + tagName.length
      while (currentPos < html.length && html[currentPos] !== '>') {
        currentPos++
      }
      pos = currentPos + 1 // Move past the '>'
      continue
    }

    let currentPos = tagStart + 1 + tagName.length

    // Now find the end of this tag, respecting quoted strings
    let inQuote: string | null = null
    let attributesStart = currentPos
    let tagEnd = -1
    let isSelfClosing = false

    while (currentPos < html.length) {
      const char = html[currentPos]

      // Handle quote state
      if (inQuote) {
        if (char === '\\' && currentPos + 1 < html.length) {
          // Skip escaped character
          currentPos += 2
          continue
        }
        if (char === inQuote) {
          inQuote = null
        }
        currentPos++
        continue
      }

      // Not in quote - check for quote start
      if (char === '"' || char === '\'') {
        inQuote = char
        currentPos++
        continue
      }

      // Check for self-closing tag end
      if (char === '/' && currentPos + 1 < html.length && html[currentPos + 1] === '>') {
        tagEnd = currentPos + 2
        isSelfClosing = true
        break
      }

      // Check for tag end
      if (char === '>') {
        tagEnd = currentPos + 1
        break
      }

      currentPos++
    }

    if (tagEnd === -1) {
      pos = tagStart + 1
      continue
    }

    const attributes = html.slice(attributesStart, isSelfClosing ? tagEnd - 2 : tagEnd - 1).trim()

    if (isSelfClosing) {
      matches.push({
        fullMatch: html.slice(tagStart, tagEnd),
        tagName,
        attributes,
        content: '',
        startIndex: tagStart,
        endIndex: tagEnd,
        isSelfClosing: true,
      })
      pos = tagEnd
    }
    else {
      // Find the closing tag
      const closingTag = `</${tagName}>`
      let contentEnd = html.indexOf(closingTag, tagEnd)

      if (contentEnd === -1) {
        // No closing tag found, treat as self-closing or skip
        pos = tagEnd
        continue
      }

      const content = html.slice(tagEnd, contentEnd)
      const fullEndIndex = contentEnd + closingTag.length

      matches.push({
        fullMatch: html.slice(tagStart, fullEndIndex),
        tagName,
        attributes,
        content,
        startIndex: tagStart,
        endIndex: fullEndIndex,
        isSelfClosing: false,
      })
      pos = fullEndIndex
    }
  }

  return matches
}

/**
 * Parse multiline attributes from a component tag
 * Handles HTML content inside attribute values correctly
 *
 * @param attributesStr - The attributes string (may be multiline)
 * @returns Object mapping attribute names to values
 */
function parseMultilineAttributes(attributesStr: string): Record<string, string> {
  const props: Record<string, string> = {}
  let pos = 0
  const len = attributesStr.length

  while (pos < len) {
    // Skip whitespace (including newlines)
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    if (pos >= len)
      break

    // Read attribute name
    let name = ''
    while (pos < len && !/[\s=]/.test(attributesStr[pos])) {
      name += attributesStr[pos]
      pos++
    }

    if (!name)
      break

    // Skip @ event attributes (handled by event processing)
    if (name.startsWith('@')) {
      // Skip to next attribute
      while (pos < len && attributesStr[pos] !== '"' && attributesStr[pos] !== '\'') {
        pos++
      }
      if (pos < len) {
        const quote = attributesStr[pos]
        pos++
        while (pos < len && attributesStr[pos] !== quote) {
          if (attributesStr[pos] === '\\') pos++
          pos++
        }
        pos++
      }
      continue
    }

    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    // Check for = sign
    if (pos < len && attributesStr[pos] === '=') {
      pos++ // Skip =

      // Skip whitespace after =
      while (pos < len && /\s/.test(attributesStr[pos])) {
        pos++
      }

      // Read value
      let value = ''
      if (pos < len && (attributesStr[pos] === '"' || attributesStr[pos] === '\'')) {
        const quote = attributesStr[pos]
        pos++ // Skip opening quote

        // Read until closing quote, handling escapes
        while (pos < len) {
          const char = attributesStr[pos]

          if (char === '\\' && pos + 1 < len) {
            // Handle escape sequence - include the escaped character
            pos++
            value += attributesStr[pos]
            pos++
            continue
          }

          if (char === quote) {
            pos++ // Skip closing quote
            break
          }

          value += char
          pos++
        }
      }
      else {
        // Unquoted value (read until whitespace)
        while (pos < len && !/\s/.test(attributesStr[pos])) {
          value += attributesStr[pos]
          pos++
        }
      }

      props[name] = value
    }
    else {
      // Boolean attribute
      props[name] = 'true'
    }
  }

  return props
}

function parseAttributes(attributesStr: string): ParsedAttribute[] {
  const attributes: ParsedAttribute[] = []
  let pos = 0
  const len = attributesStr.length

  while (pos < len) {
    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    if (pos >= len)
      break

    // Read attribute name (until = or whitespace or end)
    let name = ''
    while (pos < len && !/[\s=]/.test(attributesStr[pos])) {
      name += attributesStr[pos]
      pos++
    }

    if (!name)
      break

    // Skip whitespace
    while (pos < len && /\s/.test(attributesStr[pos])) {
      pos++
    }

    // Check for = sign
    if (pos < len && attributesStr[pos] === '=') {
      pos++ // Skip =

      // Skip whitespace after =
      while (pos < len && /\s/.test(attributesStr[pos])) {
        pos++
      }

      // Read value
      let value = ''
      if (pos < len && (attributesStr[pos] === '"' || attributesStr[pos] === '\'')) {
        const quote = attributesStr[pos]
        pos++ // Skip opening quote

        // Read until closing quote, handling escapes
        while (pos < len && attributesStr[pos] !== quote) {
          if (attributesStr[pos] === '\\' && pos + 1 < len) {
            // Handle escape sequence
            pos++
            value += attributesStr[pos]
          }
          else {
            value += attributesStr[pos]
          }
          pos++
        }
        pos++ // Skip closing quote
      }
      else {
        // Unquoted value (read until whitespace)
        while (pos < len && !/\s/.test(attributesStr[pos])) {
          value += attributesStr[pos]
          pos++
        }
      }

      attributes.push({ name, value })
    }
    else {
      // Boolean attribute (no value)
      attributes.push({ name, value: true })
    }
  }

  return attributes
}

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
  try {
    return await performanceMonitor.timeAsync('template-processing', async () => {
      return await processDirectivesInternal(template, context, filePath, options, dependencies)
    })
  }
  catch (error: unknown) {
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
  const resolvedOptions = { ...options }
  const projectRoot = process.cwd()
  if (resolvedOptions.partialsDir && !path.isAbsolute(resolvedOptions.partialsDir)) {
    resolvedOptions.partialsDir = path.resolve(projectRoot, resolvedOptions.partialsDir)
  }
  if (resolvedOptions.componentsDir && !path.isAbsolute(resolvedOptions.componentsDir)) {
    resolvedOptions.componentsDir = path.resolve(projectRoot, resolvedOptions.componentsDir)
  }

  let output = template

  // First, remove all comments
  output = output.replace(/\{\{--[\s\S]*?--\}\}/g, '')

  // Process escaped @@ directives (convert @@ to @)
  output = output.replace(/@@/g, '@')

  // Process escaped @{{ }} expressions before other directives
  output = output.replace(/@\{\{([\s\S]*?)\}\}/g, (_, content) => {
    return `{{ ${content} }}`
  })

  // Store stacks for @push/@stack directives
  const stacks: Record<string, string[]> = {}

  // Process @push and @prepend directives first
  output = processStackPushDirectives(output, stacks)

  // Process sections and yields before includes
  // Start with any sections passed in from context (e.g., from parent layout)
  const sections: Record<string, string> = { ...(context.__sections || {}) }
  let layoutPath = ''

  // Extract layout if used (@layout or @extends)
  const layoutMatch = output.match(/@(?:layout|extends)\(\s*['"]([^'"]+)['"]\s*\)/)
  if (layoutMatch) {
    layoutPath = layoutMatch[1]
    // Remove the @layout/@extends directive from the template
    output = output.replace(/@(?:layout|extends)\(\s*['"]([^'"]+)['"]\s*\)/, '')
  }

  // Extract sections
  output = output.replace(/@section\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)([\s\S]*?)(?:@endsection|@show)/g, (match, name, value, content) => {
    // If single line section with value
    if (value) {
      sections[name] = value
      return ''
    }

    // Process @parent directive in sections
    if (content.includes('@parent')) {
      // Store with parent placeholder to be replaced when inserted
      sections[name] = content.replace('@parent', '<!--PARENT_CONTENT_PLACEHOLDER-->')
    }
    else {
      // Multi-line section without @parent
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
  output = output.replace(/\{\{\s*slot\s*\}\}/g, () => {
    return sections.content || ''
  })

  // Replace @stack directives with their content
  output = processStackReplacements(output, stacks)

  // Load and process the layout if one was specified
  if (layoutPath) {
    try {
      if (resolvedOptions.debug) {
        console.log(`Processing layout: ${layoutPath} for file ${filePath}`)
      }

      const layoutFullPath = await safeExecuteAsync(
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

      if (!layoutFullPath) {
        const warning = `Layout not found: ${layoutPath} (referenced from ${filePath})`
        console.warn(warning)

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
          if (sections[name] && sections[name].includes('<!--PARENT_CONTENT_PLACEHOLDER-->')) {
            sections[name] = sections[name].replace('<!--PARENT_CONTENT_PLACEHOLDER-->', content)
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
      // First process pushes and stacks in the layout
      let processedLayout = processStackPushDirectives(layoutContent, stacks)

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
          if (sectionContent.includes('<!--PARENT_CONTENT_PLACEHOLDER-->')) {
            sectionContent = sectionContent.replace('<!--PARENT_CONTENT_PLACEHOLDER-->', layoutSections[sectionName] || '')
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

      // Process the fully combined layout content with all other directives
      output = await processOtherDirectives(processedLayout, context, layoutFullPath, resolvedOptions, dependencies)
      return output
    }
    catch (error) {
      console.error(`Error processing layout ${layoutPath}:`, error)
      return `[Error processing layout: ${error instanceof Error ? error.message : String(error)}]`
    }
  }

  // If no layout, process all other directives
  return await processOtherDirectives(output, context, filePath, resolvedOptions, dependencies)
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

  // Run view composers for the current view with error handling
  await safeExecuteAsync(
    () => runComposers(filePath, context),
    undefined,
    (error) => {
      if (options.debug) {
        console.warn(`View composer error for ${filePath}:`, error.message)
      }
    },
  )

  // Add options to context for component processing
  context.__stx_options = options

  // Run pre-processing middleware with error handling
  output = await safeExecuteAsync(
    () => runPreProcessingMiddleware(output, context, filePath, options),
    output,
    (error) => {
      if (options.debug) {
        console.warn(`Pre-processing middleware error:`, error.message)
      }
    },
  )

  // Extract variables from <script server> tags (SFC support)
  // Only scripts with explicit 'server' attribute are executed server-side
  // All other scripts (no attribute, 'client', 'type="module"', 'src=') are client-side
  const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
  let scriptMatch: RegExpExecArray | null
  while ((scriptMatch = scriptRegex.exec(output)) !== null) {
    const attrs = scriptMatch[1]
    const scriptContent = scriptMatch[2]

    // Only process scripts with explicit 'server' attribute
    // This prevents executing client-side code (document, window, etc.) on the server
    const isServerScript = /\bserver\b/.test(attrs)
    if (isServerScript && scriptContent.trim()) {
      try {
        const { extractVariables } = await import('./variable-extractor')
        await extractVariables(scriptContent, context, filePath)
      }
      catch (e) {
        // Script may contain browser-only code, skip
        if (options.debug) {
          console.warn('Script extraction error:', e)
        }
      }
    }
  }

  // Process JS/TS directives FIRST - these define variables needed by other directives
  // These execute server-side code and populate the context with variables
  output = await processJsDirectives(output, context, filePath)
  output = await processTsDirectives(output, context, filePath)

  // Process @import directives for explicit component imports
  output = await processImportDirectives(output, context, filePath, options, dependencies)

  // Process custom directives
  output = await processCustomDirectives(output, context, filePath, options)

  // Process component directives
  if (options.componentsDir) {
    // Process @component directives
    output = await processComponentDirectives(output, context, filePath, options.componentsDir, options, dependencies)

    // Process custom element components (kebab-case and PascalCase tags)
    output = await processCustomElements(output, context, filePath, options.componentsDir, options, dependencies)
  }

  // Process animations and transitions
  output = processAnimationDirectives(output, context, filePath, options)

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
  resetHead() // Reset head state for each page
  const headResult = processHeadDirective(output)
  output = headResult.content
  output = processTitleDirective(output, context)
  output = processMetaDirective(output, context)

  // Process @ref attributes for DOM references
  output = processRefAttributes(output)

  // Process route directives
  output = processRouteDirectives(output)

  // Process authentication directives
  output = processAuthDirectives(output, context)

  // Process CSRF directives
  output = processCsrfDirectives(output)

  // Process method spoofing directives
  output = processMethodDirectives(output)

  // Process includes (@include, @component, etc.)
  output = await processIncludes(output, context, filePath, options, dependencies)

  // Process loops (@foreach, @for, etc.) - BEFORE conditionals to handle nested scope properly
  output = processLoops(output, context, filePath, options)

  // Process conditionals (@if, @unless, etc.) - AFTER loops to allow loop variables in scope
  output = processConditionals(output, context, filePath)

  // Process isset/empty directives
  output = processIssetEmptyDirectives(output, context)

  // Process env directive
  output = processEnvDirective(output, context)

  // Process form directives
  output = processBasicFormDirectives(output, context)

  // Process error directive
  output = processErrorDirective(output, context)

  // Note: JS/TS directives are processed at the beginning of processOtherDirectives
  // to ensure variables are available for conditionals, loops, and expressions

  // Process markdown files - new directive for including .md files with frontmatter
  output = await processMarkdownFileDirectives(output, context, filePath, options)

  // Process markdown directives (@markdown)
  output = await processMarkdownDirectives(output, context, filePath)

  // Process translate directives (@translate, @t)
  output = await processTranslateDirective(output, context, filePath, options)

  // Process accessibility directives (@a11y, @screenReader)
  output = processA11yDirectives(output, context, filePath, options)

  // Process SEO directives (@meta, @seo, @structuredData)
  output = processMetaDirectives(output, context, filePath, options)
  output = processStructuredData(output, context, filePath)
  output = processSeoDirective(output, context, filePath, options)

  // Process CSP directives (@csp, @cspNonce)
  output = processCspDirectives(output, context, filePath, options)

  // Process @json directive
  output = processJsonDirective(output, context)

  // Process @once directive
  output = processOnceDirective(output)

  // Process event directives (@click, @keydown.enter, etc.) - Alpine-style events
  output = processEventDirectives(output, context, filePath)

  // Process reactive directives (x-data, x-model, x-show, etc.) - Alpine-style reactivity
  output = processReactiveDirectives(output, context, filePath)

  // Process expressions now (delayed to allow other directives to generate expressions)
  output = await processExpressions(output, context, filePath)

  // Process reactive bindings (:class, :text, stx-class, stx-bind:class, etc.)
  // This generates client-side JS for store-aware reactive updates
  output = processTemplateBindings(output)

  // Process x-element directives (x-data, x-model, x-text, etc.)
  // Injects lightweight reactivity runtime for two-way binding
  const { processXElementDirectives } = await import('./x-element')
  output = processXElementDirectives(output)

  // Run post-processing middleware
  output = await runPostProcessingMiddleware(output, context, filePath, options)

  // Auto-inject SEO tags if enabled
  if (options.seo?.enabled) {
    output = injectSeoTags(output, context, options)
  }

  // Inject rendered head content from useHead/useSeoMeta calls
  const { renderHead, getHead } = await import('./head')
  const headConfig = getHead()
  if (headConfig.title || headConfig.meta?.length || headConfig.link?.length) {
    const renderedHead = renderHead()
    if (renderedHead) {
      // Inject before </head> or at start of document
      if (output.includes('</head>')) {
        output = output.replace('</head>', `${renderedHead}\n</head>`)
      } else if (output.includes('<head>')) {
        output = output.replace('<head>', `<head>\n${renderedHead}`)
      }
    }
  }

  // Also inject head content from @head directive blocks
  if (headResult.headContent) {
    if (output.includes('</head>')) {
      output = output.replace('</head>', `${headResult.headContent}\n</head>`)
    } else if (output.includes('<head>')) {
      output = output.replace('<head>', `<head>\n${headResult.headContent}`)
    }
  }

  // Auto-inject CSP meta tag if enabled
  if (options.csp?.enabled && options.csp.addMetaTag) {
    output = injectCspMetaTag(output, options.csp as any, context)
  }

  // Auto-inject analytics if enabled
  if (options.analytics?.enabled) {
    output = injectAnalytics(output, options)
  }

  // Auto-inject PWA tags if enabled
  if (options.pwa?.enabled && options.pwa.autoInject !== false) {
    const { injectPwaTags } = await import('./pwa/inject')
    output = injectPwaTags(output, options)
  }

  // Strip server-only scripts (marked with 'server' attribute)
  // These are used for SSR variable extraction and shouldn't appear in client output
  output = output.replace(/<script\s+server\b[^>]*>[\s\S]*?<\/script>\s*/gi, '')

  // Transform @stores imports in client scripts
  // import { appStore } from '@stores' → const appStore = window.__STX_STORES__.appStore;
  output = output.replace(/<script\s+client\b([^>]*)>([\s\S]*?)<\/script>/gi, (_match, attrs, content) => {
    const { transformStoreImports } = require('./state-management')
    const transformedContent = transformStoreImports(content)
    return `<script${attrs}>${transformedContent}</script>`
  })

  // Clean up client attribute from script tags (it's not valid HTML)
  // Transform <script client> to <script>
  output = output.replace(/<script\s+client\b([^>]*)>/gi, '<script$1>')

  return output
}

/**
 * Process @import directives for explicit component imports
 *
 * Syntax:
 *   @import('components/Card')
 *   @import('ui/Button', 'ui/Modal')
 *   @import('Card', 'Button', 'Modal')
 *
 * This allows explicit importing of components from any path,
 * overriding the auto-import from the components directory.
 */
async function processImportDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Initialize imported components registry in context
  if (!context.__importedComponents) {
    context.__importedComponents = new Map<string, string>()
  }
  const importedComponents = context.__importedComponents as Map<string, string>

  // Match @import('path') or @import('path1', 'path2', ...)
  const importRegex = /@import\s*\(\s*([^)]+)\s*\)/g
  let match

  while ((match = importRegex.exec(output)) !== null) {
    const [fullMatch, pathsString] = match

    // Parse the paths (handle quoted strings separated by commas)
    const paths = pathsString
      .split(',')
      .map(p => p.trim().replace(/^['"]|['"]$/g, ''))
      .filter(p => p.length > 0)

    for (const componentPath of paths) {
      // Get the component name from the path (last segment)
      const segments = componentPath.split('/')
      const fileName = segments[segments.length - 1]
      // Remove .stx extension if present, convert to PascalCase for matching
      const baseName = fileName.replace(/\.stx$/, '')
      const componentName = baseName.includes('-')
        ? baseName.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')
        : baseName.charAt(0).toUpperCase() + baseName.slice(1)

      // Resolve the full path
      let resolvedPath: string | null = null

      // Try different resolution strategies
      const possiblePaths = [
        // Relative to current file
        path.resolve(path.dirname(filePath), `${componentPath}.stx`),
        path.resolve(path.dirname(filePath), componentPath),
        // Relative to components dir
        path.resolve(options.componentsDir || 'components', `${componentPath}.stx`),
        path.resolve(options.componentsDir || 'components', componentPath),
        // Absolute path
        componentPath.endsWith('.stx') ? componentPath : `${componentPath}.stx`,
      ]

      for (const tryPath of possiblePaths) {
        try {
          const stat = await Bun.file(tryPath).exists()
          if (stat) {
            resolvedPath = tryPath
            break
          }
        }
        catch {
          // Continue trying
        }
      }

      if (resolvedPath) {
        // Register the component for both PascalCase and kebab-case usage
        importedComponents.set(componentName, resolvedPath)
        importedComponents.set(baseName, resolvedPath)
        importedComponents.set(baseName.toLowerCase(), resolvedPath)
        // Also register kebab-case version
        const kebabCase = componentName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
        importedComponents.set(kebabCase, resolvedPath)

        // Track as dependency
        dependencies.add(resolvedPath)

        if (options.debug) {
          console.log(`Imported component: ${componentName} -> ${resolvedPath}`)
        }
      }
      else if (options.debug) {
        console.warn(`Could not resolve imported component: ${componentPath}`)
      }
    }

    // Remove the @import directive from output
    output = output.replace(fullMatch, '')
  }

  return output
}

/**
 * Process @component directives
 */
async function processComponentDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Use shared processedComponents set from context to prevent infinite recursion
  // across nested processDirectives calls
  if (!context.__processedComponents) {
    context.__processedComponents = new Set<string>()
  }
  const processedComponents = context.__processedComponents as Set<string>

  // Find all component directives in the template
  const componentRegex = /@component\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g
  let match

  // eslint-disable-next-line no-cond-assign
  while (match = componentRegex.exec(output)) {
    const [fullMatch, componentPath, propsString] = match
    let props = {}

    // Parse props if provided
    if (propsString) {
      try {
        // eslint-disable-next-line no-new-func
        const propsFn = new Function(...Object.keys(context), `return ${propsString}`)
        props = propsFn(...Object.values(context))
      }
      catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        output = output.replace(fullMatch, `[Error parsing component props: ${msg}]`)
        continue
      }
    }

    // Process the component
    const processedContent = await renderComponentWithSlot(
      componentPath,
      props,
      '',
      componentsDir,
      context,
      filePath,
      options,
      processedComponents,
      dependencies,
    )

    // Replace in the output
    output = output.replace(fullMatch, processedContent)

    // Reset regex index to start from the beginning
    componentRegex.lastIndex = 0
  }

  return output
}

/**
 * Process custom element components (both kebab-case and PascalCase)
 * Uses a proper parser that handles HTML content inside attribute values
 */
async function processCustomElements(
  template: string,
  context: Record<string, any>,
  filePath: string,
  componentsDir: string,
  options: StxOptions,
  dependencies: Set<string>,
): Promise<string> {
  let output = template

  // Use shared processedComponents set from context to prevent infinite recursion
  // across nested processDirectives calls
  if (!context.__processedComponents) {
    context.__processedComponents = new Set<string>()
  }
  const processedComponents = context.__processedComponents as Set<string>

  // Standard HTML tags to exclude from component processing
  const htmlTags = new Set([
    'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio',
    'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button',
    'canvas', 'caption', 'cite', 'code', 'col', 'colgroup',
    'data', 'datalist', 'dd', 'del', 'details', 'dfn', 'dialog', 'div', 'dl', 'dt',
    'em', 'embed',
    'fieldset', 'figcaption', 'figure', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
    'i', 'iframe', 'img', 'input', 'ins',
    'kbd',
    'label', 'legend', 'li', 'link',
    'main', 'map', 'mark', 'menu', 'meta', 'meter',
    'nav', 'noscript',
    'object', 'ol', 'optgroup', 'option', 'output',
    'p', 'param', 'picture', 'pre', 'progress',
    'q',
    'rp', 'rt', 'ruby',
    's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'svg',
    'table', 'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track',
    'u', 'ul',
    'var', 'video',
    'wbr',
    // SVG elements
    'path', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse',
    'text', 'tspan', 'textPath',
    'g', 'defs', 'use', 'symbol', 'image',
    'clipPath', 'mask', 'pattern', 'marker',
    'linearGradient', 'radialGradient', 'stop',
    'filter', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
    'feDiffuseLighting', 'feDisplacementMap', 'feDropShadow', 'feFlood', 'feGaussianBlur',
    'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'feSpecularLighting',
    'feTile', 'feTurbulence', 'foreignObject',
    'animate', 'animateMotion', 'animateTransform', 'set', 'mpath',
    'desc', 'metadata', 'switch', 'view',
  ])

  // Process kebab-case components (e.g., <my-component />)
  const kebabPattern = /[a-z][a-z0-9]*-[a-z0-9-]*/
  output = await processComponentsWithParser(output, kebabPattern, false)

  // Process PascalCase components (e.g., <MyComponent />)
  const pascalPattern = /[A-Z][a-zA-Z0-9]*/
  output = await processComponentsWithParser(output, pascalPattern, true)

  // Process single-word lowercase components (e.g., <card />) - skip HTML tags
  const lowercasePattern = /[a-z][a-z0-9]*/
  output = await processComponentsWithParser(output, lowercasePattern, false, htmlTags)

  return output

  /**
   * Process components using the proper parser that handles quoted strings
   */
  async function processComponentsWithParser(html: string, tagPattern: RegExp, isPascalCase: boolean, skipTags?: Set<string>): Promise<string> {
    let result = html

    // Find all matching component tags (pass skipTags to avoid consuming HTML tag content)
    const tags = findComponentTags(result, tagPattern, skipTags)

    // Process from end to start to preserve indices
    for (let i = tags.length - 1; i >= 0; i--) {
      const tag = tags[i]

      // Convert the tag name to a component path
      const componentPath = isPascalCase
        ? pascalToKebab(tag.tagName)
        : tag.tagName

      // Parse attributes using the robust parser that handles HTML in values
      const rawProps = parseMultilineAttributes(tag.attributes)

      // Process props: evaluate {{ }} expressions and :prop="var" bindings
      const props: Record<string, unknown> = {}
      for (const [attrName, attrValue] of Object.entries(rawProps)) {
        // Skip @ event attributes - they're processed by processEventDirectives
        if (attrName.startsWith('@')) {
          continue
        }

        // Handle Vue-style :prop="expression" binding
        if (attrName.startsWith(':')) {
          const propName = attrName.slice(1) // Remove the : prefix
          try {
            // eslint-disable-next-line no-new-func
            const valueFn = new Function(...Object.keys(context), `return ${attrValue}`)
            props[propName] = valueFn(...Object.values(context))
          }
          catch (error) {
            if (options.debug) {
              console.error(`Error evaluating :${propName} binding:`, error)
            }
            props[propName] = attrValue // Fall back to string value
          }
          continue
        }

        // Check if value contains {{ }} expressions
        if (typeof attrValue === 'string' && attrValue.includes('{{') && attrValue.includes('}}')) {
          // Check if the entire value is a single expression: {{ expr }}
          const singleExprMatch = attrValue.match(/^\{\{\s*([\s\S]+?)\s*\}\}$/)
          if (singleExprMatch) {
            // Single expression - evaluate and use the result directly
            try {
              // eslint-disable-next-line no-new-func
              const valueFn = new Function(...Object.keys(context), `return ${singleExprMatch[1]}`)
              props[attrName] = valueFn(...Object.values(context))
            }
            catch (error) {
              if (options.debug) {
                console.error(`Error evaluating expression for ${attrName}:`, error)
              }
              props[attrName] = attrValue // Fall back to string value
            }
          }
          else {
            // Mixed content - interpolate expressions within the string
            let result = attrValue
            const exprPattern = /\{\{\s*([\s\S]+?)\s*\}\}/g
            let match
            while ((match = exprPattern.exec(attrValue)) !== null) {
              try {
                // eslint-disable-next-line no-new-func
                const valueFn = new Function(...Object.keys(context), `return ${match[1]}`)
                const evaluated = valueFn(...Object.values(context))
                result = result.replace(match[0], String(evaluated ?? ''))
              }
              catch (error) {
                if (options.debug) {
                  console.error(`Error evaluating expression in ${attrName}:`, error)
                }
              }
            }
            props[attrName] = result
          }
        }
        else {
          // Static attribute
          props[attrName] = attrValue
        }
      }

      // Process the component
      const processedContent = await renderComponentWithSlot(
        componentPath,
        props,
        tag.content,
        componentsDir,
        context,
        filePath,
        options,
        processedComponents,
        dependencies,
      )

      // Replace the tag with processed content
      result = result.substring(0, tag.startIndex) + processedContent + result.substring(tag.endIndex)
    }

    return result
  }

}

/**
 * Process @json directive to output JSON
 */
export function processJsonDirective(template: string, context: Record<string, any>): string {
  // Handle @json(data) and @json(data, pretty) directives
  return template.replace(/@json\(\s*([^,)]+)(?:,\s*(true|false))?\)/g, (match, dataPath, pretty) => {
    try {
      // Simple expression evaluation
      // eslint-disable-next-line no-new-func
      const evalFn = new Function(...Object.keys(context), `
        try { return ${dataPath.trim()}; } catch (e) { return undefined; }
      `)
      const data = evalFn(...Object.values(context))

      if (pretty === 'true') {
        return JSON.stringify(data, null, 2)
      }
      return JSON.stringify(data)
    }
    catch (error) {
      console.error(`Error processing @json directive: ${error}`)
      return match // Return unchanged if there's an error
    }
  })
}

/**
 * Process @once directive blocks
 */
export function processOnceDirective(template: string): string {
  // Use an ordered map to keep track of the first occurrence of each content
  const onceBlocks: Map<string, { content: string, index: number }> = new Map()

  // Find all @once/@endonce blocks with their positions
  const onceMatches: Array<{ match: string, content: string, start: number, end: number }> = []

  const regex = /@once\s*([\s\S]*?)@endonce/g
  let match = regex.exec(template)
  while (match !== null) {
    const fullMatch = match[0]
    const content = match[1]
    const start = match.index
    const end = start + fullMatch.length

    onceMatches.push({
      match: fullMatch,
      content: content.trim(), // Normalize content
      start,
      end,
    })

    match = regex.exec(template)
  }

  // Keep track of which blocks to keep (first occurrence) and which to remove
  const blocksToRemove: Set<number> = new Set()

  // Group blocks by their content
  for (let i = 0; i < onceMatches.length; i++) {
    const { content } = onceMatches[i]

    if (onceBlocks.has(content)) {
      // This is a duplicate, mark for removal
      blocksToRemove.add(i)
    }
    else {
      // This is the first occurrence, keep it
      onceBlocks.set(content, { content, index: i })
    }
  }

  // Build the result by removing duplicate blocks
  let result = template
  // Process in reverse order to not affect positions of earlier blocks
  const sortedMatchesToRemove = Array.from(blocksToRemove)
    .map(index => onceMatches[index])
    .sort((a, b) => b.start - a.start) // Sort in reverse order

  for (const { start, end } of sortedMatchesToRemove) {
    // Replace the block with empty string
    result = result.substring(0, start) + result.substring(end)
  }

  // Finally, remove all @once/@endonce tags, keeping the content
  result = result.replace(/@once\s*([\s\S]*?)@endonce/g, '$1')

  return result
}

/**
 * Process @ref attributes for DOM element references.
 *
 * Transforms:
 *   <input @ref="inputRef" />
 *
 * Into:
 *   <input data-ref="inputRef" />
 *
 * The client-side runtime will bind these to ref objects.
 */
function processRefAttributes(template: string): string {
  // Match @ref="name" attributes
  return template.replace(/@ref="([^"]+)"/g, 'data-ref="$1"')
}
