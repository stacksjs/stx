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
