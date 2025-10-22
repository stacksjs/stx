import prettier from 'prettier/standalone'
import parserCSS from 'prettier/parser-postcss'

/**
 * Parse and prettify CSS output
 */
export function prettifyCSS(css: string): string {
  try {
    return prettier.format(css, {
      parser: 'css',
      plugins: [parserCSS],
    }).trim()
  }
  catch {
    return css
  }
}

/**
 * Extract CSS rules from generated stylesheet
 */
export function extractRuleForClass(css: string, className: string): string | null {
  // Match class selector and its rules
  const escapedClass = className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`\\.${escapedClass}\\s*{([^}]*)}`, 'g')
  const match = regex.exec(css)

  if (match && match[1]) {
    return match[1].trim()
  }

  return null
}

/**
 * Convert CSS declarations to human-readable format
 */
export function formatCSSDeclarations(declarations: string): string {
  return declarations
    .split(';')
    .map(decl => decl.trim())
    .filter(Boolean)
    .map(decl => `  ${decl};`)
    .join('\n')
}

/**
 * Add rem to px comment for size-related properties
 */
export function addRemToPxComment(css: string, remToPxRatio = 16): string {
  if (remToPxRatio <= 0)
    return css

  return css.replace(/(\d+\.?\d*)rem/g, (match, value) => {
    const pxValue = Number.parseFloat(value) * remToPxRatio
    return `${match} /* ${pxValue}px */`
  })
}
