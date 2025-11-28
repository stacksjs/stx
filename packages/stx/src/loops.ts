/**
 * Module for processing loop directives (@foreach, @for, @while, @forelse)
 */

import type { StxOptions } from './types'
import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'
import { createDetailedErrorMessage } from './utils'

// Default loop configuration
const DEFAULT_MAX_WHILE_ITERATIONS = 1000
const DEFAULT_USE_ALT_LOOP_VARIABLE = false

/**
 * Process loops (@foreach, @for, @while, @forelse)
 *
 * Loop Configuration (via options.loops):
 * - maxWhileIterations: Safety limit for @while loops (default: 1000)
 * - useAltLoopVariable: Use $loop instead of loop (default: false)
 *
 * Loop Context Variables:
 * Within @foreach loops, a loop context object is available:
 * - loop.index: Current zero-based index
 * - loop.iteration: Current one-based iteration count
 * - loop.first: Boolean, true if first iteration
 * - loop.last: Boolean, true if last iteration
 * - loop.count: Total number of items
 *
 * If options.loops.useAltLoopVariable is true, use $loop instead of loop
 * to avoid conflicts with user variables named 'loop'.
 *
 * @param template - Template string to process
 * @param context - Template context with variables
 * @param filePath - Path to template file for error messages
 * @param options - Optional stx configuration
 */
