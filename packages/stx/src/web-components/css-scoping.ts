/**
 * CSS Scoping for Web Components
 *
 * Provides utilities for scoping CSS styles to specific components
 * to prevent style leakage in Shadow DOM and for component isolation.
 */

/**
 * Parsed CSS rule representation
 */
interface CssRule {
  selector: string
  declarations: string
}

/**
 * Options for CSS scoping
 */
export interface CssScopingOptions {
  /** Prefix to add to selectors */
  prefix?: string
  /** Whether to preserve :host selectors */
  preserveHost?: boolean
  /** Whether to scope keyframe names */
  scopeKeyframes?: boolean
  /** Whether to scope CSS custom properties */
  scopeCustomProperties?: boolean
}

/**
 * Generate a unique component ID based on hash
 */
export function generateComponentId(componentName: string, salt: string = ''): string {
  const input = `${componentName}${salt}`
  let hash = 0

  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  return `stx-${Math.abs(hash).toString(36)}`
}

/**
 * Scope CSS to a specific component
 *
 * @param css - Raw CSS string
 * @param componentId - Unique component identifier
 * @param options - Scoping options
 * @returns Scoped CSS string
 *
 * @example
 * ```typescript
 * const scoped = scopeCss('.button { color: red; }', 'stx-abc123')
 * // Returns: '.stx-abc123 .button { color: red; }'
 * ```
 */
export function scopeCss(
  css: string,
  componentId: string,
  options: CssScopingOptions = {},
): string {
  const {
    prefix = '',
    preserveHost = true,
    scopeKeyframes = true,
    scopeCustomProperties = false,
  } = options

  if (!css.trim()) {
    return ''
  }

  // Parse CSS rules
  const rules = parseCssRules(css)
  const scopedRules: string[] = []
  const keyframeMap = new Map<string, string>()

  // First pass: collect keyframe names for renaming
  if (scopeKeyframes) {
    for (const rule of rules) {
      const keyframeMatch = rule.selector.match(/@keyframes\s+([a-z_-][a-z0-9_-]*)/i)
      if (keyframeMatch) {
        const originalName = keyframeMatch[1]
        const scopedName = `${componentId}_${originalName}`
        keyframeMap.set(originalName, scopedName)
      }
    }
  }

  // Second pass: scope rules
  for (const rule of rules) {
    const scopedRule = scopeRule(rule, componentId, prefix, preserveHost, keyframeMap, scopeCustomProperties)
    scopedRules.push(scopedRule)
  }

  return scopedRules.join('\n\n')
}

/**
 * Parse CSS into individual rules
 */
function parseCssRules(css: string): CssRule[] {
  const rules: CssRule[] = []

  // Remove CSS comments
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '')

  // Handle @-rules and regular rules
  let depth = 0
  let currentRule = ''
  let inAtRule = false
  let atRuleContent = ''

  for (let i = 0; i < cleanCss.length; i++) {
    const char = cleanCss[i]

    if (char === '@' && depth === 0) {
      inAtRule = true
    }

    if (char === '{') {
      depth++
    }
    else if (char === '}') {
      depth--

      if (depth === 0) {
        if (inAtRule) {
          // End of @-rule block
          atRuleContent += char
          const atRuleMatch = atRuleContent.match(/@([a-z-]+)\s*([^{]*)\{([\s\S]*)\}/i)

          if (atRuleMatch) {
            const [, atName, atParams, innerContent] = atRuleMatch

            if (atName === 'keyframes') {
              rules.push({
                selector: `@keyframes ${atParams.trim()}`,
                declarations: innerContent.trim(),
              })
            }
            else if (atName === 'media' || atName === 'supports' || atName === 'container') {
              // Recursively parse nested rules
              const nestedRules = parseCssRules(innerContent)
              rules.push({
                selector: `@${atName} ${atParams.trim()}`,
                declarations: nestedRules.map(r => `${r.selector} { ${r.declarations} }`).join('\n'),
              })
            }
            else {
              // Other @-rules
              rules.push({
                selector: `@${atName} ${atParams.trim()}`,
                declarations: innerContent.trim(),
              })
            }
          }

          atRuleContent = ''
          inAtRule = false
        }
        else if (currentRule.trim()) {
          // End of regular rule
          currentRule += char
          const ruleMatch = currentRule.match(/([^{]+)\{([^}]*)\}/)

          if (ruleMatch) {
            rules.push({
              selector: ruleMatch[1].trim(),
              declarations: ruleMatch[2].trim(),
            })
          }

          currentRule = ''
        }

        continue
      }
    }

    if (inAtRule) {
      atRuleContent += char
    }
    else {
      currentRule += char
    }
  }

  return rules
}

/**
 * Scope an individual CSS rule
 */
