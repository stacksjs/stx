/**
 * Module for processing loop directives (@foreach, @for, @while, @forelse)
 *
 * Supports loop control directives:
 * - `@break` - Exit the loop immediately
 * - `@break(condition)` - Exit if condition is true
 * - `@continue` - Skip to next iteration
 * - `@continue(condition)` - Skip if condition is true
 *
 * @foreach syntax variants:
 * - `@foreach(items as item)` - Basic iteration
 * - `@foreach(items as index => item)` - With index variable
 *
 * @example Basic iteration
 * ```html
 * @foreach(items as item)
 *   {{ item.name }}
 * @endforeach
 * ```
 *
 * @example With index variable
 * ```html
 * @foreach(items as index => item)
 *   {{ index }}: {{ item.name }}
 *   @if(index === 0)
 *     (first item)
 *   @endif
 * @endforeach
 * ```
 *
 * @example With loop control
 * ```html
 * @foreach(items as item)
 *   @if(item.skip)
 *     @continue
 *   @endif
 *   @if(item.stop)
 *     @break
 *   @endif
 *   {{ item.name }}
 * @endforeach
 * ```
 */

import type { StxOptions } from './types'
import { processConditionals } from './conditionals'
import { ErrorCodes, inlineError } from './error-handling'
import { processExpressions } from './expressions'
import { findDirectiveBlocks, findMatchingDelimiter } from './parser'
import { createSafeFunction, isExpressionSafe, isForExpressionSafe, sanitizeExpression, safeEvaluate } from './safe-evaluator'

// Default loop configuration
const DEFAULT_MAX_WHILE_ITERATIONS = 1000
const DEFAULT_USE_ALT_LOOP_VARIABLE = false

/**
 * Replace directive calls with balanced parenthesis matching.
 * Handles expressions with nested parens like @break(items.find(x => x.done)).
 */
function replaceWithBalancedParens(
  template: string,
  directive: string,
  callback: (expr: string) => string,
): string {
  let result = template
  const pattern = new RegExp(`${directive.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\(`)
  let match: RegExpExecArray | null

  while ((match = pattern.exec(result)) !== null) {
    const start = match.index
    const openParen = start + match[0].length - 1
    let depth = 1
    let pos = openParen + 1
    while (pos < result.length && depth > 0) {
      if (result[pos] === '(') depth++
      else if (result[pos] === ')') { depth--; if (depth === 0) break }
      pos++
    }
    if (depth !== 0) break
    const expr = result.substring(openParen + 1, pos)
    const replacement = callback(expr)
    result = result.substring(0, start) + replacement + result.substring(pos + 1)
  }
  return result
}

// =============================================================================
// Dynamic Prop Binding Processing
// =============================================================================

/**
 * Process :prop="expression" and :prop (shorthand) bindings within loop content.
 * Evaluates expressions against the loop context and converts them to
 * __stx_prop="serialized_json" format so components can receive the data.
 *
 * Shorthand syntax: :propName is equivalent to :propName="propName"
 * This allows cleaner code when the prop name matches the variable name.
 *
 * @param content - The content to process
 * @param context - The current loop iteration context
 * @returns Content with bindings evaluated and serialized
 */
