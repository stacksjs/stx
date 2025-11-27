/**
 * Accessibility testing utilities for STX components
 *
 * Provides comprehensive WCAG 2.1 compliance testing utilities
 * for auditing components' accessibility.
 */

import { join } from 'node:path'

/**
 * WCAG 2.1 Level AA conformance requirements
 */
export interface WcagRequirements {
  // Perceivable
  hasTextAlternatives: boolean // 1.1.1
  hasTimedMediaAlternatives?: boolean // 1.2
  adaptable: boolean // 1.3
  distinguishable: boolean // 1.4

  // Operable
  keyboardAccessible: boolean // 2.1
  enoughTime?: boolean // 2.2
  noSeizures?: boolean // 2.3
  navigable: boolean // 2.4
  inputModalities?: boolean // 2.5

  // Understandable
  readable?: boolean // 3.1
  predictable: boolean // 3.2
  inputAssistance: boolean // 3.3

  // Robust
  compatible: boolean // 4.1
}

/**
 * Accessibility issue severity levels
 */
export type IssueSeverity = 'error' | 'warning' | 'info'

/**
 * Accessibility audit issue
 */
export interface A11yIssue {
  severity: IssueSeverity
  wcagCriteria: string
  message: string
  element?: string
  suggestion?: string
}

/**
 * Accessibility audit result
 */
export interface A11yAuditResult {
  componentName: string
  passed: boolean
  issues: A11yIssue[]
  score: number // 0-100
  checkedCriteria: string[]
}

/**
 * Required ARIA attributes for specific roles
 */
const REQUIRED_ARIA_BY_ROLE: Record<string, string[]> = {
  'button': [],
  'checkbox': ['aria-checked'],
  'combobox': ['aria-expanded'],
  'dialog': ['aria-labelledby', 'aria-modal'],
  'listbox': [],
  'menu': [],
  'menuitem': [],
  'option': ['aria-selected'],
  'progressbar': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  'radio': ['aria-checked'],
  'radiogroup': [],
  'slider': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  'spinbutton': ['aria-valuenow', 'aria-valuemin', 'aria-valuemax'],
  'switch': ['aria-checked'],
  'tab': ['aria-selected', 'aria-controls'],
  'tablist': [],
  'tabpanel': ['aria-labelledby'],
  'textbox': [],
  'tooltip': [],
  'tree': [],
  'treeitem': [],
}

/**
 * Interactive elements that should be keyboard accessible
 */
const INTERACTIVE_ELEMENTS = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  '[tabindex]',
  '[role="button"]',
  '[role="link"]',
  '[role="checkbox"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="switch"]',
  '[role="tab"]',
]

/**
 * Read an STX component template
 */
async function readTemplate(componentPath: string): Promise<string> {
  return await Bun.file(componentPath).text()
}

/**
 * Extract ARIA attributes from template
 */
export function extractAriaAttributes(template: string): Record<string, string[]> {
  const ariaAttrs: Record<string, string[]> = {}
  const ariaRegex = /aria-([a-z]+)="([^"]*)"/gi
  let match

  while ((match = ariaRegex.exec(template)) !== null) {
    const attrName = `aria-${match[1]}`
    if (!ariaAttrs[attrName]) {
      ariaAttrs[attrName] = []
    }
    ariaAttrs[attrName].push(match[2])
  }

  return ariaAttrs
}

/**
 * Extract role attributes from template
 */
export function extractRoles(template: string): string[] {
  const roleRegex = /role="([^"]+)"/gi
  const roles: string[] = []
  let match

  while ((match = roleRegex.exec(template)) !== null) {
    roles.push(match[1])
  }

  return [...new Set(roles)]
}

/**
 * Check if template has required ARIA attributes for roles
 */
export function checkRequiredAriaForRoles(template: string): A11yIssue[] {
  const issues: A11yIssue[] = []
  const roles = extractRoles(template)
  const ariaAttrs = extractAriaAttributes(template)

  for (const role of roles) {
    const required = REQUIRED_ARIA_BY_ROLE[role]
    if (required) {
      for (const attr of required) {
        if (!ariaAttrs[attr]) {
          issues.push({
            severity: 'error',
            wcagCriteria: '4.1.2',
            message: `Role "${role}" requires ${attr} attribute`,
            element: `[role="${role}"]`,
            suggestion: `Add ${attr} attribute to element with role="${role}"`,
          })
        }
      }
    }
  }

  return issues
}

/**
 * Check for accessible labels on interactive elements
 */
