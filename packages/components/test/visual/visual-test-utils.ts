/**
 * Visual regression testing utilities for STX components
 *
 * This module provides utilities for snapshot-based visual testing of components.
 * It captures component template structure and CSS class compositions for comparison.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/**
 * Snapshot directory location
 */
export const SNAPSHOTS_DIR = join(__dirname, '__snapshots__')

/**
 * Read an STX component file and extract its template
 */
export async function readComponentTemplate(componentPath: string): Promise<string> {
  const content = await Bun.file(componentPath).text()
  return content
}

/**
 * Extract CSS classes from a template (both HTML class attributes and JS strings)
 */
export function extractClasses(template: string): string[] {
  const classes: string[] = []

  // Extract from HTML class attributes
  const htmlClassRegex = /class="([^"]+)"/g
  let match

  while ((match = htmlClassRegex.exec(template)) !== null) {
    classes.push(...match[1].split(/\s+/).filter(Boolean))
  }

  // Extract from JavaScript string literals (for dynamic class definitions)
  // Match patterns like: 'class-name' or "class-name" in JS code
  const jsStringRegex = /['"]([a-z0-9\-:]+(?:\s+[a-z0-9\-:]+)*)['"](?:\s*[,:\+]|\s*\})/gi
  while ((match = jsStringRegex.exec(template)) !== null) {
    const classString = match[1]
    // Filter to only include valid Tailwind-like class patterns
    const potentialClasses = classString.split(/\s+/).filter((c) => {
      return /^[a-z]+[a-z0-9\-]*(?::[a-z0-9\-]+)*$/i.test(c)
        || /^dark:[a-z0-9\-]+$/i.test(c)
        || /^(sm|md|lg|xl|2xl):[a-z0-9\-]+$/i.test(c)
    })
    classes.push(...potentialClasses)
  }

  // Also extract complete class strings like 'bg-blue-500 hover:bg-blue-600 ...'
  const classStringRegex = /['"`]([^'"`]*(?:bg-|text-|border-|p-|m-|flex|grid|h-|w-|dark:)[^'"`]*)['"`]/g
  while ((match = classStringRegex.exec(template)) !== null) {
    const classString = match[1]
    // Split and filter valid classes
    const potentialClasses = classString.split(/\s+/).filter((c) => {
      return /^[a-z\-]+[a-z0-9\-]*(?::[a-z0-9\-]+)*$/i.test(c)
    })
    classes.push(...potentialClasses)
  }

  return [...new Set(classes)].sort()
}

/**
 * Extract the script block from an STX template
 */
export function extractScriptBlock(template: string): string | null {
  const scriptMatch = template.match(/<script>([\s\S]*?)<\/script>/)
  return scriptMatch ? scriptMatch[1].trim() : null
}

/**
 * Extract the template HTML (everything outside script blocks)
 */
export function extractTemplateHtml(template: string): string {
  return template
    .replace(/<script>[\s\S]*?<\/script>/g, '')
    .trim()
}

/**
 * Normalize HTML for consistent comparison
 */
export function normalizeHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Format HTML for readable snapshots
 */
export function formatHtml(html: string): string {
  let indent = 0
  const result: string[] = []
  const tokens = html.split(/(<[^>]+>)/g).filter(Boolean)

  for (const token of tokens) {
    if (token.startsWith('</')) {
      indent = Math.max(0, indent - 2)
      result.push('  '.repeat(indent / 2) + token)
    }
    else if (token.startsWith('<') && !token.endsWith('/>') && !token.includes('</')) {
      result.push('  '.repeat(indent / 2) + token)
      const voidElements = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']
      const tagName = token.match(/<(\w+)/)?.[1]?.toLowerCase()
      if (tagName && !voidElements.includes(tagName)) {
        indent += 2
      }
    }
    else if (token.startsWith('<')) {
      result.push('  '.repeat(indent / 2) + token)
    }
    else if (token.trim()) {
      result.push('  '.repeat(indent / 2) + token.trim())
    }
  }

  return result.join('\n')
}

/**
 * Get snapshot file path for a given test name
 */
export function getSnapshotPath(testName: string): string {
  const safeName = testName.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  return join(SNAPSHOTS_DIR, `${safeName}.snap.txt`)
}

/**
 * Read existing snapshot or return null if not found
 */
export function readSnapshot(testName: string): string | null {
  const snapshotPath = getSnapshotPath(testName)
  if (existsSync(snapshotPath)) {
    return readFileSync(snapshotPath, 'utf-8')
  }
  return null
}

/**
 * Write snapshot to file
 */
