/**
 * Detail about a single prop
 */
export interface PropDetail {
  /** Prop name */
  name: string
  /** TypeScript type */
  type: string
  /** Whether the prop is required */
  required: boolean
  /** Default value if specified */
  defaultValue?: string
  /** Description from JSDoc */
  description?: string
}

/**
 * Result of props type extraction
 */
export interface ExtractedProps {
  /** Raw type annotation from defineProps<T>() */
  typeAnnotation: string | null
  /** Full interface definition if type references a local interface */
  interfaceDefinition: string | null
  /** List of prop names */
  propNames: string[]
  /** Detailed info for each prop */
  propDetails: PropDetail[]
}

/**
 * Extracts prop type information from .stx component files.
 * Handles various patterns:
 * - defineProps<{ title: string }>()
 * - defineProps<ButtonProps>() with interface ButtonProps { ... }
 * - withDefaults(defineProps<Props>(), { count: 0 })
 */
export class PropsTypeExtractor {
  /**
   * Extract props type from component content
   */
  public extractPropsType(content: string): ExtractedProps {
    const result: ExtractedProps = {
      typeAnnotation: null,
      interfaceDefinition: null,
      propNames: [],
      propDetails: [],
    }

    // Extract script content
    const scriptContent = this.extractScriptContent(content)
    if (!scriptContent) {
      return result
    }

    // Try to find defineProps<T>() pattern
    const definePropsMatch = this.findDefineProps(scriptContent)
    if (!definePropsMatch) {
      return result
    }

    const { typeParam, isWithDefaults, defaultsObj } = definePropsMatch

    // If type is an inline object literal
    if (typeParam.trim().startsWith('{')) {
      result.typeAnnotation = typeParam
      result.propDetails = this.parseInlineType(typeParam)
    }
    else {
      // Type is a reference - find the interface/type definition
      const typeName = typeParam.trim()
      const interfaceDef = this.findInterfaceDefinition(scriptContent, typeName)
        || this.findTypeDefinition(scriptContent, typeName)

      if (interfaceDef) {
        result.typeAnnotation = typeName
        result.interfaceDefinition = interfaceDef
        result.propDetails = this.parseInterfaceContent(interfaceDef)
      }
      else {
        // Couldn't resolve the type, use the name as-is
        result.typeAnnotation = typeName
      }
    }

    // If withDefaults was used, merge default values
    if (isWithDefaults && defaultsObj) {
      this.mergeDefaults(result.propDetails, defaultsObj)
    }

    // Extract prop names
    result.propNames = result.propDetails.map(p => p.name)

    return result
  }

  /**
   * Extract content from <script> or <script server> tags
   */
  private extractScriptContent(content: string): string | null {
    // Match <script>, <script server>, or <script lang="ts"> etc.
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
    const matches: string[] = []

    let match
    while ((match = scriptRegex.exec(content)) !== null) {
      matches.push(match[1])
    }

    // Also check for @ts blocks
    const tsBlockRegex = /@ts\s+([\s\S]*?)@endts/g
    while ((match = tsBlockRegex.exec(content)) !== null) {
      matches.push(match[1])
    }

    return matches.length > 0 ? matches.join('\n') : null
  }

  /**
   * Find defineProps<T>() call and extract type parameter
   */
  private findDefineProps(scriptContent: string): {
    typeParam: string
    isWithDefaults: boolean
    defaultsObj: string | null
  } | null {
    // Pattern 1: withDefaults(defineProps<T>(), { defaults })
    const withDefaultsRegex = /withDefaults\s*\(\s*defineProps\s*<([\s\S]*?)>\s*\(\s*\)\s*,\s*(\{[\s\S]*?\})\s*\)/
    const withDefaultsMatch = scriptContent.match(withDefaultsRegex)
    if (withDefaultsMatch) {
      return {
        typeParam: withDefaultsMatch[1].trim(),
        isWithDefaults: true,
        defaultsObj: withDefaultsMatch[2],
      }
    }

    // Pattern 2: defineProps<T>()
    const definePropsRegex = /defineProps\s*<([\s\S]*?)>\s*\(\s*\)/
    const definePropsMatch = scriptContent.match(definePropsRegex)
    if (definePropsMatch) {
      return {
        typeParam: definePropsMatch[1].trim(),
        isWithDefaults: false,
        defaultsObj: null,
      }
    }

    return null
  }

  /**
   * Find interface definition by name
   */
  private findInterfaceDefinition(scriptContent: string, typeName: string): string | null {
    const regex = new RegExp(`interface\\s+${typeName}\\s*\\{([\\s\\S]*?)\\}`, 'm')
    const match = scriptContent.match(regex)
    return match ? match[1] : null
  }