function processPropBindings(content: string, context: Record<string, any>): string {
  let result = content

  // First, expand shorthand :prop to :prop="prop"
  // Match :propName that is NOT followed by = (with optional whitespace)
  // The prop must be followed by whitespace, /> or > (end of tag attributes)
  result = result.replace(/:([a-zA-Z_][a-zA-Z0-9_-]*)(?=\s+[^=]|\s*\/?>|\s*$)/g, (match, propName) => {
    // Only expand if the prop name exists in context
    if (propName in context) {
      return `:${propName}="${propName}"`
    }
    // Keep original if not in context (might be processed later)
    return match
  })

  // Now process all :prop="expression" bindings
  result = result.replace(/:([a-zA-Z_][a-zA-Z0-9_-]*)\s*=\s*"([^"]*)"/g, (match, propName, expression) => {
    try {
      // Evaluate the expression in the loop context using safe evaluation
      const contextKeys = Object.keys(context)
      const contextValues = Object.values(context)
      sanitizeExpression(expression)
      const evaluator = createSafeFunction(expression, contextKeys)
      const value = evaluator(...contextValues)

      // Serialize the value to JSON and encode for safe HTML attribute storage
      // Use a special attribute prefix __stx_ to mark it as pre-evaluated
      const serialized = JSON.stringify(value)
      // Escape HTML entities in the JSON string for safe attribute value
      const escaped = serialized
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      return `__stx_${propName}="${escaped}"`
    }
    catch (error) {
      // If evaluation fails, keep the original binding for later processing
      return match
    }
  })

  return result
}

// =============================================================================
// Loop Control Markers
// =============================================================================

/**
 * Special markers used to communicate break/continue from processed content
 */
const BREAK_MARKER = '<!--__STX_BREAK__-->'
const CONTINUE_MARKER = '<!--__STX_CONTINUE__-->'

/**
 * Process conditional @break(condition) and @continue(condition) directives.
 * These are evaluated immediately based on the condition.
 *
 * @param content - Loop iteration content
 * @param context - Current iteration context
 * @returns Processed content with break/continue markers where conditions were true
 */
function processConditionalLoopControl(
  content: string,
  context: Record<string, any>,
): string {
  let result = content

  // Process @break(condition) - conditional break using safe evaluation (balanced parens)
  result = replaceWithBalancedParens(result, '@break', (condition) => {
    try {
      const conditionTrimmed = condition.trim()
      const boolExpr = `!!(${conditionTrimmed})`
      let shouldBreak: boolean
      if (isExpressionSafe(boolExpr)) {
        const condFn = createSafeFunction(boolExpr, Object.keys(context))
        shouldBreak = Boolean(condFn(...Object.values(context)))
      }
      else {
        shouldBreak = Boolean(safeEvaluate(boolExpr, context))
      }
      return shouldBreak ? BREAK_MARKER : ''
    }
    catch {
      return '' // On error, don't break
    }
  })

  // Process @continue(condition) - conditional continue using safe evaluation (balanced parens)
  result = replaceWithBalancedParens(result, '@continue', (condition) => {
    try {
      const conditionTrimmed = condition.trim()
      const boolExpr = `!!(${conditionTrimmed})`
      let shouldContinue: boolean
      if (isExpressionSafe(boolExpr)) {
        const condFn = createSafeFunction(boolExpr, Object.keys(context))
        shouldContinue = Boolean(condFn(...Object.values(context)))
      }
      else {
        shouldContinue = Boolean(safeEvaluate(boolExpr, context))
      }
      return shouldContinue ? CONTINUE_MARKER : ''
    }
    catch {
      return '' // On error, don't continue
    }
  })

  return result
}

/**
 * Process unconditional @break and @continue directives.
 * These should be called AFTER conditionals are processed, so @break/@continue
 * inside @if blocks are only visible when the condition is true.
 *
 * @param content - Loop iteration content (after conditionals processed)
 * @returns Processed content with break/continue markers
 */
