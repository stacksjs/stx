import type { BunPlugin } from 'bun'
import path from 'node:path'

/**
 * STX Plugin for Bun
 * Enables Laravel Blade-like syntax in .stx files
 */

interface STXOptions {
  /** Path to partials directory, defaults to 'partials' in the same directory as the template */
  partialsDir?: string
  /** Enable debug mode for detailed error messages */
  debug?: boolean
}

// Extend BuildConfig to support stx options
declare module 'bun' {
  interface BuildConfig {
    stx?: STXOptions
  }
}

const defaultOptions: STXOptions = {
  partialsDir: undefined,
  debug: false,
}

// Cache for partials to avoid repeated file reads
const partialsCache = new Map<string, string>()

const plugin: BunPlugin = {
  name: 'bun-plugin-stx',
  async setup(build) {
    // Extract options from config or use defaults
    const options: STXOptions = {
      ...defaultOptions,
      ...build.config?.stx,
    }

    build.onLoad({ filter: /\.stx$/ }, async ({ path: filePath }) => {
      try {
        const content = await Bun.file(filePath).text()

        // Extract script and template sections
        const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
        const scriptContent = scriptMatch ? scriptMatch[1] : ''
        const templateContent = content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/i, '')

        // Create a sandbox environment to execute the script
        const context: Record<string, any> = {
          // Add some useful globals
          __filename: filePath,
          __dirname: path.dirname(filePath),
        }

        // Execute script content to extract variables
        await extractVariables(scriptContent, context, filePath)

        // Process template directives
        let output = templateContent

        // Process all directives
        output = await processDirectives(output, context, filePath, options)

        return {
          contents: output,
          loader: 'html',
        }
      }
      catch (error: any) {
        console.error('STX Plugin Error:', error)
        return {
          contents: `<!DOCTYPE html><html><body><h1>STX Rendering Error</h1><pre>${error.message || String(error)}</pre></body></html>`,
          loader: 'html',
        }
      }
    })
  },
}

/**
 * Extract variables from script content
 */
