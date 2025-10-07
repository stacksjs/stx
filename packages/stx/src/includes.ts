import type { StxOptions } from './types'
import fs from 'node:fs'
/**
 * Module for processing include and partial directives
 */
import path from 'node:path'
import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'
import { createDetailedErrorMessage, fileExists } from './utils'

// Cache for partials to avoid repeated file reads
export const partialsCache: Map<string, string> = new Map()

// Global store to track what has been included via @once
export const onceStore: Set<string> = new Set()

/**
 * Clear the @once store - useful for testing and resetting state
 */
export function clearOnceStore(): void {
  onceStore.clear()
}

/**
 * Process @include and @partial directives
 */
export async function processIncludes(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: StxOptions,
  dependencies: Set<string>,
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

  // Process @once directive - content that should only be included once globally
  output = output.replace(/@once([\s\S]*?)@endonce/g, (match, content, _offset) => {
    // Create a unique key for this @once block based on content hash
    const contentHash = content.trim()
    const onceKey = `${filePath}:${contentHash}`

    if (onceStore.has(onceKey)) {
      // Already included, return empty string
      return ''
    }

    // Mark as included and return the content
    onceStore.add(onceKey)
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

  // Process @includeWhen directive
  output = output.replace(/@includeWhen\s*\(([^,]+),\s*['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (match, condition, includePath, varsString, offset) => {
    try {
      // Evaluate the condition
      // eslint-disable-next-line no-new-func
      const conditionFn = new Function(...Object.keys(context), `return Boolean(${condition})`)
      const shouldInclude = conditionFn(...Object.values(context))

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

  // Process @includeUnless directive
  output = output.replace(/@includeUnless\s*\(([^,]+),\s*['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (match, condition, includePath, varsString, offset) => {
    try {
      // Evaluate the condition
      // eslint-disable-next-line no-new-func
      const conditionFn = new Function(...Object.keys(context), `return Boolean(${condition})`)
      const conditionResult = conditionFn(...Object.values(context))

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
  const includeFirstRegex = /@includeFirst\s*\(\s*(\[[^\]]+\])\s*(?:,\s*(\{[^}]+\})\s*)?\)/g
  let includeFirstMatch

  // eslint-disable-next-line no-cond-assign
  while (includeFirstMatch = includeFirstRegex.exec(output)) {
    const [fullMatch, pathArrayString, varsString] = includeFirstMatch
    const matchOffset = includeFirstMatch.index

    try {
      // Parse the array of paths
      const pathArray = JSON.parse(pathArrayString.replace(/'/g, '"'))

      // Parse local variables if provided
      let localVars = {}
      if (varsString) {
        try {
          // eslint-disable-next-line no-new-func
          const varsFn = new Function(`return ${varsString}`)
          localVars = varsFn()
        }
        catch (error: any) {
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

      // No valid include found
      if (!foundValidPath) {
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

  // Helper function to resolve paths
  function resolvePath(includePath: string, partialsDir: string, filePath: string): string | null {
    try {
      // Determine the actual file path
      let includeFilePath = includePath

      // If it doesn't end with .stx, add the extension
      if (!includePath.endsWith('.stx')) {
        includeFilePath = `${includePath}.stx`
      }

      // If it's a relative path without ./ or ../, assume it's in the partials directory
      if (!includeFilePath.startsWith('./') && !includeFilePath.startsWith('../')) {
        includeFilePath = path.join(partialsDir, includeFilePath)
      }
      else {
        // Otherwise, resolve from the current template directory
        includeFilePath = path.resolve(path.dirname(filePath), includeFilePath)
      }

      return includeFilePath
    }
    catch (error) {
      console.error(`Error resolving path ${includePath}: ${error}`)
      return null
    }
  }

  // Keep track of processed includes to prevent infinite recursion
  const processedIncludes = new Set<string>()

  // Define a helper function to process a single include
  async function processIncludeHelper(includePath: string, localVars: Record<string, any> = {}, templateStr: string, offsetPos: number): Promise<string> {
    if (processedIncludes.has(includePath)) {
      // Avoid infinite recursion
      return createDetailedErrorMessage(
        'Include',
        `Circular include detected: ${includePath}`,
        filePath,
        templateStr,
        offsetPos,
      )
    }

    processedIncludes.add(includePath)

    try {
      // Get resolved path
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
      // Process any nested includes first
      if (partialContent.includes('@include') || partialContent.includes('@partial')) {
        partialContent = await processIncludes(partialContent, includeContext, includeFilePath, options, dependencies)
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
    finally {
      // Remove from processed set to allow future uses
      processedIncludes.delete(includePath)
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
    let localVars = {}

    // Parse local variables if provided
    if (varsString) {
      try {
        // eslint-disable-next-line no-new-func
        const varsFn = new Function(`return ${varsString}`)
        localVars = varsFn()
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

/**
 * Stack related functions for @push, @stack, @prepend directives
 */

/**
 * Process @push and @prepend directives to collect content
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
 * Process @stack directives by replacing them with their content
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
