/**
 * Directive Parser
 *
 * Provides utilities for parsing directives with proper handling of
 * nested structures, balanced tags, and expressions.
 *
 * @module parser/directive-parser
 */

import { findMatchingDelimiter } from './tokenizer'

// =============================================================================
// Types
// =============================================================================

export interface DirectiveMatch {
  fullMatch: string
  name: string
  params: string
  content: string
  start: number
  end: number
}

export interface ConditionalBranch {
  type: 'if' | 'elseif' | 'else'
  condition?: string
  content: string
  start: number
  end: number
}

export interface ParsedConditional {
  fullMatch: string
  branches: ConditionalBranch[]
  start: number
  end: number
}

// =============================================================================
// Expression Extraction
// =============================================================================

/**
 * Extract a parenthesized expression from a string, handling nested parens
 * e.g., "func(a, fn(b, c))" -> { expression: "func(a, fn(b, c))", endPos: 17 }
 */
export function extractParenthesizedExpression(source: string, startPos: number): {
  expression: string
  endPos: number
} | null {
  // Skip whitespace
  let pos = startPos
  while (pos < source.length && /\s/.test(source[pos])) {
    pos++
  }

  if (source[pos] !== '(') {
    return null
  }

  const closePos = findMatchingDelimiter(source, '(', ')', pos)
  if (closePos === -1) {
    return null
  }

  return {
    expression: source.slice(pos + 1, closePos),
    endPos: closePos + 1,
  }
}

// =============================================================================
// Balanced Tag Matching
// =============================================================================

/**
 * Find the matching end tag for a directive, handling nested instances
 *
 * @param source - The source string to search in
 * @param startName - The opening directive name (e.g., "if", "foreach")
 * @param endName - The closing directive name (e.g., "endif", "endforeach")
 * @param startPos - Position to start searching from (after the opening directive)
 * @returns The position of the matching end tag, or -1 if not found
 */
export function findMatchingEndTag(
  source: string,
  startName: string,
  endName: string,
  startPos: number,
): number {
  let depth = 1
  let pos = startPos
  const openPattern = new RegExp(`@${startName}\\s*\\(`, 'g')
  const closePattern = new RegExp(`@${endName}(?![a-z])`, 'g')

  while (pos < source.length && depth > 0) {
    // Reset regex lastIndex
    openPattern.lastIndex = pos
    closePattern.lastIndex = pos

    const openMatch = openPattern.exec(source)
    const closeMatch = closePattern.exec(source)

    const nextOpen = openMatch ? openMatch.index : Infinity
    const nextClose = closeMatch ? closeMatch.index : Infinity

    if (nextOpen < nextClose) {
      depth++
      pos = nextOpen + openMatch![0].length
    }
    else if (nextClose < Infinity) {
      depth--
      if (depth === 0) {
        return nextClose
      }
      pos = nextClose + closeMatch![0].length
    }
    else {
      break
    }
  }

  return -1
}

/**
 * Parse a complete conditional block (@if, @elseif, @else, @endif)
 *
 * @param source - The source string
 * @param startPos - Position where @if starts
 * @returns Parsed conditional with all branches, or null if malformed
 */
export function parseConditionalBlock(source: string, startPos: number): ParsedConditional | null {
  // Match the @if directive
  const ifMatch = source.slice(startPos).match(/^@if\s*/)
  if (!ifMatch) {
    return null
  }

  // Extract the condition
  const exprStart = startPos + ifMatch[0].length
  const exprResult = extractParenthesizedExpression(source, exprStart)
  if (!exprResult) {
    return null
  }

  const contentStart = exprResult.endPos

  // Find the matching @endif
  const endIfPos = findMatchingEndTag(source, 'if', 'endif', contentStart)
  if (endIfPos === -1) {
    return null
  }

  const fullContent = source.slice(contentStart, endIfPos)
  const branches: ConditionalBranch[] = []

  // Parse branches within the content
  let currentPos = 0
  let currentType: 'if' | 'elseif' | 'else' = 'if'
  let currentCondition: string | undefined = exprResult.expression
  let branchStart = 0

  while (currentPos < fullContent.length) {
    // Look for @elseif or @else
    const elseifMatch = fullContent.slice(currentPos).match(/^@elseif\s*/)
    const elseMatch = fullContent.slice(currentPos).match(/^@else(?![a-z])/)

    if (elseifMatch && fullContent.slice(currentPos).startsWith('@elseif')) {
      // Save current branch
      branches.push({
        type: currentType,
        condition: currentCondition,
        content: fullContent.slice(branchStart, currentPos),
        start: contentStart + branchStart,
        end: contentStart + currentPos,
      })

      // Parse elseif condition
      const elseifExprStart = currentPos + elseifMatch[0].length
      const elseifExpr = extractParenthesizedExpression(fullContent, elseifExprStart)
      if (!elseifExpr) {
        // Malformed @elseif, skip
        currentPos++
        continue
      }

      currentType = 'elseif'
      currentCondition = elseifExpr.expression
      currentPos = elseifExpr.endPos
      branchStart = currentPos
    }
    else if (elseMatch && fullContent.slice(currentPos).startsWith('@else')) {
      // Save current branch
      branches.push({
        type: currentType,
        condition: currentCondition,
        content: fullContent.slice(branchStart, currentPos),
        start: contentStart + branchStart,
        end: contentStart + currentPos,
      })

      currentType = 'else'
      currentCondition = undefined
      currentPos += elseMatch[0].length
      branchStart = currentPos
    }
    else {
      currentPos++
    }
  }

  // Save the last branch
  branches.push({
    type: currentType,
    condition: currentCondition,
    content: fullContent.slice(branchStart),
    start: contentStart + branchStart,
    end: contentStart + fullContent.length,
  })

  return {
    fullMatch: source.slice(startPos, endIfPos + '@endif'.length),
    branches,
    start: startPos,
    end: endIfPos + '@endif'.length,
  }
}

