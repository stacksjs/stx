/* eslint-disable no-cond-assign */
// Format JSDoc comment for hover display
export function formatJSDoc(comment: string): string {
  // First, clean up the comment by removing asterisks and extra whitespace
  const cleanedComment = comment
    .replace(/^\s*\*+/gm, '') // Remove leading asterisks on each line
    .replace(/\/\*\*/g, '') // Remove opening /**
    .replace(/\*\//g, '') // Remove closing */
    .trim()

  // Create a structured format to ensure line breaks
  const sections: string[] = []

  // Extract the main description (everything before the first @tag)
  const descriptionMatch = cleanedComment.match(/^([\s\S]*?)(?=@\w|$)/)
  if (descriptionMatch && descriptionMatch[1].trim()) {
    sections.push(descriptionMatch[1].trim())
  }

  // Extract @param tags
  const paramRegex = /@param\s+(?:\{([^}]+)\}\s*)?(\w+)(?:\s*-\s*(.*))?/g
  let paramMatch
  const params: string[] = []

  while ((paramMatch = paramRegex.exec(cleanedComment)) !== null) {
    const paramType = paramMatch[1] ? `*{${paramMatch[1]}}*` : ''
    const paramName = paramMatch[2]
    const paramDesc = paramMatch[3] || ''

    let formattedParam = `**Parameter** \`${paramName}\``
    if (paramType) {
      formattedParam += `: ${paramType}`
    }
    if (paramDesc) {
      formattedParam += ` - *${paramDesc}*`
    }

    params.push(formattedParam)
  }

  if (params.length > 0) {
    sections.push(params.join('\n\n'))
  }

  // Extract @returns tag
  const returnsRegex = /@returns?\s+(?:\{([^}]+)\})?\s*(.*)/
  const returnsMatch = cleanedComment.match(returnsRegex)
  if (returnsMatch) {
    const returnType = returnsMatch[1] ? `*{${returnsMatch[1]}}*` : ''
    const returnDesc = returnsMatch[2] || ''

    let formattedReturns = '**Returns**'
    if (returnType) {
      formattedReturns += ` ${returnType}`
    }
    if (returnDesc) {
      formattedReturns += ` *${returnDesc}*`
    }

    sections.push(formattedReturns)
  }

  // Extract @throws tag
  const throwsRegex = /@throws?\s+(?:\{([^}]+)\})?\s*(.*)/
  const throwsMatch = cleanedComment.match(throwsRegex)
  if (throwsMatch) {
    const throwType = throwsMatch[1] ? `*{${throwsMatch[1]}}*` : ''
    const throwDesc = throwsMatch[2] || ''

    let formattedThrows = '**Throws**'
    if (throwType) {
      formattedThrows += ` ${throwType}`
    }
    if (throwDesc) {
      formattedThrows += ` *${throwDesc}*`
    }

    sections.push(formattedThrows)
  }

  // Extract @deprecated tag
  if (cleanedComment.includes('@deprecated')) {
    const deprecatedRegex = /@deprecated\s*(.*)/
    const deprecatedMatch = cleanedComment.match(deprecatedRegex)
    const deprecatedDesc = deprecatedMatch ? deprecatedMatch[1] : ''

    let formattedDeprecated = '**⚠️ Deprecated**'
    if (deprecatedDesc) {
      formattedDeprecated += ` *${deprecatedDesc}*`
    }

    sections.push(formattedDeprecated)
  }

  // Extract @example blocks
  const exampleRegex = /@example\s+([\s\S]*?)(?=@\w|$)/g
  let exampleMatch

  while ((exampleMatch = exampleRegex.exec(cleanedComment)) !== null) {
    const exampleCode = exampleMatch[1].trim()

    // Format the example with line breaks and indentation
    let formattedCode = exampleCode

    // Normalize indentation to ensure consistent formatting
    const codeLines = formattedCode.split('\n')

    // Find the minimum indentation across all non-empty lines
    let minIndent = Infinity
    for (const line of codeLines) {
      if (line.trim() === '')
        continue // Skip empty lines
      const indent = line.match(/^\s*/)?.[0].length || 0
      minIndent = Math.min(minIndent, indent)
    }

    // If minIndent is still Infinity, set it to 0
    if (minIndent === Infinity)
      minIndent = 0

    // Remove the common indentation prefix from all lines
    const normalizedLines = codeLines.map((line) => {
      if (line.trim() === '')
        return ''
      return line.substring(minIndent)
    })

    // Fix the alignment of comment lines to match code
    const alignedLines = normalizedLines.map((line) => {
      // Add a space BEFORE comment slashes to match code indentation
      if (line.trim().startsWith('//')) {
        return ` ${line.trim()}`
      }
      return line
    })

    // Rejoin with normalized indentation
    formattedCode = alignedLines.join('\n')

    // If it's a one-liner with objects, format it nicely
    if (!formattedCode.includes('\n') && formattedCode.includes('{') && formattedCode.includes('}')) {
      formattedCode = formattedCode
        .replace(/\{\s*/g, '{\n  ')
        .replace(/,\s*/g, ',\n  ')
        .replace(/\s*\}/g, '\n}')
    }

    const formattedExample = `**Example**\n\n\`\`\`typescript\n${formattedCode}\n\`\`\``
    sections.push(formattedExample)
  }

  // Extract @see references
  const seeRegex = /@see\s+(\S+)(?:\s|$)/g
  let seeMatch
  const sees: string[] = []

  while ((seeMatch = seeRegex.exec(cleanedComment)) !== null) {
    const reference = seeMatch[1].trim()
    // Always include all @see references without filtering
    // Let the context-aware extraction in getJSDocForSymbol handle relevance
    sees.push(`**See**: [\`${reference}\`](#)`)
  }

  if (sees.length > 0) {
    sections.push(sees.join('\n\n'))
  }

  // Join all sections with double line breaks for clear separation
  return sections.join('\n\n')
}