function scopeRule(
  rule: CssRule,
  componentId: string,
  prefix: string,
  preserveHost: boolean,
  keyframeMap: Map<string, string>,
  scopeCustomProperties: boolean,
): string {
  const { selector, declarations } = rule

  // Handle @-rules
  if (selector.startsWith('@')) {
    if (selector.startsWith('@keyframes')) {
      const keyframeName = selector.replace('@keyframes ', '').trim()
      const scopedName = keyframeMap.get(keyframeName) || keyframeName
      return `@keyframes ${scopedName} { ${declarations} }`
    }

    if (selector.startsWith('@media') || selector.startsWith('@supports') || selector.startsWith('@container')) {
      // Recursively scope nested rules
      const nestedRules = parseCssRules(`x { ${declarations} }`.replace(/x \{ /, '').replace(/ \}$/, ''))
      const scopedNested = nestedRules
        .map(r => scopeRule(r, componentId, prefix, preserveHost, keyframeMap, scopeCustomProperties))
        .join('\n  ')
      return `${selector} {\n  ${scopedNested}\n}`
    }

    // Return other @-rules unchanged
    return `${selector} { ${declarations} }`
  }

  // Scope regular selectors
  const scopedSelector = scopeSelector(selector, componentId, prefix, preserveHost)

  // Process declarations for keyframe and custom property references
  let processedDeclarations = declarations

  // Replace keyframe references
  for (const [original, scoped] of keyframeMap) {
    processedDeclarations = processedDeclarations.replace(
      new RegExp(`\\b${original}\\b`, 'g'),
      scoped,
    )
  }

  // Optionally scope custom properties
  if (scopeCustomProperties) {
    processedDeclarations = processedDeclarations.replace(
      /--([a-z-]+)/gi,
      `--${componentId}-$1`,
    )
  }

  return `${scopedSelector} { ${processedDeclarations} }`
}

/**
 * Scope a CSS selector
 */
function scopeSelector(
  selector: string,
  componentId: string,
  prefix: string,
  preserveHost: boolean,
): string {
  // Split compound selectors
  const selectors = selector.split(',').map(s => s.trim())
  const scopedSelectors: string[] = []

  for (const sel of selectors) {
    // Handle :host pseudo-class
    if (sel.startsWith(':host')) {
      if (preserveHost) {
        scopedSelectors.push(sel)
      }
      else {
        // Replace :host with component selector
        const hostReplacement = sel.replace(/:host(\([^)]*\))?/, `.${componentId}$1`)
        scopedSelectors.push(hostReplacement)
      }
      continue
    }

    // Handle ::slotted pseudo-element
    if (sel.includes('::slotted')) {
      scopedSelectors.push(sel)
      continue
    }

    // Handle :root
    if (sel === ':root') {
      scopedSelectors.push(`:root .${componentId}`)
      continue
    }

    // Scope regular selectors
    const fullPrefix = prefix ? `${prefix} .${componentId}` : `.${componentId}`
    scopedSelectors.push(`${fullPrefix} ${sel}`)
  }

  return scopedSelectors.join(', ')
}

/**
 * Extract CSS from a template
 *
 * @param template - The template string
 * @returns Object with CSS content and template without style tags
 */
export function extractStyleFromTemplate(template: string): {
  css: string
  templateWithoutStyle: string
} {
  const styleMatch = template.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i)
  const css = styleMatch ? styleMatch[1] : ''
  const templateWithoutStyle = styleMatch
    ? template.replace(/<style\b[^>]*>[\s\S]*?<\/style>/i, '')
    : template

  return { css, templateWithoutStyle }
}

/**
 * Inject scoped CSS into a template
 *
 * @param template - The template string
 * @param scopedCss - The scoped CSS to inject
 * @param position - Where to inject: 'head', 'body-start', 'body-end'
 * @returns Template with injected CSS
 */
export function injectScopedCss(
  template: string,
  scopedCss: string,
  position: 'head' | 'body-start' | 'body-end' = 'head',
): string {
  if (!scopedCss.trim()) {
    return template
  }

  const styleTag = `<style data-stx-scoped>\n${scopedCss}\n</style>`

  switch (position) {
    case 'head':
      if (template.includes('</head>')) {
        return template.replace('</head>', `${styleTag}\n</head>`)
      }
      return styleTag + template

    case 'body-start':
      if (template.includes('<body')) {
        return template.replace(/(<body[^>]*>)/, `$1\n${styleTag}`)
      }
      return styleTag + template

    case 'body-end':
      if (template.includes('</body>')) {
        return template.replace('</body>', `${styleTag}\n</body>`)
      }
      return template + styleTag

    default:
      return template
  }
}

/**
 * Generate CSS for Shadow DOM encapsulation
 *
 * @param css - Raw CSS
 * @returns CSS suitable for Shadow DOM
 */
export function generateShadowDomCss(css: string): string {
  // For Shadow DOM, we don't need to scope selectors
  // but we should handle :host properly
  return css.trim()
}
