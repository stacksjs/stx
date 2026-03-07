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
import { extractParenthesizedExpression, findIfBlocks, findMatchingEndTag, parseSwitchBlock } from './parser'
import { createSafeFunction, isExpressionSafe, safeEvaluate } from './safe-evaluator'

// =============================================================================
// Pre-compiled Regex Patterns (performance optimization)
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
 * Note on Regex Performance:
 * JavaScript engines already cache inline regex literals, so pre-compiling
 * them provides minimal benefit. The patterns below are documented for
 * reference but defined inline where used to avoid global state issues
 * with the `g` flag and `lastIndex`.
 */

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
            // Don't strip @break globally — parseSwitchBlock already excludes
            // depth-0 @break from case content. Remaining @break are inside
            // nested @switch blocks and must be preserved.
            result = caseItem.content.trim()
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
              result = caseItem.content.trim()
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
  // Uses balanced parsing to handle nested @unless blocks
  {
    let processedAny = true
    while (processedAny) {
      processedAny = false
      const unlessMatch = output.match(/@unless\s*\(/)
      if (!unlessMatch || unlessMatch.index === undefined) break

      const startPos = unlessMatch.index
      const exprResult = extractParenthesizedExpression(output, startPos + '@unless'.length)
      if (!exprResult) break

      const contentStart = exprResult.endPos
      const endPos = findMatchingEndTag(output, 'unless', 'endunless', contentStart)
      if (endPos === -1) break

      const content = output.slice(contentStart, endPos)
      const condition = exprResult.expression

      // Find top-level @else using event scanning (O(n) instead of O(n²) slicing)
      let elsePos = -1
      {
        let depth = 0
        const openRe = /@(?:if|unless)\s*\(/g
        const closeRe = /@(?:endif|endunless)(?![a-z])/g
        const elseRe = /@else(?![a-z])/g
        const events: { pos: number, type: 'open' | 'close' | 'else' }[] = []
        let em: RegExpExecArray | null
        while ((em = openRe.exec(content)) !== null) events.push({ pos: em.index, type: 'open' })
        while ((em = closeRe.exec(content)) !== null) events.push({ pos: em.index, type: 'close' })
        while ((em = elseRe.exec(content)) !== null) events.push({ pos: em.index, type: 'else' })
        events.sort((a, b) => a.pos - b.pos)
        for (const ev of events) {
          if (ev.type === 'open') depth++
          else if (ev.type === 'close') depth--
          else if (ev.type === 'else' && depth === 0) { elsePos = ev.pos; break }
        }
      }

      let replacement: string
      if (elsePos !== -1) {
        const unlessContent = content.slice(0, elsePos)
        const elseContent = content.slice(elsePos + '@else'.length)
        replacement = `@if (${condition})${elseContent}@else${unlessContent}@endif`
      }
      else {
        replacement = `@if (!(${condition}))${content}@endif`
      }

      output = output.substring(0, startPos) + replacement + output.substring(endPos + '@endunless'.length)
      processedAny = true
    }
  }

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

  // Helper: find matching end tag for directives that may or may not have parens
  // (e.g., @auth, @auth('admin'), @guest, @guest('web'))
  function findEndTag(src: string, startTag: string, endTag: string, from: number): number {
    let depth = 1
    let pos = from
    const openRe = new RegExp(`@${startTag}(?:\\s*\\(|\\s|$)`, 'g')
    const closeRe = new RegExp(`@${endTag}(?![a-z])`, 'g')
    while (pos < src.length && depth > 0) {
      openRe.lastIndex = pos
      closeRe.lastIndex = pos
      const openMatch = openRe.exec(src)
      const closeMatch = closeRe.exec(src)
      const nextOpen = openMatch ? openMatch.index : Infinity
      const nextClose = closeMatch ? closeMatch.index : Infinity
      if (nextOpen < nextClose) {
        depth++
        pos = nextOpen + openMatch![0].length
      } else if (nextClose < Infinity) {
        depth--
        if (depth === 0) return nextClose
        pos = nextClose + closeMatch![0].length
      } else break
    }
    return -1
  }

  // Helper: find top-level @else inside balanced content
  // Uses regex with lastIndex scanning instead of O(n²) slice
  function findTopLevelElse(content: string, startTag: string, endTag: string): number {
    let depth = 0
    const openRe = new RegExp(`@${startTag}(?:\\s*\\(|\\s|$)`, 'g')
    const closeRe = new RegExp(`@${endTag}(?![a-z])`, 'g')
    const elseRe = /@else(?![a-z])/g
    // Scan for all directive positions and process in order
    const events: { pos: number, type: 'open' | 'close' | 'else' }[] = []
    let m: RegExpExecArray | null
    while ((m = openRe.exec(content)) !== null) events.push({ pos: m.index, type: 'open' })
    while ((m = closeRe.exec(content)) !== null) events.push({ pos: m.index, type: 'close' })
    while ((m = elseRe.exec(content)) !== null) events.push({ pos: m.index, type: 'else' })
    events.sort((a, b) => a.pos - b.pos)
    for (const ev of events) {
      if (ev.type === 'open') depth++
      else if (ev.type === 'close') depth--
      else if (ev.type === 'else' && depth === 0) return ev.pos
    }
    return -1
  }

  // Process @auth/@endauth using balanced parsing
  {
    let processedAny = true
    while (processedAny) {
      processedAny = false
      const authMatch = output.match(/@auth(?:\s*\(|\s|(?=\n))/)
      if (!authMatch || authMatch.index === undefined) break

      const startPos = authMatch.index
      // Extract optional guard parameter
      let guard: string | undefined
      let contentStart: number

      const afterAuth = output.slice(startPos + '@auth'.length)
      const guardMatch = afterAuth.match(/^\s*\(\s*(['"])(.*?)\1\s*\)/)
      if (guardMatch) {
        guard = guardMatch[2]
        contentStart = startPos + '@auth'.length + guardMatch[0].length
      } else {
        contentStart = startPos + '@auth'.length
      }

      const endPos = findEndTag(output, 'auth', 'endauth', contentStart)
      if (endPos === -1) break

      const fullContent = output.slice(contentStart, endPos)
      const elsePos = findTopLevelElse(fullContent, 'auth', 'endauth')

      let isAuthenticated: boolean
      if (!context.auth) {
        isAuthenticated = false
      } else {
        isAuthenticated = guard
          ? evaluateAuthExpression(`auth?.check && auth?.user?.[${guard}]`, context)
          : evaluateAuthExpression('auth?.check', context)
      }

      let replacement: string
      if (elsePos !== -1) {
        const trueContent = fullContent.slice(0, elsePos)
        const falseContent = fullContent.slice(elsePos + '@else'.length)
        replacement = isAuthenticated ? trueContent : falseContent
      } else {
        replacement = isAuthenticated ? fullContent : ''
      }

      output = output.substring(0, startPos) + replacement + output.substring(endPos + '@endauth'.length)
      processedAny = true
    }
  }

  // Process @guest/@endguest using balanced parsing
  {
    let processedAny = true
    while (processedAny) {
      processedAny = false
      const guestMatch = output.match(/@guest(?:\s*\(|\s|(?=\n))/)
      if (!guestMatch || guestMatch.index === undefined) break

      const startPos = guestMatch.index
      let guard: string | undefined
      let contentStart: number

      const afterGuest = output.slice(startPos + '@guest'.length)
      const guardMatch = afterGuest.match(/^\s*\(\s*(['"])(.*?)\1\s*\)/)
      if (guardMatch) {
        guard = guardMatch[2]
        contentStart = startPos + '@guest'.length + guardMatch[0].length
      } else {
        contentStart = startPos + '@guest'.length
      }

      const endPos = findEndTag(output, 'guest', 'endguest', contentStart)
      if (endPos === -1) break

      const fullContent = output.slice(contentStart, endPos)
      const elsePos = findTopLevelElse(fullContent, 'guest', 'endguest')

      let isGuest: boolean
      if (!context.auth) {
        isGuest = true
      } else {
        isGuest = guard
          ? evaluateAuthExpression(`!auth?.check || !auth?.user?.[${guard}]`, context)
          : evaluateAuthExpression('!auth?.check', context)
      }

      let replacement: string
      if (elsePos !== -1) {
        const trueContent = fullContent.slice(0, elsePos)
        const falseContent = fullContent.slice(elsePos + '@else'.length)
        replacement = isGuest ? trueContent : falseContent
      } else {
        replacement = isGuest ? fullContent : ''
      }

      output = output.substring(0, startPos) + replacement + output.substring(endPos + '@endguest'.length)
      processedAny = true
    }
  }

  // Process @can/@endcan and @cannot/@endcannot with balanced depth tracking
  // Helper to check permission
  function checkPermission(ability: string, type?: string, id?: string): boolean {
    if (context.userCan && typeof context.userCan[ability] === 'boolean') {
      return context.userCan[ability]
    }
    if (context.permissions?.check && typeof context.permissions.check === 'function') {
      try {
        const args: any[] = [ability]
        if (type) args.push(type)
        if (id) {
          const idValue = evaluateAuthExpression(id, context)
          args.push(idValue)
        }
        return context.permissions.check(...args)
      }
      catch { return false }
    }
    return false
  }

  // Helper to parse @can('ability', 'type', id) params
  function parseCanParams(afterDirective: string): { ability: string, type?: string, id?: string, paramsEnd: number } | null {
    const m = afterDirective.match(/^\s*\(\s*'([^']*)'(?:,\s*'([^']*)')?(?:,\s*([^)]*))?\)/)
    if (!m) return null
    return { ability: m[1], type: m[2], id: m[3]?.trim(), paramsEnd: m[0].length }
  }

  // Process @can/@endcan and @cannot/@endcannot using balanced parsing
  // Supports @elsecan/@elsecannot intermediate conditions
  for (const directive of ['can', 'cannot'] as const) {
    const endDirective = `end${directive}`
    const elseDirective = directive === 'can' ? 'elsecan' : 'elsecannot'
    let processedAny = true
    while (processedAny) {
      processedAny = false
      const canMatch = output.match(new RegExp(`@${directive}\\s*\\(`))
      if (!canMatch || canMatch.index === undefined) break

      const startPos = canMatch.index
      const afterDir = output.slice(startPos + `@${directive}`.length)
      const parsed = parseCanParams(afterDir)
      if (!parsed) break

      const contentStart = startPos + `@${directive}`.length + parsed.paramsEnd
      const endPos = findEndTag(output, `${directive}\\s*\\(`, endDirective, contentStart)
      if (endPos === -1) break

      const fullContent = output.slice(contentStart, endPos)

      // Find top-level @elsecan/@elsecannot and @else positions using event scanning
      const topLevelBreaks: { pos: number, type: 'elseDirective' | 'else' }[] = []
      let dpt = 0
      const scanOpenRe = new RegExp(`@${directive}\\s*\\(`, 'g')
      const scanCloseRe = new RegExp(`@${endDirective}(?![a-z])`, 'g')
      const scanElseDirRe = new RegExp(`@${elseDirective}\\s*\\(`, 'g')
      const scanElseRe = /@else(?![a-z])/g
      const scanEvents: { pos: number, type: 'open' | 'close' | 'elseDirective' | 'else' }[] = []
      let sm: RegExpExecArray | null
      while ((sm = scanOpenRe.exec(fullContent)) !== null) scanEvents.push({ pos: sm.index, type: 'open' })
      while ((sm = scanCloseRe.exec(fullContent)) !== null) scanEvents.push({ pos: sm.index, type: 'close' })
      while ((sm = scanElseDirRe.exec(fullContent)) !== null) scanEvents.push({ pos: sm.index, type: 'elseDirective' })
      while ((sm = scanElseRe.exec(fullContent)) !== null) scanEvents.push({ pos: sm.index, type: 'else' })
      scanEvents.sort((a, b) => a.pos - b.pos)
      for (const ev of scanEvents) {
        if (ev.type === 'open') { dpt++; continue }
        if (ev.type === 'close') { dpt--; continue }
        if (dpt === 0) topLevelBreaks.push(ev)
      }

      // Build segments: primary, elseDirective segments, final else
      const segments: { content: string, ability?: string, type?: string, id?: string, isFinalElse?: boolean }[] = []
      let segStart = 0
      for (const brk of topLevelBreaks) {
        segments.push({ content: fullContent.slice(segStart, brk.pos), ability: undefined })
        if (brk.type === 'elseDirective') {
          // Parse the elseDirective params
          const after = fullContent.slice(brk.pos + `@${elseDirective}`.length)
          const ep = parseCanParams(after)
          if (ep) {
            segments[segments.length - 1] = { content: fullContent.slice(segStart, brk.pos) }
            segStart = brk.pos + `@${elseDirective}`.length + ep.paramsEnd
            // Mark the NEXT segment will have these params
            segments.push({ content: '', ability: ep.ability, type: ep.type, id: ep.id })
            // Actually we need to continue collecting content for this segment
            // Remove the placeholder, it will be filled on next iteration
            segments.pop()
            // Use a trick: remember params for the next segment boundary
            const nextBrk = topLevelBreaks[topLevelBreaks.indexOf(brk) + 1]
            const nextEnd = nextBrk ? nextBrk.pos : fullContent.length
            segments.push({ content: fullContent.slice(segStart, nextEnd), ability: ep.ability, type: ep.type, id: ep.id })
            segStart = nextEnd
          }
        }
        else {
          // @else — final else
          segStart = brk.pos + '@else'.length
        }
      }
      // Add remaining content as final segment
      if (segStart < fullContent.length) {
        const lastSeg = segments[segments.length - 1]
        if (topLevelBreaks.length > 0 && topLevelBreaks[topLevelBreaks.length - 1].type === 'else') {
          segments.push({ content: fullContent.slice(segStart), isFinalElse: true })
        }
        else if (segments.length === 0) {
          segments.push({ content: fullContent.slice(segStart) })
        }
      }

      // Evaluate: first segment uses parsed.ability
      const primaryPerm = checkPermission(parsed.ability, parsed.type, parsed.id)
      const primaryResult = directive === 'can' ? primaryPerm : !primaryPerm

      let replacement = ''
      if (primaryResult) {
        replacement = segments[0]?.content || ''
      }
      else {
        // Try elseDirective segments
        let found = false
        for (let si = 1; si < segments.length; si++) {
          const seg = segments[si]
          if (seg.isFinalElse) {
            replacement = seg.content
            found = true
            break
          }
          if (seg.ability) {
            const elsePerm = checkPermission(seg.ability, seg.type, seg.id)
            const elseResult = directive === 'can' ? elsePerm : !elsePerm
            if (elseResult) {
              replacement = seg.content
              found = true
              break
            }
          }
        }
        if (!found && segments.length > 0) {
          const lastSeg = segments[segments.length - 1]
          if (lastSeg.isFinalElse) {
            replacement = lastSeg.content
          }
        }
      }

      output = output.substring(0, startPos) + replacement + output.substring(endPos + `@${endDirective}`.length)
      processedAny = true
    }
  }

  return output
}

/**
 * Process @isset and @empty directives
 */
export function processIssetEmptyDirectives(template: string, context: Record<string, any>, _filePath?: string): string {
  let result = template

  // Helper: process a balanced @directive(expr)...@else...@enddirective block
  function processBalancedDirective(
    output: string,
    directiveName: string,
    endDirectiveName: string,
    evaluator: (variable: string) => boolean,
    errorLabel: string,
  ): string {
    let processedAny = true
    while (processedAny) {
      processedAny = false
      const pattern = new RegExp(`@${directiveName}\\s*\\(`)
      const match = output.match(pattern)
      if (!match || match.index === undefined) break

      const startPos = match.index
      const exprResult = extractParenthesizedExpression(output, startPos + `@${directiveName}`.length)
      if (!exprResult) break

      const contentStart = exprResult.endPos
      const endPos = findMatchingEndTag(output, directiveName, endDirectiveName, contentStart)
      if (endPos === -1) break

      const fullContent = output.slice(contentStart, endPos)
      const variable = exprResult.expression

      // Find top-level @else without O(n²) slicing — use indexOf to jump to @ positions
      let elsePos = -1
      let depth = 0
      let searchIdx = 0
      while (searchIdx < fullContent.length) {
        const atIdx = fullContent.indexOf('@', searchIdx)
        if (atIdx === -1) break
        const rem = fullContent.substring(atIdx)
        if (/^@(?:if|unless|isset|empty)\s*\(/.test(rem)) { depth++; searchIdx = atIdx + 1; continue }
        if (/^@(?:endif|endunless|endisset|endempty)(?![a-z])/.test(rem)) { depth--; searchIdx = atIdx + 1; continue }
        if (depth === 0 && /^@else(?![a-z])/.test(rem)) { elsePos = atIdx; break }
        searchIdx = atIdx + 1
      }

      try {
        const conditionResult = evaluator(variable.trim())
        let replacement: string
        if (elsePos !== -1) {
          const trueContent = fullContent.slice(0, elsePos)
          const falseContent = fullContent.slice(elsePos + '@else'.length)
          replacement = conditionResult ? trueContent : falseContent
        }
        else {
          replacement = conditionResult ? fullContent : ''
        }
        output = output.substring(0, startPos) + replacement + output.substring(endPos + `@${endDirectiveName}`.length)
        processedAny = true
      }
      catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error)
        const errorMessage = inlineError(errorLabel, `Error processing @${directiveName} directive: ${msg}`, ErrorCodes.EVALUATION_ERROR)
        output = output.substring(0, startPos) + errorMessage + output.substring(endPos + `@${endDirectiveName}`.length)
        break
      }
    }
    return output
  }

  // Process @isset directive with balanced parsing
  result = processBalancedDirective(result, 'isset', 'endisset', (variable) => {
    const value = evaluateAuthExpression(variable, context)
    return value !== undefined && value !== null
  }, 'Isset')

  // Process @empty directive with balanced parsing
  result = processBalancedDirective(result, 'empty', 'endempty', (variable) => {
    const value = evaluateAuthExpression(variable, context)
    return value === undefined || value === null || value === ''
      || (Array.isArray(value) && value.length === 0)
      || (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
  }, 'Empty')

  return result
}

/**
 * Process @env directive to conditionally render content based on environment
 */
export function processEnvDirective(template: string, _context: Record<string, any>, _filePath?: string): string {
  let output = template
  const currentEnv = process.env.NODE_ENV || process.env.BUN_ENV || 'development'

  // Helper: process a simple env directive with balanced @else support
  function processEnvBlock(src: string, directiveName: string, endDirectiveName: string, condition: boolean): string {
    // Pre-compile regexes outside the loop to avoid re-creation
    const openTagRe = new RegExp(`@${directiveName}(?![a-z])`, 'g')
    const endTagRe = new RegExp(`@${endDirectiveName}(?![a-z])`, 'g')
    const openTagTest = new RegExp(`^@${directiveName}(?![a-z])`)
    const endTagTest = new RegExp(`^@${endDirectiveName}(?![a-z])`)

    let result = src
    let processedAny = true
    while (processedAny) {
      processedAny = false
      openTagRe.lastIndex = 0
      const match = openTagRe.exec(result)
      if (!match) break

      const startPos = match.index
      let contentStart = startPos + match[0].length

      // For @env, extract the env name from parens
      if (directiveName === 'env') {
        const envParenMatch = result.substring(contentStart).match(/^\s*\(\s*(['"])([^'"]+)\1\s*\)/)
        if (!envParenMatch) break
        contentStart += envParenMatch[0].length
        condition = currentEnv === envParenMatch[2]
      }

      // Find matching end tag using balanced depth — use exec with lastIndex instead of slice
      let depth = 1
      let searchPos = contentStart
      let endPos = -1

      while (depth > 0 && searchPos < result.length) {
        // Find next open or close tag from searchPos
        openTagRe.lastIndex = searchPos
        endTagRe.lastIndex = searchPos
        const nextOpenMatch = openTagRe.exec(result)
        const nextCloseMatch = endTagRe.exec(result)
        const nextOpen = nextOpenMatch ? nextOpenMatch.index : Infinity
        const nextClose = nextCloseMatch ? nextCloseMatch.index : Infinity
        if (nextOpen < nextClose) {
          depth++
          searchPos = nextOpen + nextOpenMatch![0].length
        } else if (nextClose < Infinity) {
          depth--
          if (depth === 0) { endPos = nextClose; break }
          searchPos = nextClose + nextCloseMatch![0].length
        } else break
      }
      if (endPos === -1) break

      const fullContent = result.substring(contentStart, endPos)

      // Find top-level @else — use indexOf to jump to @ positions instead of O(n²) slice
      let elseIdx = -1
      let nestedDepth = 0
      let si = 0
      while (si < fullContent.length) {
        const atPos = fullContent.indexOf('@', si)
        if (atPos === -1) break
        const rem = fullContent.substring(atPos)
        if (openTagTest.test(rem)) { nestedDepth++; si = atPos + 1; continue }
        if (endTagTest.test(rem)) { nestedDepth--; si = atPos + 1; continue }
        if (nestedDepth === 0 && /^@else(?![a-z])/.test(rem)) { elseIdx = atPos; break }
        si = atPos + 1
      }

      let replacement: string
      if (elseIdx !== -1) {
        const trueContent = fullContent.slice(0, elseIdx)
        const falseContent = fullContent.slice(elseIdx + '@else'.length)
        replacement = condition ? trueContent : falseContent
      } else {
        replacement = condition ? fullContent : ''
      }

      const endTagLength = `@${endDirectiveName}`.length
      result = result.substring(0, startPos) + replacement + result.substring(endPos + endTagLength)
      processedAny = true
    }
    return result
  }

  output = processEnvBlock(output, 'env', 'endenv', false) // condition set per-match
  output = processEnvBlock(output, 'production', 'endproduction', currentEnv === 'production')
  output = processEnvBlock(output, 'development', 'enddevelopment', currentEnv === 'development')
  output = processEnvBlock(output, 'staging', 'endstaging', currentEnv === 'staging')
  output = processEnvBlock(output, 'testing', 'endtesting', currentEnv === 'testing')

  return output
}