  /**
   * Find type definition by name
   */
  private findTypeDefinition(scriptContent: string, typeName: string): string | null {
    const regex = new RegExp(`type\\s+${typeName}\\s*=\\s*\\{([\\s\\S]*?)\\}`, 'm')
    const match = scriptContent.match(regex)
    return match ? match[1] : null
  }

  /**
   * Parse inline type literal: { title: string; count?: number }
   */
  private parseInlineType(typeStr: string): PropDetail[] {
    // Remove outer braces and trim
    let inner = typeStr.trim()
    if (inner.startsWith('{'))
      inner = inner.slice(1)
    if (inner.endsWith('}'))
      inner = inner.slice(0, -1)
    inner = inner.trim()

    return this.parseInterfaceContent(inner)
  }

  /**
   * Parse interface/type content to extract prop details
   */
  private parseInterfaceContent(content: string): PropDetail[] {
    const props: PropDetail[] = []

    // Split by semicolons or newlines, handling nested types
    const lines = this.splitProperties(content)

    for (const line of lines) {
      const prop = this.parsePropertyLine(line)
      if (prop) {
        props.push(prop)
      }
    }

    return props
  }

  /**
   * Split interface content into individual property declarations
   */
  private splitProperties(content: string): string[] {
    const properties: string[] = []
    let current = ''
    let depth = 0
    let inString = false
    let stringChar = ''

    for (let i = 0; i < content.length; i++) {
      const char = content[i]
      const prevChar = i > 0 ? content[i - 1] : ''

      // Track string state
      if ((char === '"' || char === '\'' || char === '`') && prevChar !== '\\') {
        if (!inString) {
          inString = true
          stringChar = char
        }
        else if (char === stringChar) {
          inString = false
        }
      }

      if (!inString) {
        // Track nesting depth
        if (char === '{' || char === '<' || char === '(') {
          depth++
        }
        else if (char === '}' || char === '>' || char === ')') {
          depth--
        }

        // Split on semicolon or newline at depth 0
        if (depth === 0 && (char === ';' || char === '\n')) {
          if (current.trim()) {
            properties.push(current.trim())
          }
          current = ''
          continue
        }
      }

      current += char
    }

    // Don't forget the last property
    if (current.trim()) {
      properties.push(current.trim())
    }

    return properties
  }

  /**
   * Parse a single property line: "title?: string" or "/** Description *\/ count: number"
   */
  private parsePropertyLine(line: string): PropDetail | null {
    // Skip empty lines and comment-only lines
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//'))
      return null

    // Extract JSDoc comment if present
    let description: string | undefined
    let propLine = trimmed

    const jsDocMatch = trimmed.match(/\/\*\*\s*([\s\S]*?)\s*\*\/\s*(.*)/)
    if (jsDocMatch) {
      description = jsDocMatch[1].replace(/\s*\*\s*/g, ' ').trim()
      propLine = jsDocMatch[2]
    }

    // Parse property: name?: type
    const propMatch = propLine.match(/^(\w+)(\?)?:\s*(.+)$/)
    if (!propMatch)
      return null

    const name = propMatch[1]
    const optional = propMatch[2] === '?'
    const type = propMatch[3].trim()

    return {
      name,
      type,
      required: !optional,
      description,
    }
  }

  /**
   * Merge default values into prop details
   */
  private mergeDefaults(propDetails: PropDetail[], defaultsObj: string): void {
    // Parse defaults object: { count: 0, title: 'Hello' }
    let inner = defaultsObj.trim()
    if (inner.startsWith('{'))
      inner = inner.slice(1)
    if (inner.endsWith('}'))
      inner = inner.slice(0, -1)

    // Simple regex to extract key: value pairs
    const defaultsRegex = /(\w+)\s*:\s*([^,}]+)/g
    let match
    while ((match = defaultsRegex.exec(inner)) !== null) {
      const propName = match[1]
      const defaultValue = match[2].trim()

      const prop = propDetails.find(p => p.name === propName)
      if (prop) {
        prop.defaultValue = defaultValue
        // Props with defaults are technically not required at call site
        prop.required = false
      }
    }
  }

  /**
   * Generate a TypeScript type string from prop details
   */
  public generateTypeString(propDetails: PropDetail[]): string {
    if (propDetails.length === 0) {
      return 'Record<string, unknown>'
    }

    const props = propDetails.map((p) => {
      const optional = p.required ? '' : '?'
      return `${p.name}${optional}: ${p.type}`
    })

    return `{ ${props.join('; ')} }`
  }
}
