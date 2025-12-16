/**
 * Module for processing conditional directives (@if, @elseif, @else, @unless)
 *
 * Regex Pattern Reference:
 * ========================
 *
 * NESTED_PARENS_PATTERN: `(?:[^()]|\([^()]*\))*`
 *   - Matches content with one level of nested parentheses
 *   - `[^()]` - Match any character except parentheses
 *   - `\([^()]*\)` - OR match balanced parentheses (one level deep)
 *   - Used in: @switch, @case, @if expressions to handle function calls
 *   - Example matches: `user.role`, `getRole()`, `check(a, b)`
 *   - Limitation: Only handles ONE level of nesting. `fn(a(b))` won't work correctly.
 *
 * DIRECTIVE_WITH_CONTENT: `@directive\s*\(EXPR\)([\s\S]*?)@enddirective`
 *   - `\s*` - Optional whitespace after directive name
 *   - `\(EXPR\)` - Parenthesized expression
 *   - `[\s\S]*?` - Non-greedy match of ANY content (including newlines)
 *   - `?` makes it non-greedy to match shortest possible content
 *
 * IF_ELSEIF_ELSE: Complex multi-branch matching
 *   - Processes from inside-out to handle nesting
 *   - Each @elseif/@else creates a branch in the condition chain
 */

import process from 'node:process'
import { evaluateAuthExpression } from './auth'
import { ErrorCodes, inlineError } from './error-handling'
import { findIfBlocks, parseSwitchBlock } from './parser'
import { createSafeFunction, isExpressionSafe, safeEvaluate } from './safe-evaluator'

// =============================================================================
// Regex Patterns
// =============================================================================

/**
 * Pattern for matching content with one level of nested parentheses.
 * Used throughout conditionals for expression parsing.
 *
 * Structure: `(?:[^()]|\([^()]*\))*`
 * - `(?:...)` - Non-capturing group
 * - `[^()]` - Any char except parens
 * - `|` - OR
 * - `\([^()]*\)` - Balanced parens with no nested parens inside
 * - `*` - Zero or more of either option
 */
const _NESTED_PARENS_PATTERN = '(?:[^()]|\\([^()]*\\))*'

/**
 * Helper function to find balanced @switch/@endswitch pairs
 *
 * @deprecated Use parseSwitchBlock from ./parser instead
 *
 * Uses depth-tracking algorithm:
 * 1. Start with depth=1 (we're inside a @switch)
 * 2. Increment depth for each nested @switch found
 * 3. Decrement depth for each @endswitch found
 * 4. Return when depth reaches 0 (found matching @endswitch)
 */
function _findBalancedSwitch(content: string, startIndex: number): { end: number, switchContent: string } | null {
  let depth = 1
  let currentIndex = startIndex

  while (currentIndex < content.length && depth > 0) {
    // Uses NESTED_PARENS_PATTERN - see module documentation for regex explanation
    const switchMatch = content.substring(currentIndex).match(/@switch\s*\(((?:[^()]|\([^()]*\))*)\)/)
    const endSwitchMatch = content.substring(currentIndex).match(/@endswitch/)

    const nextSwitch = switchMatch ? currentIndex + switchMatch.index! : Infinity
    const nextEnd = endSwitchMatch ? currentIndex + endSwitchMatch.index! : Infinity

    if (nextSwitch < nextEnd) {
      depth++
      currentIndex = nextSwitch + switchMatch![0].length
    }
    else if (nextEnd < Infinity) {
      depth--
      if (depth === 0) {
        return {
          end: nextEnd,
          switchContent: content.substring(startIndex, nextEnd),
        }
      }
      currentIndex = nextEnd + endSwitchMatch![0].length
    }
    else {
      break
    }
  }

  return null
}

/**
 * Process switch statements (@switch, @case, @default)
 *
 * Uses the parser module for proper handling of:
 * - Nested parentheses in expressions (e.g., @switch(fn(a, fn(b))))
 * - Nested @switch blocks
 * - @break directives
 */
