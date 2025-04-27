import type { StxOptions } from './types'
import fs from 'node:fs'
/**
 * Module for processing include and partial directives
 */
import path from 'node:path'
import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'
import { fileExists } from './utils'

// Cache for partials to avoid repeated file reads
export const partialsCache: Map<string, string> = new Map()

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
  // Get the partials directory
  const partialsDir = options.partialsDir || path.join(path.dirname(filePath), 'partials')

  // First handle partial alias (replace @partial with @include)
  let output = template.replace(/@partial\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (_, includePath, varsString) => `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`)

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
  output = output.replace(/@includeWhen\s*\(([^,]+),\s*['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (_, condition, includePath, varsString) => {
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
    catch (error) {
      console.error(`Error evaluating @includeWhen condition: ${error}`)
      return `[Error in @includeWhen: ${error}]`
    }
  })

  // Process @includeUnless directive
  output = output.replace(/@includeUnless\s*\(([^,]+),\s*['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g, (_, condition, includePath, varsString) => {
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
    catch (error) {
      console.error(`Error evaluating @includeUnless condition: ${error}`)
      return `[Error in @includeUnless: ${error}]`
    }
  })

  // Process @includeFirst directive
  output = output.replace(/@includeFirst\s*\(\s*\[([^\]]+)\](?:,\s*(\{[^}]*\}))?\)/g, (_, pathsString, varsString) => {
    try {
      // Parse the array of paths
      const pathsArrayString = `[${pathsString}]`
      // eslint-disable-next-line no-new-func
      const pathsFn = new Function(`return ${pathsArrayString}`)
      const paths = pathsFn()

      // Find the first existing file
      for (const path of paths) {
        const includeFilePath = resolvePath(path, partialsDir, filePath)
        if (includeFilePath && fs.existsSync(includeFilePath)) {
          // Track the first dependency that exists
          dependencies.add(includeFilePath)
          return `@include('${path}'${varsString ? `, ${varsString}` : ''})`
        }
      }
      return '' // None of the files exist
    }
    catch (error) {
      console.error(`Error processing @includeFirst: ${error}`)
      return `[Error in @includeFirst: ${error}]`
    }
  })

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

  // Replace all includes recursively
  const processedIncludes = new Set<string>() // Prevent infinite recursion

  // Define a function to process a single include
  async function processInclude(includePath: string, localVars: Record<string, any> = {}): Promise<string> {
    if (processedIncludes.has(includePath)) {
      // Avoid infinite recursion
      return `[Circular include: ${includePath}]`
    }

    processedIncludes.add(includePath)

    try {
      // Get resolved path
      const includeFilePath = resolvePath(includePath, partialsDir, filePath)
      if (!includeFilePath) {
        return `[Error: Could not resolve path for ${includePath}]`
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
          return `[Error loading include: ${error.message}]`
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
      return `[Error processing include: ${error.message}]`
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
    let localVars = {}

    // Parse local variables if provided
    if (varsString) {
      try {
        // eslint-disable-next-line no-new-func
        const varsFn = new Function(`return ${varsString}`)
        localVars = varsFn()
      }
      catch (error: any) {
        output = output.replace(fullMatch, `[Error parsing include variables: ${error.message}]`)
        continue
      }
    }

    // Process the include
    const processedContent = await processInclude(includePath, localVars)

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