export function checkAccessibleLabels(template: string): A11yIssue[] {
  const issues: A11yIssue[] = []

  // Check for buttons without accessible names
  const buttonRegex = /<button([^>]*)>([^<]*)<\/button>/gi
  let match

  while ((match = buttonRegex.exec(template)) !== null) {
    const attrs = match[1]
    const content = match[2].trim()

    const hasAriaLabel = /aria-label="[^"]+"/i.test(attrs)
    const hasAriaLabelledby = /aria-labelledby="[^"]+"/i.test(attrs)
    const hasTitle = /title="[^"]+"/i.test(attrs)
    const hasSlot = /<slot/i.test(template)

    if (!content && !hasAriaLabel && !hasAriaLabelledby && !hasTitle && !hasSlot) {
      issues.push({
        severity: 'warning',
        wcagCriteria: '1.1.1',
        message: 'Button may lack accessible name',
        element: '<button>',
        suggestion: 'Add aria-label, text content, or aria-labelledby',
      })
    }
  }

  // Check for inputs without labels
  const inputRegex = /<input([^>]*)>/gi
  while ((match = inputRegex.exec(template)) !== null) {
    const attrs = match[1]

    const hasAriaLabel = /aria-label="[^"]+"/i.test(attrs)
    const hasAriaLabelledby = /aria-labelledby="[^"]+"/i.test(attrs)
    const hasId = /id="([^"]+)"/i.exec(attrs)

    // If input has id, check for associated label
    if (hasId) {
      const labelRegex = new RegExp(`<label[^>]*for="${hasId[1]}"`, 'i')
      if (!labelRegex.test(template) && !hasAriaLabel && !hasAriaLabelledby) {
        issues.push({
          severity: 'warning',
          wcagCriteria: '1.3.1',
          message: 'Input may lack associated label',
          element: '<input>',
          suggestion: 'Add <label for="..."> or aria-label/aria-labelledby',
        })
      }
    }
  }

  return issues
}

/**
 * Check for keyboard accessibility indicators
 */
export function checkKeyboardAccessibility(template: string): A11yIssue[] {
  const issues: A11yIssue[] = []

  // Check for onClick without keyboard handlers on non-interactive elements
  const onClickRegex = /@click="[^"]+"/gi
  const matches = template.match(onClickRegex) || []

  // Check for proper focus indicators
  const hasFocusClasses = /focus:|focus-visible:|focus-within:/i.test(template)
  if (!hasFocusClasses && matches.length > 0) {
    issues.push({
      severity: 'warning',
      wcagCriteria: '2.4.7',
      message: 'Component may lack visible focus indicators',
      suggestion: 'Add focus: or focus-visible: utility classes for focus states',
    })
  }

  // Check for tabindex values
  const negativeTabindex = /tabindex="-[2-9]|tabindex="-1[0-9]/gi
  if (negativeTabindex.test(template)) {
    issues.push({
      severity: 'info',
      wcagCriteria: '2.1.1',
      message: 'Negative tabindex values (other than -1) detected',
      suggestion: 'Use tabindex="0" or tabindex="-1" only',
    })
  }

  return issues
}

/**
 * Check for color contrast requirements
 */
export function checkColorContrast(template: string): A11yIssue[] {
  const issues: A11yIssue[] = []

  // Check for text colors that might have contrast issues
  const lowContrastPatterns = [
    'text-neutral-400',
    'text-neutral-300',
    'text-gray-400',
    'text-gray-300',
  ]

  for (const pattern of lowContrastPatterns) {
    if (template.includes(pattern)) {
      issues.push({
        severity: 'warning',
        wcagCriteria: '1.4.3',
        message: `Potentially low contrast text color: ${pattern}`,
        suggestion: 'Verify color contrast meets WCAG AA requirements (4.5:1 for normal text)',
      })
    }
  }

  return issues
}

/**
 * Check for screen reader support
 */
export function checkScreenReaderSupport(template: string): A11yIssue[] {
  const issues: A11yIssue[] = []

  // Check for sr-only classes for icon-only buttons
  const hasSvgInButton = /<button[^>]*>[\s\S]*<svg[\s\S]*<\/button>/gi.test(template)
  const hasSrOnly = /sr-only|visually-hidden/i.test(template)

  if (hasSvgInButton && !hasSrOnly) {
    const hasAriaLabel = /aria-label="[^"]+"/i.test(template)
    if (!hasAriaLabel) {
      issues.push({
        severity: 'warning',
        wcagCriteria: '1.1.1',
        message: 'Icon-only button may need screen reader text',
        suggestion: 'Add sr-only span or aria-label for icon-only buttons',
      })
    }
  }

  // Check for aria-hidden on decorative elements
  const hasSvg = /<svg/i.test(template)
  const hasAriaHidden = /aria-hidden="true"/i.test(template)

  if (hasSvg && !hasAriaHidden) {
    issues.push({
      severity: 'info',
      wcagCriteria: '1.1.1',
      message: 'Decorative SVGs should have aria-hidden="true"',
      suggestion: 'Add aria-hidden="true" to decorative SVG elements',
    })
  }

  return issues
}