/**
 * Find all @if blocks in source (non-nested, outermost only)
 */
export function findIfBlocks(source: string): ParsedConditional[] {
  const results: ParsedConditional[] = []
  const ifPattern = /@if\s*\(/g
  let match = ifPattern.exec(source)

  while (match !== null) {
    // Check if this @if is inside a previously found block
    const isNested = results.some(r => match!.index > r.start && match!.index < r.end)
    if (isNested) {
      match = ifPattern.exec(source)
      continue
    }

    const parsed = parseConditionalBlock(source, match.index)
    if (parsed) {
      results.push(parsed)
      // Move pattern past this block to avoid re-matching
      ifPattern.lastIndex = parsed.end
    }

    match = ifPattern.exec(source)
  }

  return results
}

// =============================================================================
// Generic Directive Parsing
// =============================================================================

/**
 * Find a directive with its content
 *
 * @param source - Source string
 * @param directiveName - Name without @ (e.g., "foreach")
 * @param endDirectiveName - End name without @ (e.g., "endforeach")
 * @returns All matches found
 */
export function findDirectiveBlocks(
  source: string,
  directiveName: string,
  endDirectiveName: string,
): DirectiveMatch[] {
  const results: DirectiveMatch[] = []
  const pattern = new RegExp(`@${directiveName}\\s*\\(`, 'g')
  let match = pattern.exec(source)

  while (match !== null) {
    // Check if nested in a previous match
    const isNested = results.some(r => match!.index > r.start && match!.index < r.end)
    if (isNested) {
      match = pattern.exec(source)
      continue
    }

    const startPos = match.index
    const exprStart = startPos + match[0].length - 1 // Position of (

    // Extract expression
    const closeParenPos = findMatchingDelimiter(source, '(', ')', exprStart)
    if (closeParenPos === -1) {
      match = pattern.exec(source)
      continue
    }

    const params = source.slice(exprStart + 1, closeParenPos)
    const contentStart = closeParenPos + 1

    // Find matching end tag
    const endPos = findMatchingEndTag(source, directiveName, endDirectiveName, contentStart)
    if (endPos === -1) {
      match = pattern.exec(source)
      continue
    }

    const content = source.slice(contentStart, endPos)
    const fullEnd = endPos + `@${endDirectiveName}`.length

    results.push({
      fullMatch: source.slice(startPos, fullEnd),
      name: directiveName,
      params,
      content,
      start: startPos,
      end: fullEnd,
    })

    pattern.lastIndex = fullEnd
    match = pattern.exec(source)
  }

  return results
}

/**
 * Parse @switch block with proper handling of nested switches
 */
export interface SwitchCase {
  type: 'case' | 'default'
  value?: string
  content: string
}

export interface ParsedSwitch {
  fullMatch: string
  expression: string
  cases: SwitchCase[]
  start: number
  end: number
}

export function parseSwitchBlock(source: string, startPos: number): ParsedSwitch | null {
  // Match @switch
  const switchMatch = source.slice(startPos).match(/^@switch\s*/)
  if (!switchMatch) {
    return null
  }

  // Extract expression
  const exprStart = startPos + switchMatch[0].length
  const exprResult = extractParenthesizedExpression(source, exprStart)
  if (!exprResult) {
    return null
  }

  const contentStart = exprResult.endPos

  // Find matching @endswitch
  const endPos = findMatchingEndTag(source, 'switch', 'endswitch', contentStart)
  if (endPos === -1) {
    return null
  }

  const content = source.slice(contentStart, endPos)
  const cases: SwitchCase[] = []

  // Parse @case and @default within content
  let currentPos = 0
  let currentCase: SwitchCase | null = null

  while (currentPos < content.length) {
    const caseMatch = content.slice(currentPos).match(/^@case\s*/)
    const defaultMatch = content.slice(currentPos).match(/^@default(?![a-z])/)
    const breakMatch = content.slice(currentPos).match(/^@break(?![a-z])/)

    if (caseMatch && content.slice(currentPos).startsWith('@case')) {
      // Save previous case
      if (currentCase) {
        cases.push(currentCase)
      }

      // Extract case value
      const caseExprStart = currentPos + caseMatch[0].length
      const caseExpr = extractParenthesizedExpression(content, caseExprStart)
      if (!caseExpr) {
        currentPos++
        continue
      }

      currentCase = {
        type: 'case',
        value: caseExpr.expression,
        content: '',
      }
      currentPos = caseExpr.endPos
    }
    else if (defaultMatch && content.slice(currentPos).startsWith('@default')) {
      // Save previous case
      if (currentCase) {
        cases.push(currentCase)
      }

      currentCase = {
        type: 'default',
        content: '',
      }
      currentPos += defaultMatch[0].length
    }
    else if (breakMatch && content.slice(currentPos).startsWith('@break')) {
      // End current case content
      currentPos += breakMatch[0].length
    }
    else {
      if (currentCase) {
        currentCase.content += content[currentPos]
      }
      currentPos++
    }
  }

  // Save last case
  if (currentCase) {
    cases.push(currentCase)
  }

  return {
    fullMatch: source.slice(startPos, endPos + '@endswitch'.length),
    expression: exprResult.expression,
    cases,
    start: startPos,
    end: endPos + '@endswitch'.length,
  }
}
