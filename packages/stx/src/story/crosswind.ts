/**
 * STX Story - Crosswind CSS Integration
 * Auto-inject Crosswind CSS for utility classes
 */

import type { StoryContext } from './types'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Crosswind CSS options
 */
export interface CrosswindOptions {
  /** Path to Crosswind CSS file */
  cssPath?: string
  /** Include reset styles */
  includeReset?: boolean
  /** Include base styles */
  includeBase?: boolean
}

/**
 * Default Crosswind CSS path
 */
const DEFAULT_HEADWIND_PATH = 'node_modules/@stacksjs/crosswind/dist/crosswind.css'

/**
 * Check if Crosswind is available
 */
export async function isCrosswindAvailable(root: string): Promise<boolean> {
  const crosswindPath = path.join(root, DEFAULT_HEADWIND_PATH)
  try {
    await fs.promises.access(crosswindPath)
    return true
  }
  catch {
    return false
  }
}

/**
 * Load Crosswind CSS
 */
export async function loadCrosswindCSS(
  ctx: StoryContext,
  options: CrosswindOptions = {},
): Promise<string> {
  const cssPath = options.cssPath || path.join(ctx.root, DEFAULT_HEADWIND_PATH)

  try {
    const css = await fs.promises.readFile(cssPath, 'utf-8')
    return css
  }
  catch {
    // Crosswind not available, return minimal utility CSS
    return getMinimalUtilityCSS()
  }
}

/**
 * Get minimal utility CSS as fallback
 */
function getMinimalUtilityCSS(): string {
  return `
/* Minimal utility classes (Crosswind fallback) */

/* Display */
.block { display: block; }
.inline-block { display: inline-block; }
.inline { display: inline; }
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }

/* Flexbox */
.flex-row { flex-direction: row; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }
.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }

/* Spacing */
.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.m-0 { margin: 0; }
.m-1 { margin: 0.25rem; }
.m-2 { margin: 0.5rem; }
.m-3 { margin: 0.75rem; }
.m-4 { margin: 1rem; }
.mx-auto { margin-left: auto; margin-right: auto; }

/* Typography */
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.text-2xl { font-size: 1.5rem; }
.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

/* Colors */
.text-white { color: #ffffff; }
.text-black { color: #000000; }
.text-gray-500 { color: #6b7280; }
.text-gray-700 { color: #374151; }
.bg-white { background-color: #ffffff; }
.bg-black { background-color: #000000; }
.bg-gray-100 { background-color: #f3f4f6; }
.bg-gray-200 { background-color: #e5e7eb; }
.bg-blue-500 { background-color: #3b82f6; }
.bg-green-500 { background-color: #22c55e; }
.bg-red-500 { background-color: #ef4444; }

/* Borders */
.border { border-width: 1px; }
.border-0 { border-width: 0; }
.border-2 { border-width: 2px; }
.border-gray-200 { border-color: #e5e7eb; }
.border-gray-300 { border-color: #d1d5db; }
.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-full { border-radius: 9999px; }

/* Sizing */
.w-full { width: 100%; }
.h-full { height: 100%; }
.w-auto { width: auto; }
.h-auto { height: auto; }
.min-w-0 { min-width: 0; }
.max-w-full { max-width: 100%; }

/* Position */
.relative { position: relative; }
.absolute { position: absolute; }
.fixed { position: fixed; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }

/* Overflow */
.overflow-auto { overflow: auto; }
.overflow-hidden { overflow: hidden; }
.overflow-scroll { overflow: scroll; }

/* Cursor */
.cursor-pointer { cursor: pointer; }
.cursor-default { cursor: default; }

/* Opacity */
.opacity-0 { opacity: 0; }
.opacity-50 { opacity: 0.5; }
.opacity-100 { opacity: 1; }

/* Transitions */
.transition { transition-property: all; transition-duration: 150ms; }
.duration-150 { transition-duration: 150ms; }
.duration-300 { transition-duration: 300ms; }
`
}

/**
 * Generate style tag with Crosswind CSS
 */
export async function generateCrosswindStyleTag(
  ctx: StoryContext,
  options: CrosswindOptions = {},
): Promise<string> {
  const css = await loadCrosswindCSS(ctx, options)
  return `<style id="crosswind-css">\n${css}\n</style>`
}

/**
 * Extract used utility classes from HTML
 */
export function extractUsedClasses(html: string): string[] {
  const classRegex = /class=["']([^"']+)["']/g
  const classes = new Set<string>()

  let match = classRegex.exec(html)
  while (match !== null) {
    const classList = match[1].split(/\s+/)
    for (const cls of classList) {
      if (cls.trim()) {
        classes.add(cls.trim())
      }
    }
    match = classRegex.exec(html)
  }

  return Array.from(classes)
}

/**
 * Generate optimized CSS with only used classes
 */
export function generateOptimizedCSS(
  fullCSS: string,
  usedClasses: string[],
): string {
  // Simple optimization: filter CSS rules to only include used classes
  // This is a basic implementation - a full implementation would parse the CSS properly
  const lines = fullCSS.split('\n')
  const result: string[] = []
  let inRule = false
  let currentRule = ''
  let includeRule = false

  for (const line of lines) {
    if (line.includes('{')) {
      inRule = true
      currentRule = line

      // Check if any used class is in this selector
      for (const cls of usedClasses) {
        if (line.includes(`.${cls}`) || line.includes(`.${cls} `) || line.includes(`.${cls},`) || line.includes(`.${cls}:`)) {
          includeRule = true
          break
        }
      }
    }
    else if (line.includes('}')) {
      if (includeRule) {
        result.push(currentRule)
        result.push(line)
      }
      inRule = false
      currentRule = ''
      includeRule = false
    }
    else if (inRule) {
      currentRule += `\n${line}`
    }
    else {
      // Comments, @rules, etc.
      result.push(line)
    }
  }

  return result.join('\n')
}
