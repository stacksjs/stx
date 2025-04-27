/**
 * Module for processing loop directives (@foreach, @for, @while, @forelse)
 */

import { processConditionals } from './conditionals'
import { processExpressions } from './expressions'
import { createDetailedErrorMessage } from './utils'

/**
 * Process loops (@foreach, @for, @while, @forelse)
 */
export function processLoops(template: string, context: Record<string, any>, filePath: string): string {
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

  // Process @foreach loops with loop variable
  const processForeachLoops = () => {
    let hasMatches = false

    output = output.replace(/@foreach\s*\(([^)]+)as([^)]+)\)([\s\S]*?)@endforeach/g, (match, arrayExpr, itemVar, content, offset) => {
      hasMatches = true

      try {
        // eslint-disable-next-line no-new-func
        const arrayFn = new Function(...Object.keys(context), `return ${arrayExpr.trim()}`)
        const array = arrayFn(...Object.values(context))

        if (!Array.isArray(array)) {
          return createDetailedErrorMessage(
            'Directive',
            `Error in @foreach: ${arrayExpr.trim()} is not an array`,
            filePath,
            template,
            offset,
            match,
          )
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
        return createDetailedErrorMessage(
          'Directive',
          `Error in @foreach(${arrayExpr.trim()} as ${itemVar.trim()}): ${error instanceof Error ? error.message : String(error)}`,
          filePath,
          template,
          offset,
          match,
        )
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
  output = output.replace(/@while\s*\(([^)]+)\)([\s\S]*?)@endwhile/g, (match, condition, content, offset) => {
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