async function extractVariables(scriptContent: string, context: Record<string, any>, filePath: string): Promise<void> {
  // Execute script content in module context for proper variable extraction (CommonJS)
  try {
    // eslint-disable-next-line no-new-func
    const scriptFn = new Function('module', 'exports', scriptContent)
    const module = { exports: {} }
    scriptFn(module, module.exports)
    Object.assign(context, module.exports)
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
    // eslint-disable-next-line no-new-func
    const directFn = new Function(`
      // Execute script content directly but protect against module not defined
      try {
        ${scriptContent}
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
 * Process all template directives
 */
async function processDirectives(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: STXOptions,
): Promise<string> {
  let output = template

  // First, remove all comments
  output = output.replace(/\{\{--[\s\S]*?--\}\}/g, '')

  // Process include and partial directives
  output = await processIncludes(output, context, filePath, options)

  // Process sections and yields
  const sections: Record<string, string> = {}

  // Extract sections
  output = output.replace(/@section\s*\(['"]([^'"]+)['"]\)([\s\S]*?)@endsection/g, (_, name, content) => {
    sections[name] = content.trim()
    return '' // Remove section definitions from the output
  })

  // Add sections to context
  context.__sections = sections

  // Replace yield with section content
  output = output.replace(/@yield\s*\(['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?\)/g, (_, name, defaultContent) => {
    return sections[name] || defaultContent || ''
  })

  // Process regular directives
  output = processConditionals(output, context, filePath)
  output = processLoops(output, context, filePath)
  output = processExpressions(output, context, filePath)

  return output
}

/**
 * Process @include and @partial directives
 */
async function processIncludes(
  template: string,
  context: Record<string, any>,
  filePath: string,
  options: STXOptions,
): Promise<string> {
  // Get the partials directory
  const partialsDir = options.partialsDir || path.join(path.dirname(filePath), 'partials')

  // Process @include directive
  const includeRegex = /@include\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g
  let output = template

  // Replace all includes recursively
  const processedIncludes = new Set<string>() // Prevent infinite recursion

  // First, scan the template for all includes
  const includeMatches = Array.from(template.matchAll(includeRegex))

  // Define a function to process a single include
  async function processInclude(includePath: string, localVars: Record<string, any> = {}): Promise<string> {
    if (processedIncludes.has(includePath)) {
      // Avoid infinite recursion
      return `[Circular include: ${includePath}]`
    }

    processedIncludes.add(includePath)

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
      const includeContext = { ...context, ...localVars }

      // Process the partial content recursively
      return await processDirectives(partialContent, includeContext, includeFilePath, options)
    }
    catch (error: any) {
      return `[Error processing include: ${error.message}]`
    }
    finally {
      // Remove from processed set to allow future uses
      processedIncludes.delete(includePath)
    }
  }

  // Now process each include
  for (const match of includeMatches) {
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
  }

  // Also process legacy @partial directive (same as @include)
  const partialRegex = /@partial\s*\(['"]([^'"]+)['"](?:,\s*(\{[^}]*\}))?\)/g
  output = output.replace(partialRegex, (_, includePath, varsString) => {
    return `@include('${includePath}'${varsString ? `, ${varsString}` : ''})`
  })

  // Process one more time to handle any nested includes created by replacing partials
  if (output.includes('@include') || output.includes('@partial')) {
    output = await processIncludes(output, context, filePath, options)
  }

  return output
}

/**
 * Process conditionals (@if, @elseif, @else, @unless)
 */
function processConditionals(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @unless directives (convert to @if negation)
  output = output.replace(/@unless\s*\(([^)]+)\)([\s\S]*?)@endunless/g, (_, condition, content) => {
    return `@if (!(${condition}))${content}@endif`
  })

  // Process @if statements
  output = output.replace(/@if\s*\(([^)]+)\)([\s\S]*?)@endif/g, (_, condition, content) => {
    try {
      // eslint-disable-next-line no-new-func
      const conditionFn = new Function(...Object.keys(context), `return ${condition}`)
      const result = conditionFn(...Object.values(context))

      if (result) {
        // Find any @else or @elseif parts
        const elseParts = content.split(/@else(?:if\s*\([^)]+\))?/g)
        return elseParts[0] // Return the if part only when condition is true
      }
      else {
        // Find the else part if it exists
        const elseMatch = content.match(/@else([\s\S]*?)(?:@elseif|$)/)
        if (elseMatch) {
          return elseMatch[1]
        }

        // Find any elseif parts and evaluate them
        const elseifMatch = content.match(/@elseif\s*\(([^)]+)\)([\s\S]*?)(?:@elseif|@else|$)/)
        if (elseifMatch) {
          try {
            // eslint-disable-next-line no-new-func
            const elseifFn = new Function(...Object.keys(context), `return ${elseifMatch[1]}`)
            if (elseifFn(...Object.values(context))) {
              return elseifMatch[2]
            }
          }
          catch (error: any) {
            console.error(`Error in elseif condition in ${filePath}:`, error)
          }
        }

        return '' // Return empty if condition is false and no else/elseif is found
      }
    }
    catch (error: any) {
      console.error(`Error in if condition in ${filePath}:`, error)
      return `[Error in @if: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  return output
}

/**
 * Process loops (@foreach, @for, @while, @forelse)
 */
function processLoops(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @forelse loops (combine foreach with an empty check)
  output = output.replace(/@forelse\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@empty([\s\S]*?)@endforelse/g, (_, arrayExpr, itemVar, content, emptyContent) => {
    try {
      // eslint-disable-next-line no-new-func
      const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
      const array = arrayFn(...Object.values(context))

      if (!Array.isArray(array) || array.length === 0) {
        return emptyContent
      }

      return array.map((item) => {
        // For each item, process content with the item in context
        const itemName = itemVar.trim()
        const itemContext = { ...context, [itemName]: item, loop: {
          index: array.indexOf(item),
          iteration: array.indexOf(item) + 1,
          first: array.indexOf(item) === 0,
          last: array.indexOf(item) === array.length - 1,
          count: array.length,
        } }

        // Replace variables within the loop
        return content.replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
          try {
            // eslint-disable-next-line no-new-func
            const exprFn = new Function(...Object.keys(itemContext), `return ${expr.trim()}`)
            return String(exprFn(...Object.values(itemContext)) ?? '')
          }
          catch (error) {
            return `[Error: ${error instanceof Error ? error.message : String(error)}]`
          }
        })
      }).join('')
    }
    catch (error: any) {
      console.error(`Error in forelse in ${filePath}:`, error)
      return `[Error in @forelse: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process @foreach loops with loop variable
  output = output.replace(/@foreach\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@endforeach/g, (_, arrayExpr, itemVar, content) => {
    try {
      // eslint-disable-next-line no-new-func
      const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
      const array = arrayFn(...Object.values(context))

      if (!Array.isArray(array)) {
        return `[Error: ${arrayExpr} is not an array]`
      }

      return array.map((item, index) => {
        // For each item, process content with the item in context
        const itemName = itemVar.trim()
        // Add a loop object like Laravel's Blade
        const itemContext = {
          ...context,
          [itemName]: item,
          loop: {
            index,
            iteration: index + 1,
            first: index === 0,
            last: index === array.length - 1,
            count: array.length,
          },
        }

        // Process content
        let itemContent = content

        // Replace loop variables
        itemContent = itemContent.replace(/@loop\.(\w+)/g, (_: string, prop: string) => {
          return String(itemContext.loop[prop as keyof typeof itemContext.loop] ?? '')
        })

        // Replace variables
        itemContent = itemContent.replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
          try {
            // eslint-disable-next-line no-new-func
            const exprFn = new Function(...Object.keys(itemContext), `return ${expr.trim()}`)
            return String(exprFn(...Object.values(itemContext)) ?? '')
          }
          catch (error) {
            return `[Error: ${error instanceof Error ? error.message : String(error)}]`
          }
        })

        return itemContent
      }).join('')
    }
    catch (error: any) {
      console.error(`Error in foreach in ${filePath}:`, error)
      return `[Error in @foreach: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process @for loops
  output = output.replace(/@for\s*\(([^)]+)\)([\s\S]*?)@endfor/g, (_, forExpr, content) => {
    try {
      // Create a simple loop output function that captures the context
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // eslint-disable-next-line no-new-func
      const loopFn = new Function(...loopKeys, `
        let result = '';
        for (${forExpr}) {
          result += \`${content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
            return `\${${expr}}`
          })}\`;
        }
        return result;
      `)

      return loopFn(...loopValues)
    }
    catch (error: any) {
      console.error(`Error in for loop in ${filePath}:`, error)
      return `[Error in @for: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process @while loops
  output = output.replace(/@while\s*\(([^)]+)\)([\s\S]*?)@endwhile/g, (_, condition, content) => {
    try {
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // eslint-disable-next-line no-new-func
      const whileFn = new Function(...loopKeys, `
        let result = '';
        let maxIterations = 1000; // Safety limit
        let counter = 0;
        while (${condition} && counter < maxIterations) {
          counter++;
          result += \`${content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
            return `\${${expr}}`
          })}\`;
        }
        if (counter >= maxIterations) {
          result += '[Error: Maximum iterations exceeded in while loop]';
        }
        return result;
      `)

      return whileFn(...loopValues)
    }
    catch (error: any) {
      console.error(`Error in while loop in ${filePath}:`, error)
      return `[Error in @while: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  return output
}

/**
 * Process expressions ({{ }}, {!! !!})
 */
function processExpressions(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process shorthand echo @{{ var }} syntax
  output = output.replace(/@\{\{/g, '{\\{')

  // Process {{ expressions }} (escaped)
  output = output.replace(/\{\{([^}]+)\}\}/g, (_, expr) => {
    try {
      // eslint-disable-next-line no-new-func
      const exprFn = new Function(...Object.keys(context), `return ${expr.trim()}`)
      const result = exprFn(...Object.values(context))
      return escapeHtml(String(result ?? ''))
    }
    catch (error: any) {
      console.error(`Error evaluating expression in ${filePath}:`, error)
      return `[Error: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process {!! raw expressions !!} (unescaped)
  output = output.replace(/\{!!([^}]+)!!\}/g, (_, expr) => {
    try {
      // eslint-disable-next-line no-new-func
      const exprFn = new Function(...Object.keys(context), `return ${expr.trim()}`)
      return String(exprFn(...Object.values(context)) ?? '')
    }
    catch (error: any) {
      console.error(`Error evaluating raw expression in ${filePath}:`, error)
      return `[Error: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  return output
}

/**
 * Simple HTML escaping function
 */
function escapeHtml(html: string): string {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default plugin
