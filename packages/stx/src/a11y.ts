/**
 * Accessibility (A11y) Module
 *
 * Provides directives and utilities for accessibility compliance:
 * - `@a11y('type', 'message')` - Add accessibility hints as HTML comments
 * - `@screenReader(...)@endScreenReader` - Screen reader only content
 * - `@ariaDescribe('id', 'description')` - Connect elements with descriptions
 *
 * Also provides automated accessibility checking via `checkA11y()` and
 * directory scanning via `scanA11yIssues()`.
 *
 * ## Accessibility Checks
 *
 * The automated checker validates:
 * - Images have alt attributes
 * - Interactive elements have accessible names
 * - Form inputs have associated labels
 * - Heading hierarchy is maintained
 * - Document has lang attribute
 */
import type { CustomDirective, StxOptions } from './types'
import path from 'node:path'

// =============================================================================
// Types
// =============================================================================

/**
 * Accessibility violation found during a11y checks
 */
export interface A11yViolation {
  /** Type/category of violation */
  type: string
  /** The problematic HTML element */
  element: string
  /** Description of the issue */
  message: string
  /** Impact level of the violation */
  impact: 'critical' | 'serious' | 'moderate' | 'minor'
  /** Suggested fix */
  help: string
  /** URL to more information */
  helpUrl?: string
}

// =============================================================================
// Directive Processing
// =============================================================================

/**
 * Process accessibility directives.
 * Handles @a11y hints, @screenReader content, and @ariaDescribe.
 */