export function processSwitchStatements(template: string, context: Record<string, any>, _filePath: string): string {
  let output = template
  let processedAny = true

  // Keep processing until no more switches are found (to handle nested switches)
  while (processedAny) {
    processedAny = false

    // Find the first @switch statement using the new parser
    const switchMatch = output.match(/@switch\s*\(/)
    if (!switchMatch || switchMatch.index === undefined) {
      break
    }

    const switchStart = switchMatch.index

    // Use the parser to properly parse the switch block
    const parsed = parseSwitchBlock(output, switchStart)
    if (!parsed) {
      break
    }

    try {
      // Evaluate the switch expression using safe evaluation
      let switchValue: unknown
      if (isExpressionSafe(parsed.expression)) {
        const exprFn = createSafeFunction(parsed.expression, Object.keys(context))
        switchValue = exprFn(...Object.values(context))
      }
      else {
        // Fall back to safe evaluator for potentially unsafe expressions
        switchValue = safeEvaluate(parsed.expression, context)
      }

      // Find matching case
      let result = ''
      let foundMatch = false

      for (const caseItem of parsed.cases) {
        if (caseItem.type === 'default') {
          if (!foundMatch) {
            result = caseItem.content.replace(/@break/g, '').trim()
          }
        }
        else {
          try {
            // Evaluate case value using safe evaluation
            let caseValue: unknown
            if (caseItem.value && isExpressionSafe(caseItem.value)) {
              const caseFn = createSafeFunction(caseItem.value, Object.keys(context))
              caseValue = caseFn(...Object.values(context))
            }
            else if (caseItem.value) {
              caseValue = safeEvaluate(caseItem.value, context)
            }

            if (switchValue === caseValue) {
              result = caseItem.content.replace(/@break/g, '').trim()
              foundMatch = true
              break
            }
          }
          catch {
            // If case evaluation fails, skip this case
            continue
          }
        }
      }

      // Replace the entire switch block with the result
      output = output.substring(0, switchStart) + result + output.substring(parsed.end)
      processedAny = true
    }
    catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      const errorMessage = inlineError('Switch', `Error evaluating @switch expression: ${msg}`, ErrorCodes.EVALUATION_ERROR)
      output = output.substring(0, switchStart) + errorMessage + output.substring(parsed.end)
      break
    }
  }

  return output
}

/**
 * Process conditionals (@if, @elseif, @else, @unless)
 *
 * Uses the parser module for proper handling of:
 * - Nested parentheses in conditions (e.g., @if(fn(a, fn(b))))
 * - Nested @if blocks
 * - Multiple @elseif branches
 */
