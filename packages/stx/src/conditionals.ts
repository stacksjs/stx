/* eslint-disable regexp/no-super-linear-backtracking */
/**
 * Module for processing conditional directives (@if, @elseif, @else, @unless)
 */

import process from 'node:process'
import { evaluateAuthExpression } from './auth'
import { createDetailedErrorMessage } from './utils'

/**
 * Process conditionals (@if, @elseif, @else, @unless)
 */
export function processConditionals(template: string, context: Record<string, any>, filePath: string): string {
  let output = template

  // Process @unless directives (convert to @if negation)
  output = output.replace(/@unless\s*\(([^)]+)\)([\s\S]*?)@endunless/g, (_, condition, content) => {
    return `@if (!(${condition}))${content}@endif`
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

    output = output.replace(/@if\s*\(([^)]+)\)([\s\S]*?)@endif/g, (match, condition, content, offset) => {
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
              return createDetailedErrorMessage(
                'Directive',
                `Error in @elseif(${elseifMatches[1]}): ${error instanceof Error ? error.message : String(error)}`,
                filePath,
                template,
                offset + match.indexOf('@elseif'),
                `@elseif(${elseifMatches[1]})`,
              )
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
        return createDetailedErrorMessage(
          'Directive',
          `Error in @if(${condition}): ${error instanceof Error ? error.message : String(error)}`,
          filePath,
          template,
          offset,
          `@if(${condition})`,
        )
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

/**
 * Process @auth and permissions directives
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
export function processIssetEmptyDirectives(template: string, context: Record<string, any>, filePath?: string): string {
  let result = template

  // Process @isset directive
  result = result.replace(/@isset\(([^)]+)\)((?:.|\n)*?)(?:@else((?:.|\n)*?))?@endisset/g, (match, variable, content, elseContent, offset) => {
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
      if (filePath) {
        return createDetailedErrorMessage(
          'Directive',
          `Error processing @isset directive: ${error.message}`,
          filePath,
          template,
          offset,
          match,
        )
      }
      else {
        console.error(`Error processing @isset directive:`, error)
        return match // Return unchanged if error
      }
    }
  })

  // Process @empty directive
  result = result.replace(/@empty\(([^)]+)\)((?:.|\n)*?)(?:@else((?:.|\n)*?))?@endempty/g, (match, variable, content, elseContent, offset) => {
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
      if (filePath) {
        return createDetailedErrorMessage(
          'Directive',
          `Error processing @empty directive: ${error.message}`,
          filePath,
          template,
          offset,
          match,
        )
      }
      else {
        console.error(`Error processing @empty directive:`, error)
        return match // Return unchanged if error
      }
    }
  })

  return result
}

/**
 * Process @env directive to conditionally render content based on environment
 */
export function processEnvDirective(template: string, context: Record<string, any>, filePath?: string): string {
  const result = template

  // Match @env('environment') / @elseenv('environment') / @else / @endenv blocks
  const envPattern = /@env\((['"]?)(.*?)\1\)((?:.|\n)*?)(?:@elseenv\((['"]?)(.*?)\4\)((?:.|\n)*?))?(?:@else((?:.|\n)*?))?@endenv/g

  return result.replace(envPattern, (match, quote1, envValue, content, quote2, elseEnvValue, elseEnvContent, elseContent, offset) => {
    try {
      const currentEnv = context.NODE_ENV || process.env.NODE_ENV || 'development'

      // Handle array of environments like @env(['local', 'development'])
      let envArray: string[] = []

      // Check if it's an array notation
      if (envValue.startsWith('[') && envValue.endsWith(']')) {
        // Parse the array string, accounting for different formats
        const arrayContent = envValue.slice(1, -1).trim()

        // Split by comma and clean up quotes
        envArray = arrayContent.split(',')
          .map((e: string) => e.trim().replace(/^['"]|['"]$/g, ''))
          .filter(Boolean)
      }
      else {
        envArray = [envValue]
      }

      // If current environment matches one in the array, show the content
      if (envArray.includes(currentEnv)) {
        return content
      }

      // Check elseenv condition if it exists
      if (elseEnvValue && elseEnvContent) {
        let elseEnvArray: string[] = []

        // Check if it's an array notation
        if (elseEnvValue.startsWith('[') && elseEnvValue.endsWith(']')) {
          const arrayContent = elseEnvValue.slice(1, -1).trim()
          elseEnvArray = arrayContent.split(',')
            .map((e: string) => e.trim().replace(/^['"]|['"]$/g, ''))
            .filter(Boolean)
        }
        else {
          elseEnvArray = [elseEnvValue]
        }

        if (elseEnvArray.includes(currentEnv)) {
          return elseEnvContent
        }
      }

      // Return else content if it exists
      return elseContent || ''
    }
    catch (error: any) {
      if (filePath) {
        return createDetailedErrorMessage(
          'Directive',
          `Error processing @env directive: ${error.message}`,
          filePath,
          template,
          offset,
          match,
        )
      }
      else {
        console.error(`Error processing @env directive:`, error)
        return match // Return unchanged if error
      }
    }
  })
}
