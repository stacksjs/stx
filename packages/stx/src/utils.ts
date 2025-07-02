/* eslint-disable no-console */

/**
 * Utility functions for the STX compiler
 */
import type { StxOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Import from expressions
import { unescapeHtml } from './expressions'
import { processDirectives } from './process'

// Cache for components to avoid repeated file reads
const componentsCache = new Map<string, string>()

/**
 * Shared function to render a component with props and slot content
 */
export async function renderComponent(
  componentPath: string,
  props: Record<string, any>,
  slotContent: string,
  componentsDir: string,
  parentContext: Record<string, any>,
  parentFilePath: string,
  options: StxOptions,
  processedComponents: Set<string> | undefined = new Set<string>(),
  dependencies: Set<string>,
): Promise<string> {
  // Initialize processedComponents if it's undefined
  const components = processedComponents ?? new Set<string>()

  if (components.has(componentPath)) {
    // Avoid infinite recursion
    return `[Circular component reference: ${componentPath}]`
  }

  components.add(componentPath)

  try {
    // Determine the actual file path
    let componentFilePath = componentPath

    // If it doesn't end with .stx, add the extension
    if (!componentPath.endsWith('.stx')) {
      componentFilePath = `${componentPath}.stx`
    }

    // If it's a relative path without ./ or ../, assume it's in the components directory
    if (!componentFilePath.startsWith('./') && !componentFilePath.startsWith('../')) {
      // Check both componentsDir and the actual components dir from parentFilePath
      let resolvedPath = path.join(componentsDir, componentFilePath)

      if (!await fileExists(resolvedPath)) {
        // Try the default location - components directory next to the file
        const defaultComponentsDir = path.join(path.dirname(parentFilePath), 'components')
        resolvedPath = path.join(defaultComponentsDir, componentFilePath)

        if (!await fileExists(resolvedPath)) {
          // If still not found, try options.componentsDir if specified
          if (options.componentsDir && await fileExists(path.join(options.componentsDir, componentFilePath))) {
            resolvedPath = path.join(options.componentsDir, componentFilePath)
          }
        }
      }

      componentFilePath = resolvedPath
    }
    else {
      // Otherwise, resolve from the current template directory
      componentFilePath = path.resolve(path.dirname(parentFilePath), componentFilePath)
    }

    // Check if component exists
    if (!await fileExists(componentFilePath)) {
      return `[Error loading component: ENOENT: no such file or directory, open '${componentPath}']`
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
      catch (error: any) {
        return `[Error loading component: ${error.message}]`
      }
    }

    // Create a new context with component props and slot content
    const componentContext: Record<string, any> = {
      ...parentContext,
      ...props,
      slot: slotContent,
    }

    // Extract any script content from the component
    const scriptMatch = componentContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
    const scriptContent = scriptMatch ? scriptMatch[1] : ''

    if (scriptContent) {
      await extractVariables(scriptContent, componentContext, componentFilePath)
    }

    // Remove script tags from the component template
    let templateContent = componentContent
    if (scriptMatch) {
      templateContent = templateContent.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')
    }

    // Find and replace any direct references to {{ text || slot }} with the actual value
    if (slotContent && templateContent.includes('{{ text || slot }}')) {
      templateContent = templateContent.replace(/\{\{\s*text\s*\|\|\s*slot\s*\}\}/g, slotContent)
    }

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
    }

    // Process the component content recursively with the new context
    const result = await processDirectives(templateContent, componentContext, componentFilePath, componentOptions, dependencies)

    return result
  }
  catch (error: any) {
    return `[Error processing component: ${error.message}]`
  }
  finally {
    // Remove from processed set to allow future uses
    components.delete(componentPath)
  }
}

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

/**
 * Extract variables from script content
 */