export function processConditionals(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @switch statements first
  output = processSwitchStatements(output, context, filePath)

  // Process @unless directives with @else support
  // @unless is the inverse of @if - renders content when condition is FALSE
  // Supports @else for content when condition is TRUE
  output = output.replace(/@unless\s*\(([^)]+)\)([\s\S]*?)@endunless/g, (_match, condition, content) => {
    // Check if there's an @else within the @unless block
    const elseMatch = content.match(/^([\s\S]*?)@else([\s\S]*)$/)

    if (elseMatch) {
      // Has @else - convert to @if with swapped content
      // @unless(cond) A @else B @endunless -> @if(cond) B @else A @endif
      const unlessContent = elseMatch[1]
      const elseContent = elseMatch[2]
      return `@if (${condition})${elseContent}@else${unlessContent}@endif`
    }
    else {
      // No @else - simple negation
      return `@if (!(${condition}))${content}@endif`
    }
  })

  // Process @isset and @empty directives separately
  output = processIssetEmptyDirectives(output, context, filePath)

  // Process @env directives separately
  output = processEnvDirective(output, context, filePath)

  // Process @auth and @guest directives separately
  output = processAuthDirectives(output, context)

  // Process @if, @else, @elseif directives using the new parser
  const processIfStatements = () => {
    // Find all @if blocks using proper balanced parsing
    const ifBlocks = findIfBlocks(output)
    if (ifBlocks.length === 0) {
      return false
    }

    // Process from end to start to preserve positions
    for (let i = ifBlocks.length - 1; i >= 0; i--) {
      const block = ifBlocks[i]

      try {
        let result = ''
        let foundTrueBranch = false

        for (const branch of block.branches) {
          if (foundTrueBranch) {
            break
          }

          if (branch.type === 'else') {
            // @else - use this content since no previous branch matched
            result = branch.content
            foundTrueBranch = true
          }
          else {
            // @if or @elseif - evaluate condition using safe evaluation
            try {
              let conditionResult: unknown
              if (branch.condition && isExpressionSafe(branch.condition)) {
                const conditionFn = createSafeFunction(branch.condition, Object.keys(context))
                conditionResult = conditionFn(...Object.values(context))
              }
              else if (branch.condition) {
                // Fall back to safe evaluator for potentially unsafe expressions
                conditionResult = safeEvaluate(branch.condition, context)
              }

              if (conditionResult) {
                result = branch.content
                foundTrueBranch = true
              }
            }
            catch (error: unknown) {
              result = inlineError(
                branch.type === 'if' ? 'If' : 'Elseif',
                `Error in @${branch.type}(${branch.condition}): ${error instanceof Error ? error.message : String(error)}`,
                ErrorCodes.EVALUATION_ERROR,
              )
              foundTrueBranch = true
            }
          }
        }

        // Replace the block with the result
        output = output.substring(0, block.start) + result + output.substring(block.end)
      }
      catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        const errorMessage = inlineError('If', `Error processing @if block: ${msg}`, ErrorCodes.EVALUATION_ERROR)
        output = output.substring(0, block.start) + errorMessage + output.substring(block.end)
      }
    }

    return true
  }

  // Process @if statements until no more matches are found
  // This handles nested conditionals
  while (processIfStatements()) {
    // Continue processing until no more @if tags are found
  }

  return output
}

// =============================================================================
// Authentication Directive Documentation
// =============================================================================
//
// Auth directives require specific context shapes to work correctly.
//
// REQUIRED CONTEXT STRUCTURE:
// ---------------------------
//
// For @auth / @guest directives:
// ```typescript
// const context = {
//   auth: {
//     check: true,  // Boolean: is user authenticated?
//     user: {       // User object or null
//       id: 1,
//       name: 'John',
//       email: 'john@example.com',
//       // ... any other user properties
//     }
//   }
// }
// ```
//
// For @can / @cannot directives (Option 1 - Simple boolean map):
// ```typescript
// const context = {
//   userCan: {
//     'edit-posts': true,
//     'delete-posts': false,
//     'manage-users': true,
//   }
// }
// ```
//
// For @can / @cannot directives (Option 2 - Function-based):
// ```typescript
// const context = {
//   permissions: {
//     check: (ability: string, type?: string, id?: any) => {
//       // Return true/false based on user's permissions
//       return userHasAbility(ability, type, id)
//     }
//   }
// }
// ```
//
// DIRECTIVE USAGE:
// ----------------
//
// @auth / @endauth - Show content only to authenticated users
//   @auth
//     Welcome, {{ auth.user.name }}!
//   @else
//     Please log in.
//   @endauth
//
// @guest / @endguest - Show content only to unauthenticated users
//   @guest
//     Please log in to continue.
//   @endguest
//
// @can('ability') / @endcan - Show content if user has permission
//   @can('edit-posts')
//     <button>Edit</button>
//   @else
//     <span>Read-only</span>
//   @endcan
//
// @cannot('ability') / @endcannot - Show content if user lacks permission
//   @cannot('delete-posts')
//     <span>Deletion disabled</span>
//   @endcannot
//
// =============================================================================

/**
 * Process @auth and permissions directives
 *
 * @see Authentication Directive Documentation above for required context shapes
 */
