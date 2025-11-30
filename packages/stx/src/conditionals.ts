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
 * Uses depth-tracking algorithm:
 * 1. Start with depth=1 (we're inside a @switch)
 * 2. Increment depth for each nested @switch found
 * 3. Decrement depth for each @endswitch found
 * 4. Return when depth reaches 0 (found matching @endswitch)
 */
function findBalancedSwitch(content: string, startIndex: number): { end: number, switchContent: string } | null {
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
 */
export function processSwitchStatements(template: string, context: Record<string, any>, _filePath: string): string {
  let output = template
  let processedAny = true

  // Keep processing until no more switches are found (to handle nested switches)
  while (processedAny) {
    processedAny = false

    // Find the first @switch statement
    // Uses NESTED_PARENS_PATTERN - see module documentation for regex explanation
    const switchRegex = /@switch\s*\(((?:[^()]|\([^()]*\))*)\)/
    const switchMatch = output.match(switchRegex)
    if (!switchMatch || switchMatch.index === undefined) {
      break
    }

    const expression = switchMatch[1]
    const switchStart = switchMatch.index
    const contentStart = switchStart + switchMatch[0].length

    // Find the balanced @endswitch
    const balanced = findBalancedSwitch(output, contentStart)
    if (!balanced) {
      break
    }

    const switchContent = balanced.switchContent
    const switchEnd = balanced.end + '@endswitch'.length

    try {
      // Evaluate the switch expression
      // eslint-disable-next-line no-new-func
      const exprFn = new Function(...Object.keys(context), `return ${expression}`)
      const switchValue = exprFn(...Object.values(context))

      // Parse cases and default
      const cases: Array<{ value: string, content: string }> = []
      let defaultContent = ''

      // Find all @case and @default positions in the switch content
      const caseRegex = /@case\s*\(((?:[^()]|\([^()]*\))*)\)/g
      const casePositions: Array<{ pos: number, value: string, directive: string }> = []
      let caseMatch

      // eslint-disable-next-line no-cond-assign -- needed for regex matching
      while ((caseMatch = caseRegex.exec(switchContent)) !== null) {
        casePositions.push({
          pos: caseMatch.index,
          value: caseMatch[1],
          directive: caseMatch[0],
        })
      }

      // Find @default position
      const defaultMatch = switchContent.match(/@default/)
      if (defaultMatch && defaultMatch.index !== undefined) {
        casePositions.push({
          pos: defaultMatch.index,
          value: '',
          directive: '@default',
        })
      }

      // Sort by position
      casePositions.sort((a, b) => a.pos - b.pos)

      // Extract content for each case
      for (let i = 0; i < casePositions.length; i++) {
        const current = casePositions[i]
        const next = casePositions[i + 1]

        const startPos = current.pos + current.directive.length
        const endPos = next ? next.pos : switchContent.length
        const content = switchContent.substring(startPos, endPos).trim()

        if (current.directive === '@default') {
          defaultContent = content
        }
        else {
          cases.push({ value: current.value, content })
        }
      }

      // Find matching case
      let result = defaultContent
      for (const caseItem of cases) {
        try {
          // eslint-disable-next-line no-new-func
          const caseFn = new Function(...Object.keys(context), `return ${caseItem.value}`)
          const caseValue = caseFn(...Object.values(context))

          if (switchValue === caseValue) {
            result = caseItem.content
            break
          }
        }
        catch {
          // If case evaluation fails, skip this case
          continue
        }
      }

      // Replace the entire switch block with the result
      output = output.substring(0, switchStart) + result + output.substring(switchEnd)
      processedAny = true
    }
    catch (error: any) {
      const errorMessage = inlineError('Switch', `Error evaluating @switch expression: ${error.message}`, ErrorCodes.EVALUATION_ERROR)
      output = output.substring(0, switchStart) + errorMessage + output.substring(switchEnd)
      break
    }
  }

  return output
}

/**
 * Process conditionals (@if, @elseif, @else, @unless)
 */
export function processConditionals(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @switch statements first
  output = processSwitchStatements(output, context, filePath)

  // Process @unless directives with @else support
  // @unless is the inverse of @if - renders content when condition is FALSE
  // Supports @else for content when condition is TRUE
  output = output.replace(/@unless\s*\(([^)]+)\)([\s\S]*?)@endunless/g, (match, condition, content) => {
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

  // Process @if, @else, @elseif directives
  const processIfStatements = () => {
    let hasMatches = false

    output = output.replace(/@if\s*\(([^)]+)\)([\s\S]*?)@endif/g, (match, condition, content, _offset) => {
      hasMatches = true

      try {
        // eslint-disable-next-line no-new-func
        const conditionFn = new Function(...Object.keys(context), `return ${condition}`)
        const result = conditionFn(...Object.values(context))

        if (result) {
          // If the condition is true, check for else parts
          const elseParts = content.split(/@else(?:if\s*\([^)]+\))?/)
          return elseParts[0] // Return only the if part
        }
        else {
          // The condition is false, look for else or elseif parts
          const elseifMatches = content.match(/@elseif\s*\(([^)]+)\)([\s\S]*?)(?:@elseif|@else|$)/)
          if (elseifMatches) {
            try {
              // eslint-disable-next-line no-new-func
              const elseifFn = new Function(...Object.keys(context), `return ${elseifMatches[1]}`)
              if (elseifFn(...Object.values(context))) {
                return elseifMatches[2]
              }
            }
            catch (error: any) {
              return inlineError('Elseif', `Error in @elseif(${elseifMatches[1]}): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
            }
          }

          // Check for simple @else
          const elseMatch = content.match(/@else([\s\S]*?)(?:@elseif|$)/)
          if (elseMatch) {
            return elseMatch[1]
          }

          return '' // If no else/elseif or all conditions are false
        }
      }
      catch (error: any) {
        return inlineError('If', `Error in @if(${condition}): ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.EVALUATION_ERROR)
      }
    })

    return hasMatches
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
    catch (error: any) {
      return inlineError('Isset', `Error processing @isset directive: ${error.message}`, ErrorCodes.EVALUATION_ERROR)
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
    catch (error: any) {
      return inlineError('Empty', `Error processing @empty directive: ${error.message}`, ErrorCodes.EVALUATION_ERROR)
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