function processUnconditionalLoopControl(content: string): string {
  let result = content

  // Process @break - unconditional break
  result = result.replace(/@break(?!\()/g, BREAK_MARKER)

  // Process @continue - unconditional continue
  result = result.replace(/@continue(?!\()/g, CONTINUE_MARKER)

  return result
}

/**
 * Check if content contains a break marker and clean it up
 */
function checkAndCleanBreak(content: string): { hasBreak: boolean, content: string } {
  const hasBreak = content.includes(BREAK_MARKER)
  // Remove marker and everything after it
  const cleanContent = hasBreak
    ? content.substring(0, content.indexOf(BREAK_MARKER))
    : content
  return { hasBreak, content: cleanContent }
}

/**
 * Check if content contains a continue marker and clean it up
 */
function checkAndCleanContinue(content: string): { hasContinue: boolean, content: string } {
  const hasContinue = content.includes(CONTINUE_MARKER)
  // Remove marker and everything after it
  const cleanContent = hasContinue
    ? content.substring(0, content.indexOf(CONTINUE_MARKER))
    : content
  return { hasContinue, content: cleanContent }
}

/**
 * Convert @break/@continue directives to JavaScript statements for @for/@while loops.
 * These loops execute as JavaScript, so we need native break/continue.
 *
 * @param content - Loop body content
 * @returns Content with directives converted to JS statements
 */
function convertLoopControlToJS(content: string): string {
  let result = content

  // Convert @break(condition) to JavaScript: if (condition) { break; } — balanced parens
  result = replaceWithBalancedParens(result, '@break', (condition) => {
    return `\`; if (${condition.trim()}) { break; } result += \``
  })

  // Convert @continue(condition) to JavaScript: if (condition) { continue; } — balanced parens
  result = replaceWithBalancedParens(result, '@continue', (condition) => {
    return `\`; if (${condition.trim()}) { continue; } result += \``
  })

  // Convert unconditional @break to JavaScript break
  result = result.replace(/@break(?!\()/g, '`; break; result += `')

  // Convert unconditional @continue to JavaScript continue
  result = result.replace(/@continue(?!\()/g, '`; continue; result += `')

  return result
}

// =============================================================================
// Forelse Processing (balanced parsing)
// =============================================================================

/**
 * Find the next outermost @forelse block using balanced parsing.
 * Returns null if no (outermost) @forelse found.
 */
function findOutermostForelse(template: string): {
  start: number
  end: number
  arrayExpr: string
  itemVar: string
  foreachContent: string
  emptyContent: string
} | null {
  const forelseRegex = /@forelse\s*\(/g
  let match

  // Pre-compute foreach depth at each position for O(n) performance
  // Build sorted event list once, then binary search for depth at any position
  const foreachEvents: { pos: number, delta: number }[] = []
  const foreachOpenScan = /@foreach\s*\(/g
  const foreachCloseScan = /@endforeach/g
  let scanM: RegExpExecArray | null
  while ((scanM = foreachOpenScan.exec(template)) !== null) foreachEvents.push({ pos: scanM.index, delta: 1 })
  while ((scanM = foreachCloseScan.exec(template)) !== null) foreachEvents.push({ pos: scanM.index, delta: -1 })
  foreachEvents.sort((a, b) => a.pos - b.pos)
  // Build prefix depth array
  const depthAtEvent: { pos: number, depth: number }[] = []
  let runningDepth = 0
  for (const ev of foreachEvents) {
    runningDepth += ev.delta
    depthAtEvent.push({ pos: ev.pos, depth: runningDepth })
  }
  function getForeachDepthAt(position: number): number {
    // Binary search for largest event pos <= position
    let lo = 0, hi = depthAtEvent.length - 1, result = 0
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (depthAtEvent[mid].pos <= position) { result = depthAtEvent[mid].depth; lo = mid + 1 }
      else hi = mid - 1
    }
    return result
  }

  while ((match = forelseRegex.exec(template)) !== null) {
    // Check if this @forelse is inside an unclosed @foreach block (O(log n) lookup)
    if (getForeachDepthAt(match.index) > 0) {
      // This @forelse is inside a @foreach — skip it, let foreach iteration handle it
      continue
    }

  const forelseStart = match.index
  const openParen = match.index + match[0].length - 1

  // Find balanced closing paren
  let parenDepth = 1
  let pos = openParen + 1
  let closeParen = -1
  while (pos < template.length && parenDepth > 0) {
    if (template[pos] === '(') parenDepth++
    else if (template[pos] === ')') {
      parenDepth--
      if (parenDepth === 0) { closeParen = pos; break }
    }
    pos++
  }
  if (closeParen === -1) continue

  const params = template.substring(openParen + 1, closeParen)
  const asIndex = params.indexOf(' as ')
  if (asIndex === -1) continue

  const arrayExpr = params.substring(0, asIndex).trim()
  const itemVar = params.substring(asIndex + 4).trim()
  const contentStart = closeParen + 1

  // Find matching @endforelse using depth tracking
  let depth = 1
  let searchPos = contentStart
  const nestedForelseRegex = /@forelse\s*\(/g
  const endForelseRegex = /@endforelse/g
  let endForelsePos = -1

  while (depth > 0 && searchPos < template.length) {
    nestedForelseRegex.lastIndex = searchPos
    endForelseRegex.lastIndex = searchPos
    const nextOpen = nestedForelseRegex.exec(template)
    const nextClose = endForelseRegex.exec(template)
    if (!nextClose) break
    if (nextOpen && nextOpen.index < nextClose.index) {
      depth++
      searchPos = nextOpen.index + nextOpen[0].length
    } else {
      depth--
      if (depth === 0) { endForelsePos = nextClose.index; break }
      searchPos = nextClose.index + '@endforelse'.length
    }
  }
  if (endForelsePos === -1) continue

  const fullContent = template.substring(contentStart, endForelsePos)
  const fullEnd = endForelsePos + '@endforelse'.length

  // Find @empty at the top level (not inside nested @forelse)
  let emptyPos = -1
  let nestedDepth = 0
  for (let i = 0; i < fullContent.length; i++) {
    const remaining = fullContent.substring(i)
    if (remaining.match(/^@forelse\s*\(/)) {
      nestedDepth++
    } else if (remaining.startsWith('@endforelse')) {
      nestedDepth--
    } else if (nestedDepth === 0 && remaining.startsWith('@empty')) {
      if (fullContent.length <= i + 6 || !/[a-z]/i.test(fullContent[i + 6])) {
        emptyPos = i
        break
      }
    }
  }

  if (emptyPos === -1) {
    // No @empty found, skip to next @forelse
    continue
  }

  return {
    start: forelseStart,
    end: fullEnd,
    arrayExpr,
    itemVar,
    foreachContent: fullContent.substring(0, emptyPos),
    emptyContent: fullContent.substring(emptyPos + '@empty'.length),
  }
  } // end while loop over forelseRegex matches

  return null
}

/**
 * Process only outermost @forelse blocks.
 * Inner @forelse blocks are left for the @foreach processor to handle during iteration.
 */
function processForelse(template: string, context: Record<string, any>): string {
  let output = template

  while (true) {
    const found = findOutermostForelse(output)
    if (!found) break

    const { start, end, arrayExpr, itemVar, foreachContent, emptyContent } = found

    try {
      let array: unknown
      if (isExpressionSafe(arrayExpr)) {
        const arrayFn = createSafeFunction(arrayExpr, Object.keys(context))
        array = arrayFn(...Object.values(context))
      } else {
        array = safeEvaluate(arrayExpr, context)
      }

      let replacement: string
      if (!Array.isArray(array) || array.length === 0) {
        replacement = emptyContent
      } else {
        replacement = `@foreach (${arrayExpr} as ${itemVar})${foreachContent}@endforeach`
      }

      output = output.substring(0, start) + replacement + output.substring(end)
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error)
      const replacement = inlineError('Forelse', `Error in @forelse(${arrayExpr} as ${itemVar}): ${errMsg}`, ErrorCodes.EVALUATION_ERROR)
      output = output.substring(0, start) + replacement + output.substring(end)
    }
  }

  return output
}

// =============================================================================
// Loop Processing
// =============================================================================

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

  // Process @forelse loops using balanced parsing (handles nested parens and nested @forelse)
  output = processForelse(output, context)

  // Helper to find matching @foreach/@endforeach pairs using a stack
  function findMatchingForeach(template: string): { start: number, end: number, arrayExpr: string, itemVar: string, content: string } | null {
    // Use regex to find @foreach followed immediately by ( (with optional whitespace)
    const foreachRegex = /@foreach\s*\(/g
    let match

    // Keep searching until we find a valid @foreach directive or run out of matches
    while ((match = foreachRegex.exec(template)) !== null) {
      const foreachStart = match.index
      // The opening paren is at the end of the match (minus 1 since match includes the paren)
      const openParen = match.index + match[0].length - 1

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
        // No matching closing paren, try next match
        continue
      }

      // Extract the parameters between the parentheses
      const params = template.substring(openParen + 1, closeParen)

      // Find " as " in the params - this is required for a valid @foreach
      const asIndex = params.indexOf(' as ')
      if (asIndex === -1) {
        // Not a valid @foreach directive (e.g., "@foreach (Blade-style)"), try next match
        continue
      }

      const start = foreachStart
      const arrayExpr = params.substring(0, asIndex)
      const itemVar = params.substring(asIndex + 4)
      const contentStart = closeParen + 1

      // Now find the matching @endforeach using a stack
      let depth = 1
      let searchPos = contentStart
      // Use pattern that matches actual @foreach directives (with parenthesis) to avoid matching text/comments
      const nestedForeachRegex = /@foreach\s*\(/g
      const endforeachRegex = /@endforeach/g

      while (depth > 0 && searchPos < template.length) {
        nestedForeachRegex.lastIndex = searchPos
        endforeachRegex.lastIndex = searchPos

        const nextForeach = nestedForeachRegex.exec(template)
        const nextEndforeach = endforeachRegex.exec(template)

        if (!nextEndforeach) {
          // No matching @endforeach found for this @foreach, try next match
          break
        }

        if (nextForeach && nextForeach.index < nextEndforeach.index) {
          // Found a nested @foreach
          depth++
          searchPos = nextForeach.index + nextForeach[0].length
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
      // If we reach here, this @foreach didn't have a matching @endforeach, try next match
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
        // Evaluate array expression using safe evaluation
        const trimmedArrayExpr = arrayExpr.trim()
        let array: unknown
        if (isExpressionSafe(trimmedArrayExpr)) {
          const arrayFn = createSafeFunction(trimmedArrayExpr, Object.keys(ctx))
          array = arrayFn(...Object.values(ctx))
        }
        else {
          array = safeEvaluate(trimmedArrayExpr, ctx)
        }

        if (!Array.isArray(array)) {
          const errorMsg = inlineError('Foreach', `Error in @foreach: ${trimmedArrayExpr} is not an array`, ErrorCodes.TYPE_ERROR)
          result = result.substring(0, start) + errorMsg + result.substring(end)
          continue
        }

        // Get loop configuration (useAltLoopVar reserved for future use when exclusively using $loop)
        const _useAltLoopVar = options?.loops?.useAltLoopVariable ?? DEFAULT_USE_ALT_LOOP_VARIABLE

        // Parse itemVar to check for index syntax: "index => item" or just "item"
        const trimmedItemVar = itemVar.trim()
        let indexName: string | null = null
        let itemName: string

        if (trimmedItemVar.includes('=>')) {
          // Syntax: @foreach (items as index => item)
          const parts = trimmedItemVar.split('=>').map(p => p.trim())
          if (parts.length === 2) {
            indexName = parts[0]
            itemName = parts[1]
          }
          else {
            // Invalid syntax, use the whole thing as item name
            itemName = trimmedItemVar
          }
        }
        else {
          // Syntax: @foreach (items as item)
          itemName = trimmedItemVar
        }

        let loopResult = ''
        for (let index = 0; index < array.length; index++) {
          const item = array[index]

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
          const itemContext: Record<string, any> = {
            ...ctx,
            [itemName]: item,
            loop: loopContext,
            $loop: loopContext, // Alternative name to avoid conflicts with user's 'loop' variable
          }

          // Add index variable if using "index => item" syntax
          if (indexName) {
            itemContext[indexName] = index
          }

          // Step 1: Process conditional @break(condition) and @continue(condition)
          // These are evaluated immediately based on the condition expression
          let processedContent = processConditionalLoopControl(content, itemContext)

          // Check for continue marker from conditional @continue(condition)
          let continueCheck = checkAndCleanContinue(processedContent)
          if (continueCheck.hasContinue) {
            loopResult += continueCheck.content
            continue
          }

          // Check for break marker from conditional @break(condition)
          let breakCheck = checkAndCleanBreak(processedContent)
          if (breakCheck.hasBreak) {
            loopResult += breakCheck.content
            break
          }

          // Step 2a: Process any nested @forelse blocks with the iteration context
          processedContent = processForelse(processedContent, itemContext)

          // Step 2b: Recursively process nested loops with the new context
          processedContent = processForeachWithContext(processedContent, itemContext)

          // Step 3: Process conditionals with the item context
          // This evaluates @if/@else blocks and may reveal @break/@continue inside them
          processedContent = processConditionals(processedContent, itemContext, filePath)

          // Step 4: Process unconditional @break and @continue
          // Now that conditionals are processed, @break/@continue from @if blocks are visible
          processedContent = processUnconditionalLoopControl(processedContent)

          // Check for break/continue markers
          breakCheck = checkAndCleanBreak(processedContent)
          if (breakCheck.hasBreak) {
            loopResult += breakCheck.content
            break
          }
          continueCheck = checkAndCleanContinue(processedContent)
          if (continueCheck.hasContinue) {
            loopResult += continueCheck.content
            continue
          }

          // Step 5: Process expressions with the item context
          processedContent = processExpressions(processedContent, itemContext, filePath)

          // Step 6: Process :prop="expression" bindings
          // This converts :prop="loopVar" to __stx_prop="serialized_data" so components
          // can receive the data even after the loop context is gone
          processedContent = processPropBindings(processedContent, itemContext)

          loopResult += processedContent
        }

        // Replace the @foreach block with the processed result
        result = result.substring(0, start) + loopResult + result.substring(end)
      }
      catch (error: unknown) {
        const errorMsg = inlineError('Foreach', `Error in @foreach(${arrayExpr.trim()} as ${itemVar.trim()}): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
        result = result.substring(0, start) + errorMsg + result.substring(end)
      }
    }

    return result
  }

  output = processForeachWithContext(output, context)

  // Process @for loops using proper parsing for nested parentheses
  output = processForLoops(output, context)

  // Process @while loops using proper parsing for nested parentheses
  // Get configurable max iterations (default: 1000)
  const maxWhileIterations = options?.loops?.maxWhileIterations ?? DEFAULT_MAX_WHILE_ITERATIONS
  output = processWhileLoops(output, context, maxWhileIterations)

  return output
}

// =============================================================================
// @for and @while loop processing with proper parsing
// =============================================================================

/**
 * Validate a for loop expression for basic structure
 * Uses the safe evaluator's isForExpressionSafe for validation
 * Allows: "let i = 0; i < n; i++" or "const x of items" etc.
 */
function validateForExpression(expr: string): boolean {
  return isForExpressionSafe(expr)
}

/**
 * Process @for loops with proper parsing for nested parentheses
 */
function processForLoops(template: string, context: Record<string, any>): string {
  let output = template
  let processedAny = true

  while (processedAny) {
    processedAny = false

    // Find @for( using proper parsing
    const forMatch = output.match(/@for\s*\(/)
    if (!forMatch || forMatch.index === undefined) {
      break
    }

    const startPos = forMatch.index
    const openParenPos = startPos + forMatch[0].length - 1

    // Use proper delimiter matching for the expression
    const closeParenPos = findMatchingDelimiter(output, '(', ')', openParenPos)
    if (closeParenPos === -1) {
      break
    }

    const forExpr = output.slice(openParenPos + 1, closeParenPos)
    const _contentStart = closeParenPos + 1 // Used for position tracking

    // Find @endfor using the parser
    const forBlocks = findDirectiveBlocks(output.slice(startPos), 'for', 'endfor')
    if (forBlocks.length === 0) {
      break
    }

    const content = forBlocks[0].content
    const endPos = startPos + forBlocks[0].end

    // Validate the for expression
    if (!validateForExpression(forExpr)) {
      const errorMsg = inlineError('For', `Unsafe expression in @for: ${forExpr}`, ErrorCodes.UNSAFE_EXPRESSION)
      output = output.substring(0, startPos) + errorMsg + output.substring(endPos)
      processedAny = true
      continue
    }

    try {
      // Create a simple loop output function that captures the context
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // Process break/continue directives
      let processedContent = content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (_match: string, expr: string) => {
        return `\${${expr}}`
      })
      processedContent = convertLoopControlToJS(processedContent)

      // eslint-disable-next-line no-new-func
      const loopFn = new Function(...loopKeys, `
        let result = '';
        for (${forExpr}) {
          result += \`${processedContent}\`;
        }
        return result;
      `)

      const result = loopFn(...loopValues)
      output = output.substring(0, startPos) + result + output.substring(endPos)
      processedAny = true
    }
    catch (error: unknown) {
      const errorMsg = inlineError('For', `Error in @for(${forExpr}): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
      output = output.substring(0, startPos) + errorMsg + output.substring(endPos)
      processedAny = true
    }
  }

  return output
}

/**
 * Process @while loops with proper parsing for nested parentheses
 */
function processWhileLoops(template: string, context: Record<string, any>, maxIterations: number): string {
  let output = template
  let processedAny = true

  while (processedAny) {
    processedAny = false

    // Find @while( using proper parsing
    const whileMatch = output.match(/@while\s*\(/)
    if (!whileMatch || whileMatch.index === undefined) {
      break
    }

    const startPos = whileMatch.index
    const openParenPos = startPos + whileMatch[0].length - 1

    // Use proper delimiter matching for the condition
    const closeParenPos = findMatchingDelimiter(output, '(', ')', openParenPos)
    if (closeParenPos === -1) {
      break
    }

    const condition = output.slice(openParenPos + 1, closeParenPos)

    // Find @endwhile using the parser
    const whileBlocks = findDirectiveBlocks(output.slice(startPos), 'while', 'endwhile')
    if (whileBlocks.length === 0) {
      break
    }

    const content = whileBlocks[0].content
    const endPos = startPos + whileBlocks[0].end

    // Validate the condition
    if (!validateForExpression(condition)) {
      const errorMsg = inlineError('While', `Unsafe expression in @while: ${condition}`, ErrorCodes.UNSAFE_EXPRESSION)
      output = output.substring(0, startPos) + errorMsg + output.substring(endPos)
      processedAny = true
      continue
    }

    try {
      const loopKeys = Object.keys(context)
      const loopValues = Object.values(context)

      // Process break/continue directives
      let processedContent = content.replace(/`/g, '\\`').replace(/\{\{([^}]+)\}\}/g, (_match: string, expr: string) => {
        return `\${${expr}}`
      })
      processedContent = convertLoopControlToJS(processedContent)

      // eslint-disable-next-line no-new-func
      const whileFn = new Function(...loopKeys, `
        let result = '';
        let maxIterations = ${maxIterations}; // Configurable safety limit
        let counter = 0;
        while (${condition} && counter < maxIterations) {
          counter++;
          result += \`${processedContent}\`;
        }
        if (counter >= maxIterations) {
          result += '<!-- [While Error [1104]]: Maximum iterations (${maxIterations}) exceeded in while loop. Configure via options.loops.maxWhileIterations -->';
        }
        return result;
      `)

      const result = whileFn(...loopValues)
      output = output.substring(0, startPos) + result + output.substring(endPos)
      processedAny = true
    }
    catch (error: unknown) {
      const errorMsg = inlineError('While', `Error in @while(${condition}): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
      output = output.substring(0, startPos) + errorMsg + output.substring(endPos)
      processedAny = true
    }
  }

  return output
}