export function processAuthDirectives(template: string, context: Record<string, any>): string {
  let output = template

  // Process @auth/@endauth directive
  output = output.replace(
    /@auth\s*(?:\((.*?)\)\s*)?\n([\s\S]*?)(?:@else\s*\n([\s\S]*?))?@endauth/g,
    (_, guard, content, elseContent) => {
      const isAuthenticated = guard
        ? evaluateAuthExpression(`auth?.check && auth?.user?.[${guard}]`, context)
        : evaluateAuthExpression('auth?.check', context)

      return isAuthenticated
        ? content
        : (elseContent || '')
    },
  )

  // Process @guest/@endguest directive
  output = output.replace(
    /@guest\s*(?:\((.*?)\)\s*)?\n([\s\S]*?)(?:@else\s*\n([\s\S]*?))?@endguest/g,
    (_, guard, content, elseContent) => {
      const isGuest = guard
        ? evaluateAuthExpression(`!auth?.check || !auth?.user?.[${guard}]`, context)
        : evaluateAuthExpression('!auth?.check', context)

      return isGuest
        ? content
        : (elseContent || '')
    },
  )

  // Process @can/@endcan directive with all variations
  output = output.replace(
    /@can\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?)(?:@elsecan\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?))?(?:@else\s*\n([\s\S]*?))?@endcan/g,
    (_, ability, type, id, content, elseAbility, elseType, elseId, elseContent, finalElseContent) => {
      // Handle permissions with complex evaluation
      let can = false

      // Try different permission checking patterns
      if (context.userCan && typeof context.userCan[ability] === 'boolean') {
        can = context.userCan[ability]
      }
      else if (context.permissions?.check && typeof context.permissions.check === 'function') {
        try {
          const args = [ability]
          if (type)
            args.push(type)
          if (id) {
            // Evaluate id if it's an expression
            const idValue = evaluateAuthExpression(id, context)
            args.push(idValue)
          }
          can = context.permissions.check(...args)
        }
        catch {
          can = false
        }
      }

      if (can) {
        return content
      }
      else if (elseAbility) {
        // Check the elsecan condition
        let elseCan = false

        if (context.userCan && typeof context.userCan[elseAbility] === 'boolean') {
          elseCan = context.userCan[elseAbility]
        }
        else if (context.permissions?.check && typeof context.permissions.check === 'function') {
          try {
            const args = [elseAbility]
            if (elseType)
              args.push(elseType)
            if (elseId) {
              const elseIdValue = evaluateAuthExpression(elseId, context)
              args.push(elseIdValue)
            }
            elseCan = context.permissions.check(...args)
          }
          catch {
            elseCan = false
          }
        }

        return elseCan ? elseContent : (finalElseContent || '')
      }
      else {
        return finalElseContent || ''
      }
    },
  )

  // Process @cannot/@endcannot directive with all variations
  output = output.replace(
    /@cannot\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?)(?:@elsecannot\('([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)\s*\n([\s\S]*?))?(?:@else\s*\n([\s\S]*?))?@endcannot/g,
    (_, ability, type, id, content, elseAbility, elseType, elseId, elseContent, finalElseContent) => {
      // Handle permissions with complex evaluation
      let cannot = true

      // Try different permission checking patterns
      if (context.userCan && typeof context.userCan[ability] === 'boolean') {
        cannot = !context.userCan[ability]
      }
      else if (context.permissions?.check && typeof context.permissions.check === 'function') {
        try {
          const args = [ability]
          if (type)
            args.push(type)
          if (id) {
            // Evaluate id if it's an expression
            const idValue = evaluateAuthExpression(id, context)
            args.push(idValue)
          }
          cannot = !context.permissions.check(...args)
        }
        catch {
          cannot = true
        }
      }

      if (cannot) {
        return content
      }
      else if (elseAbility) {
        // Check the elsecannot condition
        let elseCannot = true

        if (context.userCan && typeof context.userCan[elseAbility] === 'boolean') {
          elseCannot = !context.userCan[elseAbility]
        }
        else if (context.permissions?.check && typeof context.permissions.check === 'function') {
          try {
            const args = [elseAbility]
            if (elseType)
              args.push(elseType)
            if (elseId) {
              const elseIdValue = evaluateAuthExpression(elseId, context)
              args.push(elseIdValue)
            }
            elseCannot = !context.permissions.check(...args)
          }
          catch {
            elseCannot = true
          }
        }

        return elseCannot ? elseContent : (finalElseContent || '')
      }
      else {
        return finalElseContent || ''
      }
    },
  )

  return output
}

