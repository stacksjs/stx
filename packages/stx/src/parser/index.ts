/**
 * Parser Module
 *
 * Provides tokenization and expression parsing utilities for the stx framework.
 * This module replaces regex-based parsing with proper tokenization for better
 * handling of nested structures, strings, and template expressions.
 *
 * @module parser
 */

// Directive parser
export {
  type ConditionalBranch,
  type DirectiveMatch,
  extractParenthesizedExpression,
  findDirectiveBlocks,
  findIfBlocks,
  findMatchingEndTag,
  parseConditionalBlock,
  type ParsedConditional,
  type ParsedSwitch,
  parseSwitchBlock,
  type SwitchCase,
} from './directive-parser'

// Expression parser
export {
  type ExpressionMatch,
  extractDirectiveParams,
  type FilterCall,
  findExpressions,
  parseArguments,
  type ParsedExpression,
  parseExpressionWithFilters,
  parseScriptDeclarations,
  type ScriptDeclaration,
} from './expression-parser'

// Tokenizer
export {
  type Token,
  Tokenizer,
  type TokenizerState,
  type TokenType,
} from './tokenizer'

// Expression parsing utilities
export {
  extractBalancedExpression,
  findMatchingDelimiter,
  splitByPipe,
} from './tokenizer'
