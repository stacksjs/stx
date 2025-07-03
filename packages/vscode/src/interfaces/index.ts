// Interface for mapping positions between STX and TypeScript
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
 * STX Component interface
 */
export interface STXComponent {
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
 * STX Directive interface
 */
export interface STXDirective {
  /** Directive name */
  name: string
  /** Directive parameters */
  params?: any[]
  /** Directive content */
  content?: string
}

/**
 * STX Template interface
 */
export interface STXTemplate {
  /** Template content */
  content: string
  /** Template data */
  data?: Record<string, any>
  /** Template components */
  components?: Record<string, STXComponent>
  /** Template directives */
  directives?: Record<string, STXDirective>
  /** Template styles */
  styles?: string[]
  /** Template scripts */
  scripts?: string[]
}

/**
 * STX Language Configuration
 */
export interface STXLanguageConfig {
  /** File extensions to associate with STX */
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
 * STX Snippet Definition
 */
export interface STXSnippet {
  /** Snippet prefix (trigger) */
  prefix: string
  /** Snippet body */
  body: string[]
  /** Snippet description */
  description: string
}

/**
 * STX Extension Configuration
 */
export interface STXExtensionConfig {
  /** Enable/disable the extension */
  enabled: boolean
  /** Language configuration */
  language: STXLanguageConfig
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