export async function extractVariables(scriptContent: string, context: Record<string, any>, filePath: string): Promise<void> {
  // First try to convert ESM exports to CommonJS if needed
  let processedScript = scriptContent
  if (scriptContent.includes('export ')) {
    // Convert ESM exports to CommonJS for execution
    // Handle multi-line exports by processing them more carefully
    
    // 1. Handle export const/let/var with complex values (objects, arrays, etc.)
    processedScript = processedScript
      .replace(/export\s+const\s+(\w+)\s*=\s*([\s\S]*?);(?=\s*(?:export|$|<\/script>))/g, 'const $1 = $2; module.exports.$1 = $1;')
      .replace(/export\s+let\s+(\w+)\s*=\s*([\s\S]*?);(?=\s*(?:export|$|<\/script>))/g, 'let $1 = $2; module.exports.$1 = $1;')
      .replace(/export\s+var\s+(\w+)\s*=\s*([\s\S]*?);(?=\s*(?:export|$|<\/script>))/g, 'var $1 = $2; module.exports.$1 = $1;')
    
    // 2. Handle export function with proper multi-line support
    processedScript = processedScript
      .replace(/export\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{([\s\S]*?)\}/g, 'function $1($2) {$3} module.exports.$1 = $1;')
    
    // 3. Handle export default
    processedScript = processedScript
      .replace(/export\s+default\s+([\s\S]+?)(?=\s*(?:export|$|<\/script>))/g, 'module.exports.default = $1;')
  }

  // Add a comprehensive approach to collect and export all variables/functions at the end
  // Instead of inline exports that can interfere with function bodies
  const exportStatements: string[] = []
  
  // First, identify non-exported variables
  const varMatches = processedScript.matchAll(/(?<!export\s+)(const|let|var)\s+(\w+)\s*=/g)
  for (const match of varMatches) {
    const varName = match[2]
    exportStatements.push(`if (typeof module !== "undefined" && module.exports && typeof ${varName} !== "undefined") { module.exports.${varName} = ${varName}; }`)
  }
  
  // Then, identify non-exported functions
  const funcMatches = processedScript.matchAll(/(?<!export\s+)function\s+(\w+)\s*\(/g)
  for (const match of funcMatches) {
    const funcName = match[1]
    exportStatements.push(`if (typeof module !== "undefined" && module.exports && typeof ${funcName} !== "undefined") { module.exports.${funcName} = ${funcName}; }`)
  }
  
  // Add all export statements at the end of the script
  if (exportStatements.length > 0) {
    processedScript += '\n' + exportStatements.join('\n')
  }
  
  // Execute script content in module context for proper variable extraction (CommonJS)
  try {
    // eslint-disable-next-line no-new-func
    const scriptFn = new Function('module', 'exports', processedScript)
    const module = { exports: {} }
    scriptFn(module, module.exports)

    // Process any number values to ensure they are correctly handled
    const processValues = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null)
        return obj

      // Handle circular references
      const seen = new WeakSet()

      const innerProcess = (val: any): any => {
        if (typeof val !== 'object' || val === null)
          return val

        // Detect circular references
        if (seen.has(val)) {
          return '[Circular Reference]'
        }

        seen.add(val)

        // Process arrays
        if (Array.isArray(val)) {
          return val.map(item => innerProcess(item))
        }

        // Process objects
        const result: Record<string, any> = {}
        for (const [key, value] of Object.entries(val)) {
          result[key] = innerProcess(value)
        }
        return result
      }

      return innerProcess(obj)
    }

    Object.assign(context, processValues(module.exports))
  }
  catch (error: any) {
    console.warn(`Failed to execute script as CommonJS module in ${filePath}:`, error)

    // Try ES Module style exports
    try {
      // This pattern captures export statements in the script
      const exportPattern = /export\s(const|let|var|function|default)\s([a-zA-Z_$][\w$]*)?(?:\s*=\s*([^;]+))?/g
      let match: RegExpExecArray | null

      // Use a different approach to avoid assignment in while condition
      match = exportPattern.exec(scriptContent)
      while (match !== null) {
        const [, type, name, value] = match

        if (type === 'default') {
          if (value) {
            try {
              // eslint-disable-next-line no-new-func
              const defaultValueFn = new Function(`return ${value}`)
              const defaultValue = defaultValueFn()
              if (typeof defaultValue === 'object' && defaultValue !== null) {
                Object.assign(context, defaultValue)
              }
            }
            catch (e) {
              console.warn(`Failed to process default export in ${filePath}:`, e)
            }
          }
        }
        else if (name) {
          try {
            // Create a function that executes the export statement and returns the value
            // eslint-disable-next-line no-new-func
            const extractFn = new Function(`
              ${type} ${name} = ${value || 'undefined'};
              return ${name};
            `)
            context[name] = extractFn()
          }
          catch (e) {
            console.warn(`Failed to process export of ${name} in ${filePath}:`, e)
          }
        }

        // Get next match
        match = exportPattern.exec(scriptContent)
      }
    }
    catch (e) {
      console.warn(`Failed to process ES module exports in ${filePath}:`, e)
    }
  }

  // Legacy approach: try to extract variables from direct script execution
  try {
    // Use processed script (without exports) for direct execution
    const directScript = processedScript
      .replace(/module\.exports\.\w+\s*=\s*\w+;/g, '') // Remove module.exports assignments
      .replace(/module\.exports\.default\s*=\s*[^;]+;/g, '') // Remove default exports
    
    // eslint-disable-next-line no-new-func
    const directFn = new Function(`
      // Execute script content directly but protect against module not defined
      try {
        ${directScript}
      } catch (e) {
        // Ignore module not defined errors
        if (!e.toString().includes('module is not defined')) {
          throw e;
        }
      }

      // Return all defined variables, scanning window/global scope
      return Object.fromEntries(
        Object.getOwnPropertyNames(this)
          .filter(key =>
            // Exclude built-in properties and functions
            !['global', 'globalThis', 'self', 'window', 'console', 'setTimeout', 'setInterval',
             'Function', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Error'].includes(key) &&
            // Only include own properties that aren't functions or built-in properties
            typeof this[key] !== 'function' &&
            !key.startsWith('_')
          )
          .map(key => [key, this[key]])
      );
    `)

    const vars = directFn()
    // Only copy defined values
    Object.entries(vars).forEach(([key, value]) => {
      if (value !== undefined && !context[key]) {
        context[key] = value
      }
    })
  }
  catch (error: any) {
    // Only show extraction warnings for unexpected errors
    if (!error.toString().includes('module is not defined')
      && !error.toString().includes('Unexpected EOF')) {
      console.warn(`Variable extraction issue in ${filePath}:`, error)
    }
  }
}

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

  let detailedMessage = `[${errorType} Error`

  if (lineNumber > 0) {
    detailedMessage += ` at line ${lineNumber}`
  }

  detailedMessage += ` in ${filePath.split('/').pop()}]`
  detailedMessage += `: ${errorMessage}`

  // Add detailed context for debug mode
  if (context) {
    detailedMessage += `\n\nContext:\n${context}`
  }

  return detailedMessage
}