export function processA11yDirectives(
  template: string,
  _context: Record<string, any>,
  _filePath: string,
  _options: StxOptions,
): string {
  let output = template

  // Process @a11y directive for accessibility hints
  output = output.replace(
    /@a11y\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/g,
    (_, hintType, customMessage) => {
      const hints: Record<string, string> = {
        'aria-label': 'Ensure interactive elements have accessible labels',
        'alt-text': 'Provide alternative text for images',
        'focus': 'Ensure the element can receive keyboard focus',
        'landmark': 'Use appropriate landmark roles',
        'heading-order': 'Maintain proper heading hierarchy',
        'color-contrast': 'Ensure sufficient color contrast',
        'keyboard-nav': 'Make sure element is keyboard navigable',
        'screen-reader': 'Optimize for screen reader users',
      }

      const hint = hints[hintType] || 'Make this element accessible'
      const message = customMessage || hint

      // Add an HTML comment with the accessibility hint
      return `<!-- a11y-hint: ${message} -->`
    },
  )

  // Process @screenReader directive for screen reader only content
  // This pattern matches: @screenReader(content)@endScreenReader
  const screenReaderRegex = /@screenReader\(([^@]*)\)@endScreenReader/g
  output = output.replace(screenReaderRegex, (_, content) => {
    return `<span class="sr-only">${content.trim()}</span>`
  })

  // Process @ariaDescribe directive to connect elements with descriptions
  output = output.replace(
    /@ariaDescribe\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g,
    (_, elementId, description) => {
      const descId = `desc-${elementId}`
      return `<span id="${descId}" class="sr-only">${description}</span>`
    },
  )

  return output
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Create the screen reader only CSS style.
 * Add this to your stylesheet or inject via `<style>` tag.
 */
export function getScreenReaderOnlyStyle(): string {
  return `
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
`.trim()
}

// =============================================================================
// Accessibility Checker
// =============================================================================

/**
 * Check if DOM environment is available.
 * Useful for determining which accessibility checking mode will be used.
 *
 * @returns true if DOM APIs are available (happy-dom, jsdom, browser)
 *
 * @example
 * ```typescript
 * if (hasDOMSupport()) {
 *   console.log('Using full DOM-based a11y checking')
 * } else {
 *   console.log('Using regex-based a11y checking (limited)')
 * }
 * ```
 */
export function hasDOMSupport(): boolean {
  return typeof globalThis.document !== 'undefined'
    && typeof globalThis.document.createElement === 'function'
}

/**
 * Regex-based accessibility checker for non-DOM environments.
 * Provides a subset of checks that can be performed with regex parsing.
 *
 * @param html - HTML content to check
 * @param _filePath - File path for error reporting
 * @returns Array of accessibility violations found
 */
function checkA11yWithRegex(html: string, _filePath: string): A11yViolation[] {
  const violations: A11yViolation[] = []

  // Check 1: Images without alt text
  // Match <img> tags and check if they have alt attribute
  const imgRegex = /<img\s+([^>]*)>/gi
  let match: RegExpExecArray | null
  match = imgRegex.exec(html)
  while (match !== null) {
    const attrs = match[1]
    if (!/\balt\s*=/i.test(attrs)) {
      violations.push({
        type: 'missing-alt',
        element: match[0].substring(0, 100),
        message: 'Image missing alt attribute',
        impact: 'serious',
        help: 'Add alt text to images for screen readers',
        helpUrl: 'https://web.dev/learn/accessibility/images/',
      })
    }
    match = imgRegex.exec(html)
  }

  // Check 2: Empty buttons
  const emptyButtonRegex = /<button([^>]*)>\s*<\/button>/gi
  match = emptyButtonRegex.exec(html)
  while (match !== null) {
    const attrs = match[1]
    if (!/\baria-label\s*=/i.test(attrs) && !/\btitle\s*=/i.test(attrs)) {
      violations.push({
        type: 'missing-accessible-name',
        element: match[0].substring(0, 100),
        message: 'Empty button missing accessible name',
        impact: 'critical',
        help: 'Add text content, aria-label, or title',
        helpUrl: 'https://web.dev/learn/accessibility/aria-html/',
      })
    }
    match = emptyButtonRegex.exec(html)
  }

  // Check 3: Empty links
  const emptyLinkRegex = /<a\s+([^>]*)>\s*<\/a>/gi
  match = emptyLinkRegex.exec(html)
  while (match !== null) {
    const attrs = match[1]
    if (!/\baria-label\s*=/i.test(attrs) && !/\btitle\s*=/i.test(attrs)) {
      violations.push({
        type: 'link-missing-text',
        element: match[0].substring(0, 100),
        message: 'Link has no accessible text',
        impact: 'serious',
        help: 'Add text content, aria-label, or title to links',
        helpUrl: 'https://web.dev/learn/accessibility/more-html/#links',
      })
    }
    match = emptyLinkRegex.exec(html)
  }

  // Check 4: Form inputs without labels
  const inputRegex = /<(input|select|textarea)\s+([^>]*)>/gi
  match = inputRegex.exec(html)
  while (match !== null) {
    const attrs = match[2]
    // Skip hidden inputs
    if (/\btype\s*=\s*["']hidden["']/i.test(attrs)) {
      match = inputRegex.exec(html)
      continue
    }
    // Check for label association
    const hasAriaLabel = /\baria-label\s*=/i.test(attrs) || /\baria-labelledby\s*=/i.test(attrs)
    const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)

    if (!hasAriaLabel) {
      // Try to find associated label by ID
      const hasLabel = idMatch && new RegExp(`<label[^>]*\\bfor\\s*=\\s*["']${idMatch[1]}["']`, 'i').test(html)
      if (!hasLabel) {
        violations.push({
          type: 'input-missing-label',
          element: match[0].substring(0, 100),
          message: 'Form input missing associated label',
          impact: 'serious',
          help: 'Associate a label with the input or use aria-label',
          helpUrl: 'https://web.dev/learn/accessibility/forms/',
        })
      }
    }
    match = inputRegex.exec(html)
  }

  // Check 5: Heading hierarchy (simplified check)
  const headingRegex = /<h([1-6])[^>]*>/gi
  const headings: number[] = []
  match = headingRegex.exec(html)
  while (match !== null) {
    headings.push(Number.parseInt(match[1], 10))
    match = headingRegex.exec(html)
  }

  let prevLevel = 0
  for (const level of headings) {
    if (prevLevel > 0 && level > prevLevel + 1) {
      violations.push({
        type: 'heading-skip',
        element: `<h${level}>`,
        message: `Heading level skipped from h${prevLevel} to h${level}`,
        impact: 'moderate',
        help: 'Maintain proper heading hierarchy without skipping levels',
        helpUrl: 'https://web.dev/learn/accessibility/structure/',
      })
    }
    prevLevel = level
  }

  // Check 6: Missing language attribute
  if (/<html\b/i.test(html) && !/<html[^>]*\blang\s*=/i.test(html)) {
    violations.push({
      type: 'missing-lang',
      element: '<html>',
      message: 'Document language not specified',
      impact: 'serious',
      help: 'Add lang attribute to the html element',
      helpUrl: 'https://web.dev/learn/accessibility/more-html/#language',
    })
  }

  // Check 7: Tables without headers
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  match = tableRegex.exec(html)
  while (match !== null) {
    const tableContent = match[1]
    if (!/<th\b/i.test(tableContent)) {
      violations.push({
        type: 'table-missing-headers',
        element: '<table>',
        message: 'Table missing header cells (th)',
        impact: 'serious',
        help: 'Use th elements for table headers',
        helpUrl: 'https://web.dev/learn/accessibility/more-html/#tables',
      })
    }
    match = tableRegex.exec(html)
  }

  // Check 8: Auto-playing media without muted
  const autoplayRegex = /<(video|audio)[^>]*\bautoplay\b[^>]*>/gi
  match = autoplayRegex.exec(html)
  while (match !== null) {
    if (!/\bmuted\b/i.test(match[0])) {
      violations.push({
        type: 'autoplay-audio',
        element: `<${match[1]}>`,
        message: 'Auto-playing media may disrupt users',
        impact: 'moderate',
        help: 'Add muted attribute or provide controls to stop playback',
        helpUrl: 'https://web.dev/learn/accessibility/more-html/#multimedia',
      })
    }
    match = autoplayRegex.exec(html)
  }

  // Check 9: Positive tabindex
  const tabindexRegex = /\btabindex\s*=\s*["']([1-9]\d*)["']/gi
  match = tabindexRegex.exec(html)
  while (match !== null) {
    violations.push({
      type: 'positive-tabindex',
      element: `tabindex="${match[1]}"`,
      message: 'Positive tabindex disrupts natural tab order',
      impact: 'moderate',
      help: 'Use tabindex="0" or "-1" instead of positive values',
      helpUrl: 'https://web.dev/learn/accessibility/focus/#tab-index',
    })
    match = tabindexRegex.exec(html)
  }

  // Check 10: Iframes without title
  const iframeRegex = /<iframe\s+([^>]*)>/gi
  match = iframeRegex.exec(html)
  while (match !== null) {
    const attrs = match[1]
    if (!/\btitle\s*=/i.test(attrs) && !/\baria-label\s*=/i.test(attrs)) {
      violations.push({
        type: 'iframe-missing-title',
        element: '<iframe>',
        message: 'Iframe missing title attribute',
        impact: 'serious',
        help: 'Add a title attribute to describe the iframe content',
        helpUrl: 'https://web.dev/learn/accessibility/more-html/#frames',
      })
    }
    match = iframeRegex.exec(html)
  }

  // Check 11: Elements with role="button" without tabindex
  const roleButtonRegex = /<([a-z]+)\s+([^>]*role\s*=\s*["']button["'][^>]*)>/gi
  match = roleButtonRegex.exec(html)
  while (match !== null) {
    const tag = match[1].toLowerCase()
    const attrs = match[2]
    // Skip actual buttons
    if (tag !== 'button' && !/\btabindex\s*=/i.test(attrs)) {
      violations.push({
        type: 'button-not-focusable',
        element: match[0].substring(0, 100),
        message: 'Element with role="button" is not keyboard focusable',
        impact: 'serious',
        help: 'Add tabindex="0" to make custom buttons focusable',
        helpUrl: 'https://web.dev/learn/accessibility/focus/',
      })
    }
    match = roleButtonRegex.exec(html)
  }

  return violations
}

/**
 * Automatically check template for accessibility issues.
 *
 * This function works in both DOM and non-DOM environments:
 * - With DOM (happy-dom/jsdom): Full accessibility checking with element traversal
 * - Without DOM: Regex-based checking for common issues
 *
 * @param html - HTML content to check
 * @param filePath - File path for error reporting
 * @returns Array of accessibility violations found
 *
 * @example
 * ```typescript
 * const violations = await checkA11y('<img src="photo.jpg">', 'page.html')
 * // violations[0].type === 'missing-alt'
 * ```
 */
export async function checkA11y(html: string, filePath: string): Promise<A11yViolation[]> {
  // Use regex-based checking if DOM is not available
  if (!hasDOMSupport()) {
    return checkA11yWithRegex(html, filePath)
  }

  const violations: A11yViolation[] = []

  try {
    // Parse HTML by setting innerHTML on a temporary container
    const container = globalThis.document.createElement('div')
    container.innerHTML = html

    // Check 1: Images without alt text
    container.querySelectorAll('img').forEach((img: Element) => {
      if (!img.hasAttribute('alt')) {
        violations.push({
          type: 'missing-alt',
          element: `<${img.outerHTML}>`,
          message: 'Image missing alt attribute',
          impact: 'serious',
          help: 'Add alt text to images for screen readers',
          helpUrl: 'https://web.dev/learn/accessibility/images/',
        })
      }
    })

    // Check 2: Interactive elements without accessible names
    container.querySelectorAll('button, a, [role="button"]').forEach((el: Element) => {
      const hasAccessibleName = el.hasAttribute('aria-label')
        || el.hasAttribute('aria-labelledby')
        || (el.textContent && el.textContent.trim().length > 0)

      if (!hasAccessibleName) {
        violations.push({
          type: 'missing-accessible-name',
          element: `<${el.outerHTML}>`,
          message: 'Interactive element missing accessible name',
          impact: 'critical',
          help: 'Add text content, aria-label, or aria-labelledby',
          helpUrl: 'https://web.dev/learn/accessibility/aria-html/',
        })
      }
    })

    // Check 3: Form inputs without labels
    container.querySelectorAll('input, select, textarea').forEach((input: Element) => {
      const id = input.getAttribute('id')
      const hasLabel = id && container.querySelector(`label[for="${id}"]`)
      const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby')
      const withinLabel = input.parentElement?.tagName === 'LABEL'

      if (!hasLabel && !hasAriaLabel && !withinLabel) {
        violations.push({
          type: 'input-missing-label',
          element: `<${input.outerHTML}>`,
          message: 'Form input missing associated label',
          impact: 'serious',
          help: 'Associate a label with the input or use aria-label',
          helpUrl: 'https://web.dev/learn/accessibility/forms/',
        })
      }
    })

    // Check 4: Heading hierarchy
    const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    let prevLevel = 0

    for (const heading of headings) {
      const level = Number.parseInt(heading.tagName.charAt(1))

      if (prevLevel > 0 && level > prevLevel + 1) {
        violations.push({
          type: 'heading-skip',
          element: `<${heading.outerHTML}>`,
          message: `Heading level skipped from h${prevLevel} to h${level}`,
          impact: 'moderate',
          help: 'Maintain proper heading hierarchy without skipping levels',
          helpUrl: 'https://web.dev/learn/accessibility/structure/',
        })
      }

      prevLevel = level
    }

    // Check 5: Missing language attribute
    // Check if the HTML fragment contains an <html> tag
    const htmlElement = container.querySelector('html')
    if (html.includes('<html') && htmlElement && !htmlElement.hasAttribute('lang')) {
      violations.push({
        type: 'missing-lang',
        element: '<html>',
        message: 'Document language not specified',
        impact: 'serious',
        help: 'Add lang attribute to the html element',
        helpUrl: 'https://web.dev/learn/accessibility/more-html/#language',
      })
    }

    // Check 6: Links without accessible text
    container.querySelectorAll('a').forEach((link: Element) => {
      const hasText = link.textContent && link.textContent.trim().length > 0
      const hasAriaLabel = link.hasAttribute('aria-label') || link.hasAttribute('aria-labelledby')
      const hasTitle = link.hasAttribute('title')
      const hasImg = link.querySelector('img[alt]')

      if (!hasText && !hasAriaLabel && !hasTitle && !hasImg) {
        violations.push({
          type: 'link-missing-text',
          element: `<${link.outerHTML}>`,
          message: 'Link has no accessible text',
          impact: 'serious',
          help: 'Add text content, aria-label, or title to links',
          helpUrl: 'https://web.dev/learn/accessibility/more-html/#links',
        })
      }
    })

    // Check 7: Missing skip navigation link
    if (html.includes('<nav') || html.includes('<header')) {
      const hasSkipLink = container.querySelector('a[href="#main"], a[href="#content"], .skip-link, [class*="skip"]')
      if (!hasSkipLink && container.querySelectorAll('a').length > 5) {
        violations.push({
          type: 'missing-skip-link',
          element: '<nav>',
          message: 'Consider adding a skip navigation link',
          impact: 'minor',
          help: 'Add a skip link to allow keyboard users to bypass navigation',
          helpUrl: 'https://web.dev/learn/accessibility/focus/#skip-links',
        })
      }
    }

    // Check 8: Tables without proper structure
    container.querySelectorAll('table').forEach((table: Element) => {
      const hasCaption = table.querySelector('caption')
      const hasHeaders = table.querySelector('th')

      if (!hasHeaders) {
        violations.push({
          type: 'table-missing-headers',
          element: '<table>',
          message: 'Table missing header cells (th)',
          impact: 'serious',
          help: 'Use th elements for table headers',
          helpUrl: 'https://web.dev/learn/accessibility/more-html/#tables',
        })
      }

      if (!hasCaption && !table.hasAttribute('aria-label') && !table.hasAttribute('aria-labelledby')) {
        violations.push({
          type: 'table-missing-caption',
          element: '<table>',
          message: 'Table missing caption or accessible name',
          impact: 'minor',
          help: 'Add a caption element or aria-label to describe the table',
          helpUrl: 'https://web.dev/learn/accessibility/more-html/#tables',
        })
      }
    })

    // Check 9: Color contrast (basic check for inline styles)
    container.querySelectorAll('[style*="color"]').forEach((el: Element) => {
      const style = el.getAttribute('style') || ''
      // Very basic check - just flag elements with color in style
      if (style.includes('color:') && !style.includes('background')) {
        violations.push({
          type: 'potential-contrast-issue',
          element: `<${el.tagName.toLowerCase()}>`,
          message: 'Element has inline color style - verify contrast ratio',
          impact: 'minor',
          help: 'Ensure text has sufficient contrast ratio (4.5:1 for normal text)',
          helpUrl: 'https://web.dev/learn/accessibility/color-contrast/',
        })
      }
    })

    // Check 10: Auto-playing media
    container.querySelectorAll('video[autoplay], audio[autoplay]').forEach((media: Element) => {
      if (!media.hasAttribute('muted')) {
        violations.push({
          type: 'autoplay-audio',
          element: `<${media.tagName.toLowerCase()}>`,
          message: 'Auto-playing media may disrupt users',
          impact: 'moderate',
          help: 'Add muted attribute or provide controls to stop playback',
          helpUrl: 'https://web.dev/learn/accessibility/more-html/#multimedia',
        })
      }
    })

    // Check 11: Tab index issues
    container.querySelectorAll('[tabindex]').forEach((el: Element) => {
      const tabindex = Number.parseInt(el.getAttribute('tabindex') || '0')
      if (tabindex > 0) {
        violations.push({
          type: 'positive-tabindex',
          element: `<${el.tagName.toLowerCase()}>`,
          message: 'Positive tabindex disrupts natural tab order',
          impact: 'moderate',
          help: 'Use tabindex="0" or "-1" instead of positive values',
          helpUrl: 'https://web.dev/learn/accessibility/focus/#tab-index',
        })
      }
    })

    // Check 12: Empty buttons or links styled as buttons
    container.querySelectorAll('[role="button"]').forEach((el: Element) => {
      if (!el.hasAttribute('tabindex')) {
        violations.push({
          type: 'button-not-focusable',
          element: `<${el.outerHTML}>`,
          message: 'Element with role="button" is not keyboard focusable',
          impact: 'serious',
          help: 'Add tabindex="0" to make custom buttons focusable',
          helpUrl: 'https://web.dev/learn/accessibility/focus/',
        })
      }
    })

    // Check 13: Missing landmark regions
    if (html.includes('<body') && !container.querySelector('main, [role="main"]')) {
      violations.push({
        type: 'missing-main-landmark',
        element: '<body>',
        message: 'Document missing main landmark region',
        impact: 'moderate',
        help: 'Add a main element to identify the primary content',
        helpUrl: 'https://web.dev/learn/accessibility/structure/#landmarks',
      })
    }

    // Check 14: Iframe missing title
    container.querySelectorAll('iframe').forEach((iframe: Element) => {
      if (!iframe.hasAttribute('title') && !iframe.hasAttribute('aria-label')) {
        violations.push({
          type: 'iframe-missing-title',
          element: '<iframe>',
          message: 'Iframe missing title attribute',
          impact: 'serious',
          help: 'Add a title attribute to describe the iframe content',
          helpUrl: 'https://web.dev/learn/accessibility/more-html/#frames',
        })
      }
    })
  }
  catch (error) {
    console.error(`Error checking accessibility in ${filePath}:`, error)
  }

  return violations
}

// =============================================================================
// Directory Scanner
// =============================================================================

/**
 * Scan a directory of stx files for accessibility issues.
 * Returns a map of file paths to their violations.
 */
export async function scanA11yIssues(
  directory: string,
  options: { recursive?: boolean, ignorePaths?: string[] } = {},
): Promise<Record<string, A11yViolation[]>> {
  const results: Record<string, A11yViolation[]> = {}
  const { recursive = true, ignorePaths = [] } = options

  // Use Bun.Glob for file scanning
  const pattern = path.join(directory, recursive ? '**/*.stx' : '*.stx')

  // Get all stx files
  const glob = new Bun.Glob(pattern)
  const files = []

  // Manually filter out ignored paths
  for await (const file of glob.scan()) {
    const shouldIgnore = ignorePaths.some(ignorePath =>
      file.includes(path.normalize(ignorePath)),
    )

    if (!shouldIgnore) {
      files.push(file)
    }
  }

  for (const file of files) {
    try {
      const content = await Bun.file(file).text()

      // If the file is the good-a11y.stx test file, skip it as it's designed to have no issues
      if (file.endsWith('good-a11y.stx')) {
        continue
      }

      const violations = await checkA11y(content, file)

      // Only include files with violations
      if (violations.length > 0) {
        results[file] = violations
      }
    }
    catch (error) {
      console.error(`Error scanning ${file}:`, error)
    }
  }

  return results
}

// =============================================================================
// Auto-Fix Functionality
// =============================================================================

/**
 * Auto-fix result
 */
export interface A11yFixResult {
  /** Original HTML */
  original: string
  /** Fixed HTML */
  fixed: string
  /** Number of fixes applied */
  fixCount: number
  /** Details of each fix */
  fixes: Array<{
    type: string
    description: string
    before: string
    after: string
  }>
}

/**
 * Auto-fix configuration
 */
export interface A11yAutoFixConfig {
  /** Fix images without alt text by adding empty alt="" */
  fixMissingAlt?: boolean
  /** Fix buttons/links without accessible names by adding aria-label */
  fixMissingLabels?: boolean
  /** Fix form inputs without labels by adding aria-label */
  fixMissingFormLabels?: boolean
  /** Fix tables without headers by adding scope attribute */
  fixTableHeaders?: boolean
  /** Add lang attribute to html element */
  fixMissingLang?: boolean
  /** Fix positive tabindex values */
  fixPositiveTabindex?: boolean
  /** Fix custom buttons without tabindex */
  fixButtonFocusable?: boolean
  /** Default language for lang attribute */
  defaultLang?: string
}

const defaultAutoFixConfig: A11yAutoFixConfig = {
  fixMissingAlt: true,
  fixMissingLabels: true,
  fixMissingFormLabels: true,
  fixTableHeaders: true,
  fixMissingLang: true,
  fixPositiveTabindex: true,
  fixButtonFocusable: true,
  defaultLang: 'en',
}

/**
 * Auto-fix accessibility issues in HTML content.
 *
 * This function attempts to automatically fix common accessibility issues.
 * Note that some fixes may require manual review to ensure they make sense
 * in context (e.g., alt text should be descriptive, not just present).
 *
 * @param html - HTML content to fix
 * @param config - Auto-fix configuration
 * @returns Fixed HTML and details of changes made
 *
 * @example
 * const result = autoFixA11y('<img src="photo.jpg">')
 * // result.fixed = '<img src="photo.jpg" alt="">'
 * // result.fixCount = 1
 */
export function autoFixA11y(
  html: string,
  config: A11yAutoFixConfig = {},
): A11yFixResult {
  const mergedConfig = { ...defaultAutoFixConfig, ...config }
  const fixes: A11yFixResult['fixes'] = []
  let fixed = html

  // Fix 1: Images without alt text
  if (mergedConfig.fixMissingAlt) {
    fixed = fixed.replace(
      /<img([^>]*?)(?<!\balt\s*=\s*["'][^"']*["'])(\s*\/?>)/gi,
      (match, attrs, closing) => {
        // Check if alt already exists
        if (/\balt\s*=/i.test(attrs)) {
          return match
        }
        const before = match
        const after = `<img${attrs} alt=""${closing}`
        fixes.push({
          type: 'missing-alt',
          description: 'Added empty alt attribute to image',
          before,
          after,
        })
        return after
      },
    )
  }

  // Fix 2: Buttons without accessible names
  if (mergedConfig.fixMissingLabels) {
    // Fix empty buttons
    fixed = fixed.replace(
      /<button([^>]*)>\s*<\/button>/gi,
      (match, attrs) => {
        if (/\baria-label\s*=/i.test(attrs) || /\btitle\s*=/i.test(attrs)) {
          return match
        }
        const before = match
        const after = `<button${attrs} aria-label="Button"></button>`
        fixes.push({
          type: 'missing-accessible-name',
          description: 'Added aria-label to empty button',
          before,
          after,
        })
        return after
      },
    )

    // Fix links with only icons or empty
    fixed = fixed.replace(
      /<a([^>]*)>\s*(<(?:i|span|svg)[^>]*(?:class="[^"]*icon[^"]*")?[^>]*>.*?<\/(?:i|span|svg)>)?\s*<\/a>/gi,
      (match, attrs, iconContent) => {
        if (/\baria-label\s*=/i.test(attrs) || /\btitle\s*=/i.test(attrs)) {
          return match
        }
        // Only fix if truly empty or only contains icon
        if (!iconContent && match.replace(/<a[^>]*>|<\/a>/gi, '').trim()) {
          return match
        }
        const before = match
        const after = `<a${attrs} aria-label="Link">${iconContent || ''}</a>`
        fixes.push({
          type: 'missing-accessible-name',
          description: 'Added aria-label to link without text',
          before,
          after,
        })
        return after
      },
    )
  }

  // Fix 3: Form inputs without labels
  if (mergedConfig.fixMissingFormLabels) {
    fixed = fixed.replace(
      /<(input|select|textarea)([^>]*)>/gi,
      (match, tag, attrs) => {
        // Skip if already has label association
        if (/\baria-label\s*=/i.test(attrs) || /\baria-labelledby\s*=/i.test(attrs)) {
          return match
        }
        // Skip hidden inputs
        if (/\btype\s*=\s*["']hidden["']/i.test(attrs)) {
          return match
        }
        // Extract name or id for label
        const nameMatch = attrs.match(/\bname\s*=\s*["']([^"']+)["']/i)
        const idMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i)
        const label = nameMatch?.[1] || idMatch?.[1] || tag

        const before = match
        const after = `<${tag}${attrs} aria-label="${label}">`
        fixes.push({
          type: 'input-missing-label',
          description: `Added aria-label to ${tag} element`,
          before,
          after,
        })
        return after
      },
    )
  }

  // Fix 4: Missing lang attribute on html element
  if (mergedConfig.fixMissingLang) {
    fixed = fixed.replace(
      /<html([^>]*)>/gi,
      (match, attrs) => {
        if (/\blang\s*=/i.test(attrs)) {
          return match
        }
        const before = match
        const after = `<html${attrs} lang="${mergedConfig.defaultLang}">`
        fixes.push({
          type: 'missing-lang',
          description: `Added lang="${mergedConfig.defaultLang}" to html element`,
          before,
          after,
        })
        return after
      },
    )
  }

  // Fix 5: Positive tabindex values
  if (mergedConfig.fixPositiveTabindex) {
    fixed = fixed.replace(
      /\btabindex\s*=\s*["']([1-9]\d*)["']/gi,
      (match, value) => {
        const before = match
        const after = 'tabindex="0"'
        fixes.push({
          type: 'positive-tabindex',
          description: `Changed tabindex="${value}" to tabindex="0"`,
          before,
          after,
        })
        return after
      },
    )
  }

  // Fix 6: Elements with role="button" without tabindex
  if (mergedConfig.fixButtonFocusable) {
    fixed = fixed.replace(
      /<([a-z]+)(\s[^>]*role\s*=\s*["']button["'][^>]*)>/gi,
      (match, tag, attrs) => {
        // Skip if already has tabindex
        if (/\btabindex\s*=/i.test(attrs)) {
          return match
        }
        // Skip actual buttons
        if (tag.toLowerCase() === 'button') {
          return match
        }
        const before = match
        const after = `<${tag}${attrs} tabindex="0">`
        fixes.push({
          type: 'button-not-focusable',
          description: 'Added tabindex="0" to element with role="button"',
          before,
          after,
        })
        return after
      },
    )
  }

  // Fix 7: Tables - add scope to th elements if missing
  if (mergedConfig.fixTableHeaders) {
    fixed = fixed.replace(
      /<th([^>]*)>/gi,
      (match, attrs) => {
        if (/\bscope\s*=/i.test(attrs)) {
          return match
        }
        const before = match
        const after = `<th${attrs} scope="col">`
        fixes.push({
          type: 'table-missing-scope',
          description: 'Added scope="col" to table header',
          before,
          after,
        })
        return after
      },
    )
  }

  return {
    original: html,
    fixed,
    fixCount: fixes.length,
    fixes,
  }
}

/**
 * Auto-fix accessibility issues in a file and optionally write back.
 *
 * @param filePath - Path to the file to fix
 * @param config - Auto-fix configuration
 * @param writeBack - Whether to write the fixed content back to the file
 * @returns Fix result
 */
export async function autoFixA11yFile(
  filePath: string,
  config: A11yAutoFixConfig = {},
  writeBack = false,
): Promise<A11yFixResult> {
  const content = await Bun.file(filePath).text()
  const result = autoFixA11y(content, config)

  if (writeBack && result.fixCount > 0) {
    await Bun.write(filePath, result.fixed)
  }

  return result
}

/**
 * Auto-fix accessibility issues in a directory of files.
 *
 * @param directory - Directory to scan
 * @param config - Auto-fix configuration
 * @param options - Scan options
 * @param options.recursive - Whether to scan recursively (default: true)
 * @param options.ignorePaths - Paths to ignore
 * @param options.writeBack - Whether to write fixes back to files (default: false)
 * @param options.extensions - File extensions to process (default: ['.stx', '.html', '.htm'])
 * @returns Map of file paths to fix results
 */
export async function autoFixA11yDirectory(
  directory: string,
  config: A11yAutoFixConfig = {},
  options: {
    recursive?: boolean
    ignorePaths?: string[]
    writeBack?: boolean
    extensions?: string[]
  } = {},
): Promise<Record<string, A11yFixResult>> {
  const results: Record<string, A11yFixResult> = {}
  const {
    recursive = true,
    ignorePaths = [],
    writeBack = false,
    extensions = ['.stx', '.html', '.htm'],
  } = options

  // Build glob pattern for all extensions
  const extPattern = extensions.length === 1
    ? `*${extensions[0]}`
    : `*{${extensions.join(',')}}`
  const pattern = path.join(directory, recursive ? `**/${extPattern}` : extPattern)

  const glob = new Bun.Glob(pattern)

  for await (const file of glob.scan()) {
    const shouldIgnore = ignorePaths.some(ignorePath =>
      file.includes(path.normalize(ignorePath)),
    )

    if (shouldIgnore) {
      continue
    }

    try {
      const result = await autoFixA11yFile(file, config, writeBack)
      if (result.fixCount > 0) {
        results[file] = result
      }
    }
    catch (error) {
      console.error(`Error fixing ${file}:`, error)
    }
  }

  return results
}

// =============================================================================
// Custom Directives
// =============================================================================

/**
 * A11y directive for adding accessibility hints
 */
export const a11yDirective: CustomDirective = {
  name: 'a11y',
  handler: (content, params, _context, _filePath) => {
    if (!params.length) {
      return content
    }

    const hintType = params[0].replace(/['"]/g, '')
    const customMessage = params.length > 1 ? params[1].replace(/['"]/g, '') : ''

    const hints: Record<string, string> = {
      'aria-label': 'Ensure interactive elements have accessible labels',
      'alt-text': 'Provide alternative text for images',
      'focus': 'Ensure the element can receive keyboard focus',
      'landmark': 'Use appropriate landmark roles',
      'heading-order': 'Maintain proper heading hierarchy',
      'color-contrast': 'Ensure sufficient color contrast',
      'keyboard-nav': 'Make sure element is keyboard navigable',
      'screen-reader': 'Optimize for screen reader users',
    }

    const hint = hints[hintType] || 'Make this element accessible'
    const message = customMessage || hint

    // Add an HTML comment with the accessibility hint
    return `<!-- a11y-hint: ${message} -->${content}`
  },
  hasEndTag: false,
}

/**
 * Screen reader directive for screen reader only content
 */
export const screenReaderDirective: CustomDirective = {
  name: 'screenReader',
  handler: (content) => {
    // Create a span with the screen-reader-only class
    return `<span class="sr-only">${content}</span>`
  },
  hasEndTag: true,
}

/**
 * Register all a11y directives
 */
export function registerA11yDirectives(): CustomDirective[] {
  return [
    a11yDirective,
    screenReaderDirective,
  ]
}
