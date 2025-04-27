/**
 * Module for processing loop directives (@foreach, @for, @while, @forelse)
 */

import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'

/**
 * Process loops (@foreach, @for, @while, @forelse)
 */
export function processLoops(template: string, context: Record<string, any>, filePath: string): string {
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

      return `@foreach (${arrayExpr.trim()} as ${itemVar.trim()})${content}@endforeach`
    }
    catch (error: any) {
      console.error(`Error in forelse in ${filePath}:`, error)
      return `[Error in @forelse: ${error instanceof Error ? error.message : String(error)}]`
    }
  })

  // Process @foreach loops with loop variable
  const processForeachLoops = () => {
    let hasMatches = false

    output = output.replace(/@foreach\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@endforeach/g, (_, arrayExpr, itemVar, content) => {
      hasMatches = true

      try {
        // eslint-disable-next-line no-new-func
        const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
        const array = arrayFn(...Object.values(context))

        if (!Array.isArray(array)) {
          return `[Error: ${arrayExpr} is not an array]`
        }

        let result = ''
        for (let index = 0; index < array.length; index++) {
          const item = array[index]
          const itemName = itemVar.trim()

          // Create a new context with loop variable for this iteration
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

          // Process content with item context
          // We need to handle nested directives within the loop
          let processedContent = content

          // Process any nested conditionals in this item's context
          processedContent = processConditionals(processedContent, itemContext, filePath)

          // Process any expressions within this loop iteration
          processedContent = processExpressions(processedContent, itemContext, filePath)

          result += processedContent
        }

        return result
      }
      catch (error: any) {
        console.error(`Error in foreach in ${filePath}:`, error)
        return `[Error in @foreach: ${error instanceof Error ? error.message : String(error)}]`
      }
    })

    return hasMatches
  }

  // Process nested loops until no more matches are found
  let iterations = 0
  const MAX_ITERATIONS = 10 // Prevent infinite loop

  while (processForeachLoops() && iterations < MAX_ITERATIONS) {
    iterations++
  }

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