export function processLoops(template: string, context: Record<string, any>, filePath: string, options?: StxOptions): string {
  let output = template

  // Process @forelse loops (combine foreach with an empty check)
  output = output.replace(/@forelse\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@empty([\s\S]*?)@endforelse/g, (match, arrayExpr, itemVar, content, emptyContent, offset) => {
    try {
      // eslint-disable-next-line no-new-func
      const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
      const array = arrayFn(...Object.values(context))

      if (!Array.isArray(array) || array.length === 0) {
        return emptyContent
      }

      return `@foreach (${arrayExpr.trim()} as ${itemVar.trim()})${content}@endforeach`
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Directive',
        `Error in @forelse(${arrayExpr.trim()} as ${itemVar.trim()}): ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Helper to find matching @foreach/@endforeach pairs using a stack
  function findMatchingForeach(template: string): { start: number, end: number, arrayExpr: string, itemVar: string, content: string } | null {
    const foreachStart = template.indexOf('@foreach')
    if (foreachStart === -1) {
      return null
    }

    // Find the opening parenthesis
    const openParen = template.indexOf('(', foreachStart)
    if (openParen === -1) {
      return null
    }

    // Find the matching closing parenthesis, handling nested parens
    let parenDepth = 1
    let pos = openParen + 1
    let closeParen = -1

    while (pos < template.length && parenDepth > 0) {
      if (template[pos] === '(') {
        parenDepth++
      }
      else if (template[pos] === ')') {
        parenDepth--
        if (parenDepth === 0) {
          closeParen = pos
          break
        }
      }
      pos++
    }

    if (closeParen === -1) {
      return null
    }

    // Extract the parameters between the parentheses
    const params = template.substring(openParen + 1, closeParen)

    // Find " as " in the params
    const asIndex = params.indexOf(' as ')
    if (asIndex === -1) {
      return null
    }

    const start = foreachStart
    const arrayExpr = params.substring(0, asIndex)
    const itemVar = params.substring(asIndex + 4)
    const contentStart = closeParen + 1

    // Now find the matching @endforeach using a stack
    let depth = 1
    let searchPos = contentStart
    const foreachRegex = /@foreach/g
    const endforeachRegex = /@endforeach/g

    while (depth > 0 && searchPos < template.length) {
      foreachRegex.lastIndex = searchPos
      endforeachRegex.lastIndex = searchPos

      const nextForeach = foreachRegex.exec(template)
      const nextEndforeach = endforeachRegex.exec(template)

      if (!nextEndforeach) {
        // No matching @endforeach found
        return null
      }

      if (nextForeach && nextForeach.index < nextEndforeach.index) {
        // Found a nested @foreach
        depth++
        searchPos = nextForeach.index + 8 // length of '@foreach'
      }
      else {
        // Found an @endforeach
        depth--
        if (depth === 0) {
          // This is our matching @endforeach
          const content = template.substring(contentStart, nextEndforeach.index)
          const end = nextEndforeach.index + 11 // length of '@endforeach'
          return { start, end, arrayExpr, itemVar, content }
        }
        searchPos = nextEndforeach.index + 11
      }
    }

    return null
  }

  // Process @foreach loops recursively from outermost to innermost
  function processForeachWithContext(template: string, ctx: Record<string, any>): string {
    let result = template

    while (true) {
      const match = findMatchingForeach(result)
      if (!match) {
        break
      }

      const { start, end, arrayExpr, itemVar, content } = match

      try {
        // eslint-disable-next-line no-new-func
        const arrayFn = new Function(...Object.keys(ctx), `return ${arrayExpr.trim()}`)
        const array = arrayFn(...Object.values(ctx))

        if (!Array.isArray(array)) {
          const errorMsg = createDetailedErrorMessage(
            'Directive',
            `Error in @foreach: ${arrayExpr.trim()} is not an array`,
            filePath,
            result,
            start,
            result.substring(start, end),
          )
          result = result.substring(0, start) + errorMsg + result.substring(end)
          continue
        }

        // Get loop configuration (useAltLoopVar reserved for future use when exclusively using $loop)
        const _useAltLoopVar = options?.loops?.useAltLoopVariable ?? DEFAULT_USE_ALT_LOOP_VARIABLE

        let loopResult = ''
        for (let index = 0; index < array.length; index++) {
          const item = array[index]
          const itemName = itemVar.trim()

          // Create loop context object
          const loopContext = {
            index,
            iteration: index + 1,
            first: index === 0,
            last: index === array.length - 1,
            count: array.length,
          }

          // Create a new context with loop variable for this iteration
          // Always provide both loop and $loop for maximum compatibility
          const itemContext = {
            ...ctx,
            [itemName]: item,
            loop: loopContext,
            $loop: loopContext, // Alternative name to avoid conflicts with user's 'loop' variable
          }

          // Recursively process nested loops with the new context
          let processedContent = processForeachWithContext(content, itemContext)

          // Then process conditionals with the item context
          processedContent = processConditionals(processedContent, itemContext, filePath)

          // Finally process expressions with the item context
          processedContent = processExpressions(processedContent, itemContext, filePath)

          loopResult += processedContent
        }

        // Replace the @foreach block with the processed result
        result = result.substring(0, start) + loopResult + result.substring(end)
      }
      catch (error: any) {
        const errorMsg = createDetailedErrorMessage(
          'Directive',
          `Error in @foreach(${arrayExpr.trim()} as ${itemVar.trim()}): ${error instanceof Error ? error.message : String(error)}`,
          filePath,
          result,
          start,
          result.substring(start, end),
        )
        result = result.substring(0, start) + errorMsg + result.substring(end)
      }
    }

    return result
  }

  output = processForeachWithContext(output, context)

  // Process @for loops
  output = output.replace(/@for\s*\(([^)]+)\)([\s\S]*?)@endfor/g, (match, forExpr, content, offset) => {
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
      return createDetailedErrorMessage(
        'Directive',
        `Error in @for(${forExpr}): ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  // Process @while loops
  // Get configurable max iterations (default: 1000)
  const maxWhileIterations = options?.loops?.maxWhileIterations ?? DEFAULT_MAX_WHILE_ITERATIONS

  output = output.replace(/@while\s*\(([^)]+)\)([\s\S]*?)@endwhile/g, (match, condition, content, offset) => {
    try {
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // eslint-disable-next-line no-new-func
      const whileFn = new Function(...loopKeys, `
        let result = '';
        let maxIterations = ${maxWhileIterations}; // Configurable safety limit
        let counter = 0;
        while (${condition} && counter < maxIterations) {
          counter++;
          result += \`${content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (match: string, expr: string) => {
            return `\${${expr}}`
          })}\`;
        }
        if (counter >= maxIterations) {
          result += '[Error: Maximum iterations (${maxWhileIterations}) exceeded in while loop. Configure via options.loops.maxWhileIterations]';
        }
        return result;
      `)

      return whileFn(...loopValues)
    }
    catch (error: any) {
      return createDetailedErrorMessage(
        'Directive',
        `Error in @while(${condition}): ${error instanceof Error ? error.message : String(error)}`,
        filePath,
        template,
        offset,
        match,
      )
    }
  })

  return output
}