export function writeSnapshot(testName: string, content: string): void {
  const snapshotPath = getSnapshotPath(testName)
  const dir = dirname(snapshotPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  writeFileSync(snapshotPath, content, 'utf-8')
}

/**
 * Compare content against snapshot
 */
export function matchSnapshot(testName: string, content: string): { matches: boolean, expected?: string, actual: string } {
  const existing = readSnapshot(testName)

  if (existing === null) {
    writeSnapshot(testName, content)
    return { matches: true, actual: content }
  }

  const matches = existing.trim() === content.trim()
  return {
    matches,
    expected: existing,
    actual: content,
  }
}

/**
 * Visual test assertion helper
 */
export function expectSnapshotMatch(result: { matches: boolean, expected?: string, actual: string }): void {
  if (!result.matches) {
    const diff = result.expected
      ? `\nExpected:\n${result.expected}\n\nActual:\n${result.actual}`
      : ''
    throw new Error(`Snapshot does not match${diff}`)
  }
}

/**
 * Component variant configuration
 */
export interface VariantConfig {
  name: string
  props: Record<string, unknown>
  slotContent?: string
}

/**
 * Theme mode for testing
 */
export type ThemeMode = 'light' | 'dark'

/**
 * Responsive breakpoint sizes
 */
export type BreakpointSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

/**
 * Breakpoint width mapping (in pixels)
 */
export const BREAKPOINT_WIDTHS: Record<BreakpointSize, number> = {
  'xs': 320,
  'sm': 640,
  'md': 768,
  'lg': 1024,
  'xl': 1280,
  '2xl': 1536,
}

/**
 * Generate a class snapshot for a component with given props
 * Simulates what classes would be applied based on prop values
 */
export function generateClassSnapshot(
  componentName: string,
  variantClasses: Record<string, string>,
  sizeClasses: Record<string, string>,
  baseClasses: string,
  props: {
    variant?: string
    size?: string
    disabled?: boolean
    className?: string
  } = {},
): string {
  const { variant = 'primary', size = 'md', disabled = false, className = '' } = props

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.primary || '',
    sizeClasses[size] || sizeClasses.md || '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    className,
  ].filter(Boolean).join(' ')

  return `Component: ${componentName}
Variant: ${variant}
Size: ${size}
Disabled: ${disabled}
Classes: ${classes.split(/\s+/).filter(Boolean).sort().join(' ')}`
}

/**
 * Create a component template snapshot
 */
export async function createTemplateSnapshot(
  componentPath: string,
  componentName: string,
): Promise<string> {
  const template = await readComponentTemplate(componentPath)
  const scriptBlock = extractScriptBlock(template)
  const templateHtml = extractTemplateHtml(template)
  const classes = extractClasses(template)

  return `=== Component: ${componentName} ===

=== Script Block ===
${scriptBlock || '(none)'}

=== Template ===
${formatHtml(templateHtml)}

=== Extracted Classes ===
${classes.join('\n')}
`
}

/**
 * Test a component's template structure hasn't changed
 */
export async function testComponentTemplate(
  componentPath: string,
  componentName: string,
): Promise<{ matches: boolean, expected?: string, actual: string }> {
  const snapshot = await createTemplateSnapshot(componentPath, componentName)
  return matchSnapshot(`${componentName}-template`, snapshot)
}

/**
 * Test that dark mode classes are present
 */
export async function testDarkModeSupport(
  componentPath: string,
  componentName: string,
): Promise<{ hasDarkModeClasses: boolean, darkClasses: string[] }> {
  const template = await readComponentTemplate(componentPath)
  const classes = extractClasses(template)
  const darkClasses = classes.filter(c => c.startsWith('dark:'))

  return {
    hasDarkModeClasses: darkClasses.length > 0,
    darkClasses,
  }
}

/**
 * Test that responsive classes are present
 */
export async function testResponsiveSupport(
  componentPath: string,
  componentName: string,
): Promise<{ hasResponsiveClasses: boolean, responsiveClasses: string[] }> {
  const template = await readComponentTemplate(componentPath)
  const classes = extractClasses(template)
  const breakpointPrefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:']
  const responsiveClasses = classes.filter(c =>
    breakpointPrefixes.some(prefix => c.startsWith(prefix)),
  )

  return {
    hasResponsiveClasses: responsiveClasses.length > 0,
    responsiveClasses,
  }
}

/**
 * Generate test for all component variants
 */
export async function testComponentVariants(
  componentPath: string,
  componentName: string,
  variants: VariantConfig[],
): Promise<{ name: string, matches: boolean }[]> {
  const results: { name: string, matches: boolean }[] = []

  for (const variant of variants) {
    const testName = `${componentName}-${variant.name}`
    const propsSnapshot = JSON.stringify(variant.props, null, 2)
    const snapshot = `Variant: ${variant.name}\nProps: ${propsSnapshot}\nSlot: ${variant.slotContent || '(none)'}`
    const result = matchSnapshot(testName, snapshot)
    results.push({ name: testName, matches: result.matches })
  }

  return results
}