/**
 * Process @isset and @empty directives
 */
export function processIssetEmptyDirectives(template: string, context: Record<string, any>, _filePath?: string): string {
  let result = template

  // Process @isset directive
  result = result.replace(/@isset\(([^)]+)\)((?:.|\n)*?)(?:@else((?:.|\n)*?))?@endisset/g, (_match, variable, content, elseContent, _offset) => {
    try {
      // Evaluate the variable path (silently handle undefined variables)
      const value = evaluateAuthExpression(variable.trim(), context)

      // Check if it's defined and not null
      if (value !== undefined && value !== null) {
        return content
      }

      return elseContent || ''
    }
    catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      return inlineError('Isset', `Error processing @isset directive: ${msg}`, ErrorCodes.EVALUATION_ERROR)
    }
  })

  // Process @empty directive
  result = result.replace(/@empty\(([^)]+)\)((?:.|\n)*?)(?:@else((?:.|\n)*?))?@endempty/g, (_match, variable, content, elseContent, _offset) => {
    try {
      // Evaluate the variable path (silently handle undefined variables)
      const value = evaluateAuthExpression(variable.trim(), context)

      // Check if it's empty
      const isEmpty = value === undefined || value === null || value === ''
        || (Array.isArray(value) && value.length === 0)
        || (typeof value === 'object' && value !== null && Object.keys(value).length === 0)

      if (isEmpty) {
        return content
      }

      return elseContent || ''
    }
    catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      return inlineError('Empty', `Error processing @empty directive: ${msg}`, ErrorCodes.EVALUATION_ERROR)
    }
  })

  return result
}

/**
 * Process @env directive to conditionally render content based on environment
 */
export function processEnvDirective(template: string, _context: Record<string, any>, _filePath?: string): string {
  let output = template

  // General @env directive
  output = output.replace(
    /@env\s*\(\s*(['"])([^'"]+)\1\s*\)([\s\S]*?)(?:@else([\s\S]*?))?@endenv/g,
    (_, quote, env, content, elseContent = '') => {
      const currentEnv = process.env.NODE_ENV || process.env.BUN_ENV || 'development'
      return currentEnv === env ? content : elseContent
    },
  )

  // @production directive - renders content only in production environment
  output = output.replace(
    /@production([\s\S]*?)(?:@else([\s\S]*?))?@endproduction/g,
    (_, content, elseContent = '') => {
      const currentEnv = process.env.NODE_ENV || process.env.BUN_ENV || 'development'
      return currentEnv === 'production' ? content : elseContent
    },
  )

  // @development directive - renders content only in development environment
  output = output.replace(
    /@development([\s\S]*?)(?:@else([\s\S]*?))?@enddevelopment/g,
    (_, content, elseContent = '') => {
      const currentEnv = process.env.NODE_ENV || process.env.BUN_ENV || 'development'
      return currentEnv === 'development' ? content : elseContent
    },
  )

  // @staging directive - renders content only in staging environment
  output = output.replace(
    /@staging([\s\S]*?)(?:@else([\s\S]*?))?@endstaging/g,
    (_, content, elseContent = '') => {
      const currentEnv = process.env.NODE_ENV || process.env.BUN_ENV || 'development'
      return currentEnv === 'staging' ? content : elseContent
    },
  )

  // @testing directive - renders content only in testing environment
  output = output.replace(
    /@testing([\s\S]*?)(?:@else([\s\S]*?))?@endtesting/g,
    (_, content, elseContent = '') => {
      const currentEnv = process.env.NODE_ENV || process.env.BUN_ENV || 'development'
      return currentEnv === 'testing' ? content : elseContent
    },
  )

  return output
}
