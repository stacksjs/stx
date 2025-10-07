// Interface for mapping positions between stx and TypeScript
export interface PositionMapping {
  stxLine: number
  stxChar: number
  tsLine: number
  tsChar: number
  length: number
}

// Interface for JSDoc comments
export interface JSDocInfo {
  comment: string
  symbol: string
  line: number
  isProperty?: boolean
  parentSymbol?: string
  symbolType?: string
  contentPosition?: number
  // New properties for better type information
  returnType?: string
  interfaceContent?: string
  propertyType?: string
  variableType?: string
  fullSignature?: string
}

// Export animation types
export * from './animation-types'

/**
 * stx Component interface
 */
export interface stxComponent {
  /** Component name */
  name: string
  /** Component props */
  props?: Record<string, any>
  /** Component slots */
  slots?: Record<string, string>
  /** Component styles */
  styles?: string
  /** Component template */
  template: string
}

/**
 * stx Directive interface
 */
export interface stxDirective {
  /** Directive name */
  name: string
  /** Directive parameters */
  params?: any[]
  /** Directive content */
  content?: string
}

/**
 * stx Template interface
 */
export interface stxTemplate {
  /** Template content */
  content: string
  /** Template data */
  data?: Record<string, any>
  /** Template components */
  components?: Record<string, stxComponent>
  /** Template directives */
  directives?: Record<string, stxDirective>
  /** Template styles */
  styles?: string[]
  /** Template scripts */
  scripts?: string[]
}

/**
 * stx Language Configuration
 */
export interface stxLanguageConfig {
  /** File extensions to associate with stx */
  extensions: string[]
  /** Language aliases */
  aliases: string[]
  /** Comment tokens */
  comments: {
    lineComment?: string
    blockComment?: [string, string]
  }
  /** Brackets for auto-closing */
  brackets: [string, string][]
  /** Auto-closing pairs */
  autoClosingPairs: {
    open: string
    close: string
  }[]
}

/**
 * stx Snippet Definition
 */
export interface stxSnippet {
  /** Snippet prefix (trigger) */
  prefix: string
  /** Snippet body */
  body: string[]
  /** Snippet description */
  description: string
}

/**
 * stx Extension Configuration
 */
export interface stxExtensionConfig {
  /** Enable/disable the extension */
  enabled: boolean
  /** Language configuration */
  language: stxLanguageConfig
  /** Formatting options */
  format: {
    /** Enable/disable auto formatting */
    enabled: boolean
    /** Maximum line length */
    maxLineLength?: number
    /** Indentation size */
    tabSize?: number
    /** Use spaces for indentation */
    insertSpaces?: boolean
  }
  /** Completion options */
  completion: {
    /** Enable/disable auto completion */
    enabled: boolean
    /** Enable/disable snippets */
    snippets?: boolean
    /** Enable/disable emmet */
    emmet?: boolean
  }
  /** Hover options */
  hover: {
    /** Enable/disable hover */
    enabled: boolean
    /** Show documentation on hover */
    showDocs?: boolean
  }
}