/**
 * Check for motion and animation accessibility
 */
export function checkMotionAccessibility(template: string): A11yIssue[] {
  const issues: A11yIssue[] = []

  const animationClasses = [
    'animate-',
    'transition-',
    'duration-',
  ]

  const hasAnimation = animationClasses.some(cls => template.includes(cls))
  const hasReducedMotion = /motion-reduce:|prefers-reduced-motion/i.test(template)

  if (hasAnimation && !hasReducedMotion) {
    issues.push({
      severity: 'info',
      wcagCriteria: '2.3.3',
      message: 'Component has animations but may not respect reduced motion preference',
      suggestion: 'Add motion-reduce: variants or check prefers-reduced-motion',
    })
  }

  return issues
}

/**
 * Run full accessibility audit on a component
 */
export async function auditComponent(
  componentPath: string,
  componentName: string,
): Promise<A11yAuditResult> {
  const template = await readTemplate(componentPath)
  const issues: A11yIssue[] = []
  const checkedCriteria: string[] = []

  // Run all checks
  issues.push(...checkRequiredAriaForRoles(template))
  checkedCriteria.push('4.1.2 Name, Role, Value')

  issues.push(...checkAccessibleLabels(template))
  checkedCriteria.push('1.1.1 Non-text Content', '1.3.1 Info and Relationships')

  issues.push(...checkKeyboardAccessibility(template))
  checkedCriteria.push('2.1.1 Keyboard', '2.4.7 Focus Visible')

  issues.push(...checkColorContrast(template))
  checkedCriteria.push('1.4.3 Contrast (Minimum)')

  issues.push(...checkScreenReaderSupport(template))
  checkedCriteria.push('1.1.1 Non-text Content')

  issues.push(...checkMotionAccessibility(template))
  checkedCriteria.push('2.3.3 Animation from Interactions')

  // Calculate score
  const errorCount = issues.filter(i => i.severity === 'error').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const infoCount = issues.filter(i => i.severity === 'info').length

  // Score: errors are -20, warnings are -5, info are -1
  const deductions = (errorCount * 20) + (warningCount * 5) + (infoCount * 1)
  const score = Math.max(0, 100 - deductions)

  return {
    componentName,
    passed: errorCount === 0,
    issues,
    score,
    checkedCriteria: [...new Set(checkedCriteria)],
  }
}

/**
 * Generate accessibility audit report
 */
export function generateAuditReport(results: A11yAuditResult[]): string {
  let report = '# Accessibility Audit Report\n\n'

  const totalScore = results.reduce((sum, r) => sum + r.score, 0) / results.length
  const passedCount = results.filter(r => r.passed).length

  report += `## Summary\n\n`
  report += `- **Components Tested:** ${results.length}\n`
  report += `- **Passed:** ${passedCount}/${results.length}\n`
  report += `- **Average Score:** ${totalScore.toFixed(1)}/100\n\n`

  report += `## Component Results\n\n`

  for (const result of results) {
    const status = result.passed ? '✅' : '❌'
    report += `### ${status} ${result.componentName} (Score: ${result.score}/100)\n\n`

    if (result.issues.length === 0) {
      report += `No issues found.\n\n`
    }
    else {
      for (const issue of result.issues) {
        const icon = issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : 'ℹ️'
        report += `${icon} **[${issue.wcagCriteria}]** ${issue.message}\n`
        if (issue.suggestion) {
          report += `   💡 ${issue.suggestion}\n`
        }
        report += '\n'
      }
    }
  }

  return report
}

/**
 * Quick check for basic accessibility requirements
 */
export async function quickA11yCheck(componentPath: string): Promise<{
  hasRoles: boolean
  hasAriaAttributes: boolean
  hasFocusStyles: boolean
  hasKeyboardHandlers: boolean
}> {
  const template = await readTemplate(componentPath)

  return {
    hasRoles: /role="[^"]+"/i.test(template),
    hasAriaAttributes: /aria-[a-z]+="[^"]+"/i.test(template),
    hasFocusStyles: /focus:|focus-visible:|focus-within:/i.test(template),
    hasKeyboardHandlers: /@keydown|@keyup|@keypress|onkeydown|onkeyup/i.test(template),
  }
}
