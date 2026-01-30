/**
 * Utility functions for the stx compiler
 *
 * This module provides core utilities for template processing.
 * Some functionality has been extracted to dedicated modules:
 *
 * - validator.ts - Template validation utilities
 * - variable-extractor.ts - Script variable extraction
 *
 * @module utils
 */

import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Import from expressions
import { processClientScript } from './client-script'
import { unescapeHtml } from './expressions'
import { LRUCache } from './performance-utils'
import { processDirectives } from './process'

// Re-export from extracted modules for backward compatibility
export {
  extractDirectiveNames,
  getPositionInfo,
  hasDirectives,
  validateDirective,
  validateTemplate,
} from './validator'
export type {
  TemplateValidationError,
  TemplateValidationResult,
} from './validator'
export {
  convertToCommonJS,
  extractScriptFromTemplate,
  extractVariables,
  hasVariables,
} from './variable-extractor'

// Cache for components to avoid repeated file reads (LRU with max 500 entries)
const componentsCache = new LRUCache<string, string>(500)

/**
 * Extract variable names from JavaScript code for scope registration
 * Only extracts TOP-LEVEL declarations, not variables inside nested functions
 */
function extractVariableNames(code: string): string[] {
  const names: string[] = []
  const seen = new Set<string>()

  // Track brace depth to only capture top-level declarations
  let depth = 0
  let i = 0
  const len = code.length

  // Skip string literals and track brace depth
  const skipString = (quote: string): void => {
    i++ // Skip opening quote
    while (i < len) {
      if (code[i] === '\\') {
        i += 2 // Skip escaped character
        continue
      }
      if (code[i] === quote) {
        i++ // Skip closing quote
        return
      }
      i++
    }
  }

  // Skip template literals (backticks) with nested expressions
  const skipTemplateLiteral = (): void => {
    i++ // Skip opening backtick
    while (i < len) {
      if (code[i] === '\\') {
        i += 2
        continue
      }
      if (code[i] === '`') {
        i++
        return
      }
      if (code[i] === '$' && code[i + 1] === '{') {
        i += 2
        let templateDepth = 1
        while (i < len && templateDepth > 0) {
          if (code[i] === '{') templateDepth++
          else if (code[i] === '}') templateDepth--
          else if (code[i] === '\'' || code[i] === '"') skipString(code[i])
          else if (code[i] === '`') skipTemplateLiteral()
          else i++
        }
        continue
      }
      i++
    }
  }

  // Skip comments
  const skipComment = (): boolean => {
    if (code[i] === '/' && code[i + 1] === '/') {
      // Single-line comment
      while (i < len && code[i] !== '\n') i++
      return true
    }
    if (code[i] === '/' && code[i + 1] === '*') {
      // Multi-line comment
      i += 2
      while (i < len - 1 && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      return true
    }
    return false
  }

  // Check for variable declaration at current position (only at depth 0)
  const checkDeclaration = (): void => {
    if (depth !== 0) return

    // Check for const/let/var declarations
    const declMatch = code.slice(i).match(/^(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/)
    if (declMatch) {
      const varName = declMatch[2]
      if (!seen.has(varName)) {
        names.push(varName)
        seen.add(varName)
      }
      return
    }

    // Check for function declarations
    const funcMatch = code.slice(i).match(/^function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (funcMatch) {
      const funcName = funcMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
      return
    }

    // Check for async function declarations
    const asyncMatch = code.slice(i).match(/^async\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/)
    if (asyncMatch) {
      const funcName = asyncMatch[1]
      if (!seen.has(funcName)) {
        names.push(funcName)
        seen.add(funcName)
      }
    }
  }

  while (i < len) {
    // Skip comments
    if (skipComment()) continue

    // Skip string literals
    if (code[i] === '\'' || code[i] === '"') {
      skipString(code[i])
      continue
    }

    // Skip template literals
    if (code[i] === '`') {
      skipTemplateLiteral()
      continue
    }

    // Track brace depth
    if (code[i] === '{') {
      depth++
      i++
      continue
    }
    if (code[i] === '}') {
      depth--
      i++
      continue
    }

    // Check for declarations at word boundaries (only at depth 0)
    if (depth === 0 && /[a-z]/i.test(code[i]) && (i === 0 || /\s|[;{}()]/.test(code[i - 1]))) {
      checkDeclaration()
    }

    i++
  }

  return names
}

// =============================================================================
// Component Rendering
// =============================================================================

/**
 * Shared function to render a component with props and slot content
 */
export async function renderComponentWithSlot(
  componentPath: string,
  props: Record<string, unknown>,
  slotContent: string,
  componentsDir: string,
  parentContext: Record<string, unknown>,
  parentFilePath: string,
  options: StxOptions,
  processedComponents: Set<string> | undefined = new Set<string>(),
  dependencies: Set<string>,
): Promise<string> {
  // Import locally to avoid circular dependency at module load time
  const { extractVariables } = await import('./variable-extractor')

  // Initialize processedComponents if it's undefined
  const components = processedComponents ?? new Set<string>()

  if (components.has(componentPath)) {
    // Avoid infinite recursion
    return `[Circular component reference: ${componentPath}]`
  }

  components.add(componentPath)

  try {
    // Helper: convert kebab-case to PascalCase
    const kebabToPascal = (str: string) => str
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')

    // Helper: convert PascalCase to kebab-case
    const pascalToKebab = (str: string) => str
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()

    // Get base name without extension
    const baseName = componentPath.endsWith('.stx')
      ? componentPath.slice(0, -4)
      : componentPath

    // Find the component file
    let componentFilePath: string | null = null

    // First, check if this component was explicitly imported via @import
    const importedComponents = parentContext.__importedComponents as Map<string, string> | undefined
    if (importedComponents) {
      // Try various name formats
      const namesToTry = [
        baseName,
        baseName.toLowerCase(),
        kebabToPascal(baseName),
        pascalToKebab(baseName),
      ]
      for (const name of namesToTry) {
        if (importedComponents.has(name)) {
          componentFilePath = importedComponents.get(name)!
          break
        }
      }
    }

    // If not found via @import, use auto-discovery
    const triedPaths: string[] = []
    if (!componentFilePath) {
      // Generate all possible file names to try
      const fileVariants = [
        `${baseName}.stx`,
        `${kebabToPascal(baseName)}.stx`,
        `${pascalToKebab(baseName)}.stx`,
      ]
      // Remove duplicates
      const uniqueVariants = [...new Set(fileVariants)]

      // Directories to search - filter out undefined/empty values
      const searchDirs = [
        componentsDir,
        path.join(path.dirname(parentFilePath), 'components'),
      ].filter(Boolean)
      if (options.componentsDir && options.componentsDir !== componentsDir) {
        searchDirs.push(options.componentsDir)
      }

      // If path starts with ./ or ../, resolve from current template directory
      if (baseName.startsWith('./') || baseName.startsWith('../')) {
        componentFilePath = path.resolve(path.dirname(parentFilePath), `${baseName}.stx`)
        triedPaths.push(componentFilePath)
      }
      else {
        // Search in all directories with all naming variants
        for (const dir of searchDirs) {
          if (!dir) continue
          for (const variant of uniqueVariants) {
            const tryPath = path.join(dir, variant)
            triedPaths.push(tryPath)
            if (await fileExists(tryPath)) {
              componentFilePath = tryPath
              break
            }
          }
          if (componentFilePath) break

          // Also search subdirectories (one level deep)
          if (!componentFilePath) {
            try {
              const fs = await import('node:fs')
              // Check if directory exists before reading
              const dirStat = fs.statSync(dir, { throwIfNoEntry: false })
              if (!dirStat?.isDirectory()) continue

              const entries = fs.readdirSync(dir, { withFileTypes: true })
              for (const entry of entries) {
                if (entry.isDirectory()) {
                  const subDir = path.join(dir, entry.name)
                  for (const variant of uniqueVariants) {
                    const tryPath = path.join(subDir, variant)
                    triedPaths.push(tryPath)
                    if (await fileExists(tryPath)) {
                      componentFilePath = tryPath
                      break
                    }
                  }
                  if (componentFilePath) break
                }
              }
            } catch {
              // Ignore directory read errors
            }
          }
          if (componentFilePath) break
        }
      }
    }

    // Check if component exists
    if (!componentFilePath || !await fileExists(componentFilePath)) {
      const searchInfo = triedPaths.length > 0
        ? `\nSearched paths:\n${triedPaths.map(p => `  - ${p}`).join('\n')}`
        : ''
      return `[Error loading component: ENOENT: no such file or directory, open '${componentPath}']${searchInfo}`
    }

    // Track this component as a dependency
    dependencies.add(componentFilePath)

    // Check if the component is cached
    let componentContent: string
    if (componentsCache.has(componentFilePath)) {
      componentContent = componentsCache.get(componentFilePath)!
    }
    else {
      // Read the file
      try {
        componentContent = await Bun.file(componentFilePath).text()
        // Cache for future use
        componentsCache.set(componentFilePath, componentContent)
      }
      catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        return `[Error loading component: ${message}]`
      }
    }

    // Create a new context with component props and slot content
    // Include both individual props and a `props` object for Vue-style access
    const componentContext: Record<string, unknown> = {
      ...parentContext,
      ...props,
      props, // Allow `props.foo` syntax in addition to just `foo`
      slot: slotContent,
    }

    // SFC Support: Extract <template>, <script>, and <style> sections
    let workingContent = componentContent

    // Extract <template> content if present (Vue-style SFC)
    // Only match <template> WITHOUT an id attribute - templates with id are HTML template elements
    // that should be preserved (used for client-side JS template cloning)
    const templateMatch = workingContent.match(/<template\b(?![^>]*\bid\s*=)[^>]*>([\s\S]*?)<\/template>/i)
    if (templateMatch) {
      workingContent = templateMatch[1].trim()
    }

    // Extract all script content from the component (SFC support)
    // Look in original content since template section won't have scripts
    const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
    const scriptMatches = [...componentContent.matchAll(scriptRegex)]
    const clientScripts: string[] = []

    for (const match of scriptMatches) {
      const attrs = match[1] || ''
      const content = match[2] || ''

      const isServerScript = attrs.includes('server')
      const isClientOnlyScript = attrs.includes('client') || attrs.includes('type="module"')

      // Extract variables from server scripts (or scripts without client marker)
      if (!isClientOnlyScript && content) {
        try {
          await extractVariables(content, componentContext, componentFilePath)
        }
        catch (e) {
          // Script may contain browser-only code, skip variable extraction
        }
      }

      // Preserve client scripts (non-server scripts)
      if (!isServerScript) {
        // Strip any existing signal destructuring - it will be added by the scope wrapper
        let cleanContent = content.replace(/^\s*const\s*\{\s*state\s*,\s*derived\s*,\s*effect\s*,\s*batch\s*,\s*onMount\s*,\s*onDestroy\s*\}\s*=\s*window\.stx\s*;?\s*\n?/gm, '')
        clientScripts.push(`<script${attrs}>${cleanContent}</script>`)
      }
    }

    // Extract <style> content if present
    const styleMatch = componentContent.match(/<style\b([^>]*)>([\s\S]*?)<\/style>/i)
    const styleAttrs = styleMatch ? styleMatch[1] : ''
    const styleContent = styleMatch ? styleMatch[2] : ''
    let preservedStyle = ''
    if (styleMatch) {
      preservedStyle = `<style${styleAttrs}>${styleContent}</style>`
    }

    // Remove script and style tags from template content
    let templateContent = workingContent
    templateContent = templateContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    if (styleMatch) {
      templateContent = templateContent.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    }

    // Find and replace any direct references to {{ text || slot }} with the actual value
    if (slotContent && templateContent.includes('{{ text || slot }}')) {
      templateContent = templateContent.replace(/\{\{\s*text\s*\|\|\s*slot\s*\}\}/g, slotContent)
    }

    // Process slots using the new slots module (supports named and scoped slots)
    const { extractSlotContent, applySlots } = await import('./slots')
    const { defaultSlot, namedSlots } = extractSlotContent(slotContent)

    // Apply slots to the template (handles named slots, scoped slots, and default slots)
    templateContent = await applySlots(templateContent, defaultSlot || slotContent, namedSlots, componentContext)

    // Handle HTML content in component props
    for (const [key, value] of Object.entries(componentContext)) {
      if (typeof value === 'string') {
        // Check if the content looks like HTML (has tags)
        if (
          (value.includes('<') && value.includes('>'))
          || value.includes('&lt;')
          || value.includes('&quot;')
        ) {
          // If this is a content prop, we need to make sure it's not double-escaped
          const unescaped = unescapeHtml(value)
          componentContext[key] = unescaped
        }
      }
    }

    // First, process any nested components in this component
    const componentOptions = {
      ...options,
      componentsDir: path.dirname(componentFilePath),
      // Skip runtime injection for nested components - parent will inject it
      skipSignalsRuntime: true,
    }

    // Process the component content recursively with the new context
    const result = await processDirectives(templateContent, componentContext, componentFilePath, componentOptions, dependencies)

    // Generate unique scope ID for this component instance
    const scopeId = `stx_${baseName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Wrap component in a scope container if it has client scripts with signals
    const hasSignalScripts = clientScripts.some(s => /\b(state|derived|effect)\s*\(/.test(s))
    let output = result

    if (hasSignalScripts) {
      // Wrap the component output in a scoped container
      output = `<div data-stx-scope="${scopeId}">${result}</div>`

      // Modify client scripts to register variables in this scope
      const scopedScripts = clientScripts.map(script => {
        // Extract script content
        const scriptMatch = script.match(/<script([^>]*)>([\s\S]*)<\/script>/i)
        if (!scriptMatch) return script

        const [, attrs, content] = scriptMatch
        // Wrap script content to register in scope
        // Add data-stx-scoped attribute to prevent double-processing by processScriptSetup
        const wrappedContent = `
(function() {
  const { state, derived, effect, batch } = window.stx;
  const __scope = window.stx._scopes = window.stx._scopes || {};
  const __scopeVars = __scope['${scopeId}'] = __scope['${scopeId}'] || {};

  // Scope-specific lifecycle callbacks
  __scopeVars.__mountCallbacks = __scopeVars.__mountCallbacks || [];
  __scopeVars.__destroyCallbacks = __scopeVars.__destroyCallbacks || [];
  const onMount = (fn) => __scopeVars.__mountCallbacks.push(fn);
  const onDestroy = (fn) => __scopeVars.__destroyCallbacks.push(fn);

${content}

  // Register all defined signals and functions in this scope
  const __localVars = {};
  try {
    ${extractVariableNames(content).map(v => `if (typeof ${v} !== 'undefined') __localVars['${v}'] = ${v};`).join('\n    ')}
  } catch(e) {}
  Object.assign(__scopeVars, __localVars);
})();`
        return `<script data-stx-scoped${attrs}>${wrappedContent}</script>`
      })

      // Append preserved style and scoped scripts
      if (preservedStyle) {
        output += '\n' + preservedStyle
      }
      output += '\n' + scopedScripts.join('\n')
    } else {
      // No signals, transform and append style and scripts
      if (preservedStyle) {
        output += '\n' + preservedStyle
      }
      if (clientScripts.length > 0) {
        // Use event bindings collected during template processing (from @click, @input, etc.)
        const eventBindings = (componentContext.__stx_event_bindings || []) as any[]
        const transformedScripts = clientScripts.map((fullScript: string) => {
          const contentMatch = fullScript.match(/<script\b[^>]*>([\s\S]*?)<\/script>/)
          if (!contentMatch) return fullScript
          return processClientScript(contentMatch[1], { eventBindings })
        })
        output += '\n' + transformedScripts.join('\n')
        // Clear bindings after use
        componentContext.__stx_event_bindings = []
      }
    }

    return output
  }
  catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return `[Error processing component: ${message}]`
  }
  finally {
    // Remove from processed set to allow future uses
    components.delete(componentPath)
  }
}

// =============================================================================
// File System Utilities
// =============================================================================

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(filePath)
    return stat.isFile()
  }
  catch {
    return false
  }
}

// =============================================================================
// Template Path Resolution
// =============================================================================

/**
 * Resolve a template path based on the current file path
 */
export async function resolveTemplatePath(
  templatePath: string,
  currentFilePath: string,
  options: StxOptions,
  dependencies?: Set<string>,
): Promise<string | null> {
  // Debug output for layout resolution
  if (options.debug) {
    console.log(`Resolving template path: ${templatePath} from ${currentFilePath}`)
  }

  // Try relative to current file
  const dirPath = path.dirname(currentFilePath)

  // Handle common paths
  // 1. Absolute path (starts with /)
  if (templatePath.startsWith('/')) {
    const absolutePath = path.join(process.cwd(), templatePath)
    if (options.debug) {
      console.log(`Checking absolute path: ${absolutePath}`)
    }
    // Track dependency if found
    if (await fileExists(absolutePath) && dependencies) {
      dependencies.add(absolutePath)
    }
    return absolutePath
  }

  // 2. Direct path relative to current file
  const directPath = path.join(dirPath, templatePath)
  if (await fileExists(directPath)) {
    if (options.debug) {
      console.log(`Found direct path: ${directPath}`)
    }
    // Track dependency
    if (dependencies) {
      dependencies.add(directPath)
    }
    return directPath
  }

  // 3. Add .stx extension if not present
  if (!templatePath.endsWith('.stx')) {
    const pathWithExt = `${directPath}.stx`
    if (await fileExists(pathWithExt)) {
      if (options.debug) {
        console.log(`Found direct path with extension: ${pathWithExt}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(pathWithExt)
      }
      return pathWithExt
    }
  }

  // Handle special case for layouts
  // First check if current directory has a "layouts" dir
  let layoutsDir = path.join(dirPath, 'layouts')
  if (await fileExists(layoutsDir)) {
    // Check in the current file's directory/layouts
    const fromCurrentLayouts = path.join(layoutsDir, templatePath)
    if (await fileExists(fromCurrentLayouts)) {
      if (options.debug) {
        console.log(`Found in current layouts dir: ${fromCurrentLayouts}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(fromCurrentLayouts)
      }
      return fromCurrentLayouts
    }

    // With extension
    if (!templatePath.endsWith('.stx')) {
      const fromCurrentLayoutsWithExt = `${fromCurrentLayouts}.stx`
      if (await fileExists(fromCurrentLayoutsWithExt)) {
        if (options.debug) {
          console.log(`Found in current layouts dir with extension: ${fromCurrentLayoutsWithExt}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(fromCurrentLayoutsWithExt)
        }
        return fromCurrentLayoutsWithExt
      }
    }
  }

  // Check options.layoutsDir if specified (for projects like voide that set layoutsDir)
  if (options.layoutsDir) {
    // Resolve relative layoutsDir paths relative to cwd or the file's parent directory
    const resolvedLayoutsDir = path.isAbsolute(options.layoutsDir)
      ? options.layoutsDir
      : path.resolve(process.cwd(), options.layoutsDir)

    const fromLayoutsDir = path.join(resolvedLayoutsDir, templatePath)
    if (await fileExists(fromLayoutsDir)) {
      if (options.debug) {
        console.log(`Found in options.layoutsDir: ${fromLayoutsDir}`)
      }
      if (dependencies) {
        dependencies.add(fromLayoutsDir)
      }
      return fromLayoutsDir
    }

    // With extension
    if (!templatePath.endsWith('.stx')) {
      const fromLayoutsDirWithExt = `${fromLayoutsDir}.stx`
      if (await fileExists(fromLayoutsDirWithExt)) {
        if (options.debug) {
          console.log(`Found in options.layoutsDir with extension: ${fromLayoutsDirWithExt}`)
        }
        if (dependencies) {
          dependencies.add(fromLayoutsDirWithExt)
        }
        return fromLayoutsDirWithExt
      }
    }
  }

  // 4. Special case for layouts directory if specified in options or path looks like 'layouts/*'
  if (templatePath.startsWith('layouts/') || templatePath.includes('/layouts/')) {
    const parts = templatePath.split('layouts/')
    const layoutsPath = path.join(options.partialsDir || dirPath, 'layouts', parts[1])
    if (await fileExists(layoutsPath)) {
      if (options.debug) {
        console.log(`Found in layouts path: ${layoutsPath}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(layoutsPath)
      }
      return layoutsPath
    }

    // With extension
    if (!layoutsPath.endsWith('.stx')) {
      const layoutsPathWithExt = `${layoutsPath}.stx`
      if (await fileExists(layoutsPathWithExt)) {
        if (options.debug) {
          console.log(`Found in layouts path with extension: ${layoutsPathWithExt}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(layoutsPathWithExt)
        }
        return layoutsPathWithExt
      }
    }
  }

  // 5. Try from layouts directory under partialsDir if specified
  if (options.partialsDir) {
    layoutsDir = path.join(options.partialsDir, 'layouts')
    if (await fileExists(layoutsDir)) {
      const fromPartialsLayouts = path.join(layoutsDir, templatePath)
      if (await fileExists(fromPartialsLayouts)) {
        if (options.debug) {
          console.log(`Found in partials layouts dir: ${fromPartialsLayouts}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(fromPartialsLayouts)
        }
        return fromPartialsLayouts
      }

      // With extension
      if (!templatePath.endsWith('.stx')) {
        const fromPartialsLayoutsWithExt = `${fromPartialsLayouts}.stx`
        if (await fileExists(fromPartialsLayoutsWithExt)) {
          if (options.debug) {
            console.log(`Found in partials layouts dir with extension: ${fromPartialsLayoutsWithExt}`)
          }
          // Track dependency
          if (dependencies) {
            dependencies.add(fromPartialsLayoutsWithExt)
          }
          return fromPartialsLayoutsWithExt
        }
      }
    }
  }

  // 6. Try from project root or view directory if configured
  const viewsPath = options.partialsDir || path.join(process.cwd(), 'views')
  const fromRoot = path.join(viewsPath, templatePath)
  if (await fileExists(fromRoot)) {
    if (options.debug) {
      console.log(`Found in views path: ${fromRoot}`)
    }
    // Track dependency
    if (dependencies) {
      dependencies.add(fromRoot)
    }
    return fromRoot
  }

  // 7. With extension from project root
  if (!templatePath.endsWith('.stx')) {
    const fromRootWithExt = `${fromRoot}.stx`
    if (await fileExists(fromRootWithExt)) {
      if (options.debug) {
        console.log(`Found in views path with extension: ${fromRootWithExt}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(fromRootWithExt)
      }
      return fromRootWithExt
    }
  }

  // If still not found and we're looking for a layout, try in the TEMP_DIR/layouts directory
  // This is a special case for the tests
  if (dirPath.includes('temp')) {
    const tempDirLayouts = path.join(path.dirname(dirPath), 'layouts', templatePath)
    if (await fileExists(tempDirLayouts)) {
      if (options.debug) {
        console.log(`Found in temp layouts dir: ${tempDirLayouts}`)
      }
      // Track dependency
      if (dependencies) {
        dependencies.add(tempDirLayouts)
      }
      return tempDirLayouts
    }

    // With extension
    if (!templatePath.endsWith('.stx')) {
      const tempDirLayoutsWithExt = `${tempDirLayouts}.stx`
      if (await fileExists(tempDirLayoutsWithExt)) {
        if (options.debug) {
          console.log(`Found in temp layouts dir with extension: ${tempDirLayoutsWithExt}`)
        }
        // Track dependency
        if (dependencies) {
          dependencies.add(tempDirLayoutsWithExt)
        }
        return tempDirLayoutsWithExt
      }
    }
  }

  // Not found
  if (options.debug) {
    console.warn(`Template not found after trying all paths: ${templatePath} (referenced from ${currentFilePath})`)
  }
  else {
    console.warn(`Template not found: ${templatePath} (referenced from ${currentFilePath})`)
  }
  return null
}

// =============================================================================
// Error Formatting
// =============================================================================

/**
 * Get source line number from an error in a template
 * This helps provide more precise error messages
 * @param template The full template string
 * @param errorPosition The character position of the error (if available)
 * @param errorPattern The pattern to locate in the template (fallback if position not available)
 * @returns Line number and context information
 */
export function getSourceLineInfo(
  template: string,
  errorPosition?: number,
  errorPattern?: string,
): { lineNumber: number, lineContent: string, context: string } {
  // Default values if we can't extract info
  let lineNumber = 0
  let lineContent = ''
  let context = ''

  try {
    // If we have a position, find the line containing that position
    if (typeof errorPosition === 'number' && errorPosition >= 0) {
      const lines = template.split('\n')
      let currentPos = 0

      for (let i = 0; i < lines.length; i++) {
        currentPos += lines[i].length + 1 // +1 for the newline character
        if (currentPos >= errorPosition) {
          lineNumber = i + 1 // Lines start at 1
          lineContent = lines[i].trim()

          // Get some context (preceding and following lines)
          const start = Math.max(0, i - 2)
          const end = Math.min(lines.length, i + 3)
          context = lines.slice(start, end).map((line, idx) => {
            const contextLineNum = start + idx + 1
            const marker = contextLineNum === lineNumber ? '> ' : '  '
            return `${marker}${contextLineNum}: ${line}`
          }).join('\n')

          break
        }
      }
    }
    // If no position but we have a pattern, find the line containing the pattern
    else if (errorPattern) {
      const patternPos = template.indexOf(errorPattern)
      if (patternPos >= 0) {
        return getSourceLineInfo(template, patternPos)
      }
    }
  }
  catch {
    // Fallback - at least return what we know about the error
  }

  return { lineNumber, lineContent, context }
}

// ANSI color codes for better error formatting
const colors = {
  reset: '\x1B[0m',
  bold: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  cyan: '\x1B[36m',
  gray: '\x1B[90m',
  bgRed: '\x1B[41m',
  bgYellow: '\x1B[43m',
}

/**
 * Create a descriptive error message with line information
 * @param errorType Type of error (e.g., "Expression", "Directive")
 * @param errorMessage The base error message
 * @param filePath The file where the error occurred
 * @param template The template content
 * @param errorPosition The position of the error (if known)
 * @param errorPattern A pattern to locate the error (fallback)
 * @returns A formatted error message
 */
export function createDetailedErrorMessage(
  errorType: string,
  errorMessage: string,
  filePath: string,
  template: string,
  errorPosition?: number,
  errorPattern?: string,
): string {
  const { lineNumber, context } = getSourceLineInfo(template, errorPosition, errorPattern)
  const fileName = filePath.split('/').pop()

  // Create a beautiful error message with colors
  let detailedMessage = `\n${colors.bold}${colors.red}╭──────────────────────────────────────────────────────────────╮${colors.reset}\n`
  detailedMessage += `${colors.bold}${colors.red}│${colors.reset} ${colors.bold}${colors.bgRed} ERROR ${colors.reset} ${colors.red}${errorType} Error${colors.reset}${' '.repeat(Math.max(0, 43 - errorType.length))}${colors.bold}${colors.red}│${colors.reset}\n`
  detailedMessage += `${colors.bold}${colors.red}╰──────────────────────────────────────────────────────────────╯${colors.reset}\n`

  // File and line information
  detailedMessage += `\n${colors.cyan}${colors.bold}File:${colors.reset} ${colors.dim}${fileName}${colors.reset}`

  if (lineNumber > 0) {
    detailedMessage += ` ${colors.gray}(line ${lineNumber})${colors.reset}`
  }

  // Error message
  detailedMessage += `\n${colors.yellow}${colors.bold}Message:${colors.reset} ${errorMessage}\n`

  // Add detailed context for debug mode
  if (context) {
    detailedMessage += `\n${colors.blue}${colors.bold}Context:${colors.reset}\n${colors.dim}${context}${colors.reset}\n`
  }

  return detailedMessage
}

// =============================================================================
// Miscellaneous Utilities
// =============================================================================

/**
 * Clear the component cache
 * Useful for development or testing
 */
export function clearComponentCache(): void {
  componentsCache.clear()
}

/**
 * Get component cache statistics
 */
export function getComponentCacheStats(): { size: number, maxSize: number } {
  return {
    size: componentsCache.size,
    maxSize: 500,
  }
}
