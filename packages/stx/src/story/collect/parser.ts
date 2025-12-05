/**
 * STX Story - Story file parser
 * Parses .story.stx files to extract story and variant definitions
 */

import type { ServerStory, ServerVariant, StoryLayout } from '../types'
import fs from 'node:fs'

/**
 * Parse a story file and extract story definitions
 */
export async function parseStoryFile(filePath: string): Promise<ServerStory | null> {
  const content = await fs.promises.readFile(filePath, 'utf-8')
  return parseStoryContent(content, filePath)
}

/**
 * Parse story content and extract story definitions
 */
export function parseStoryContent(content: string, filePath: string): ServerStory | null {
  // Extract <Story> tag
  const storyMatch = content.match(/<Story\s+([^>]*)>([\s\S]*?)<\/Story>/i)
  if (!storyMatch) {
    return null
  }

  const storyAttrs = storyMatch[1]
  const storyContent = storyMatch[2]

  // Parse story attributes
  const title = extractAttribute(storyAttrs, 'title') || extractFileTitle(filePath)
  const id = generateId(title)
  const group = extractAttribute(storyAttrs, 'group')
  const icon = extractAttribute(storyAttrs, 'icon')
  const iconColor = extractAttribute(storyAttrs, 'icon-color') || extractAttribute(storyAttrs, 'iconColor')
  const docsOnly = extractAttribute(storyAttrs, 'docs-only') === 'true' || extractAttribute(storyAttrs, 'docsOnly') === 'true'
  const layout = parseLayout(storyAttrs)

  // Extract variants
  const variants = extractVariants(storyContent)

  return {
    id,
    title,
    group,
    variants,
    layout,
    icon,
    iconColor,
    docsOnly,
  }
}

/**
 * Extract variants from story content
 */
function extractVariants(content: string): ServerVariant[] {
  const variants: ServerVariant[] = []
  const variantRegex = /<Variant\s+([^>]*)>([\s\S]*?)<\/Variant>/gi

  let match = variantRegex.exec(content)
  while (match !== null) {
    const attrs = match[1]
    const variantContent = match[2]

    const title = extractAttribute(attrs, 'title') || 'Default'
    const id = generateId(title)
    const icon = extractAttribute(attrs, 'icon')
    const iconColor = extractAttribute(attrs, 'icon-color') || extractAttribute(attrs, 'iconColor')
    const responsiveDisabled = extractAttribute(attrs, 'responsive-disabled') === 'true'

    // Extract initial state from :init-state attribute
    const initStateAttr = extractAttribute(attrs, ':init-state') || extractAttribute(attrs, 'init-state')
    const state = initStateAttr ? parseInitState(content, initStateAttr) : {}

    // Extract source code (the variant content without template wrappers)
    const source = extractVariantSource(variantContent)

    variants.push({
      id,
      title,
      icon,
      iconColor,
      state,
      source,
      responsiveDisabled,
    })

    match = variantRegex.exec(content)
  }

  // If no variants found, create a default one
  if (variants.length === 0) {
    variants.push({
      id: 'default',
      title: 'Default',
      state: {},
    })
  }

  return variants
}

/**
 * Extract an attribute value from an attributes string
 */
function extractAttribute(attrs: string, name: string): string | undefined {
  // Match both :attr="value" and attr="value" formats
  const patterns = [
    new RegExp(`:${name}\\s*=\\s*["']([^"']+)["']`, 'i'),
    new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i'),
    new RegExp(`:${name}\\s*=\\s*"([^"]+)"`, 'i'),
    new RegExp(`${name}\\s*=\\s*"([^"]+)"`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = attrs.match(pattern)
    if (match) {
      return match[1]
    }
  }

  return undefined
}

/**
 * Parse layout attribute
 */
function parseLayout(attrs: string): StoryLayout | undefined {
  const layoutAttr = extractAttribute(attrs, ':layout') || extractAttribute(attrs, 'layout')
  if (!layoutAttr) {
    return undefined
  }

  // Try to parse as JSON-like object
  try {
    // Handle simple cases like "{ type: 'grid', width: 200 }"
    const normalized = layoutAttr
      .replace(/'/g, '"')
      .replace(/(\w+):/g, '"$1":')

    const parsed = JSON.parse(normalized)
    return parsed as StoryLayout
  }
  catch {
    // Default to single layout
    return { type: 'single' }
  }
}

/**
 * Parse init state function from script content
 */
function parseInitState(fullContent: string, funcName: string): Record<string, any> {
  // Find the function in script content
  const scriptMatch = fullContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  if (!scriptMatch) {
    return {}
  }

  const scriptContent = scriptMatch[1]

  // Find the function definition
  const funcRegex = new RegExp(`function\\s+${funcName}\\s*\\(\\)\\s*\\{([\\s\\S]*?)\\breturn\\s*\\{([\\s\\S]*?)\\}`, 'i')
  const funcMatch = scriptContent.match(funcRegex)

  if (!funcMatch) {
    // Try arrow function format
    const arrowRegex = new RegExp(`(?:const|let|var)\\s+${funcName}\\s*=\\s*\\(\\)\\s*=>\\s*\\(\\{([\\s\\S]*?)\\}\\)`, 'i')
    const arrowMatch = scriptContent.match(arrowRegex)

    if (arrowMatch) {
      return parseObjectLiteral(arrowMatch[1])
    }

    return {}
  }

  return parseObjectLiteral(funcMatch[2])
}

/**
 * Parse a simple object literal string into an object
 */
function parseObjectLiteral(objStr: string): Record<string, any> {
  const result: Record<string, any> = {}

  // Match key: value pairs
  const pairRegex = /(\w+)\s*:\s*([^,\n]+)/g
  let match = pairRegex.exec(objStr)

  while (match !== null) {
    const key = match[1]
    const valueStr = match[2].trim()

    // Parse the value
    result[key] = parseValue(valueStr)

    match = pairRegex.exec(objStr)
  }

  return result
}

/**
 * Parse a value string into its JavaScript type
 */
function parseValue(valueStr: string): any {
  const trimmed = valueStr.trim()

  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed === 'null') return null
  if (trimmed === 'undefined') return undefined

  // Number
  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return Number(trimmed)
  }

  // String (remove quotes)
  if (/^['"].*['"]$/.test(trimmed)) {
    return trimmed.slice(1, -1)
  }

  // Array or object - return as string for now
  return trimmed
}

/**
 * Extract variant source code
 */
function extractVariantSource(content: string): string {
  // Remove template wrappers
  let source = content

  // Remove <template #default="..."> wrapper
  source = source.replace(/<template\s+#default[^>]*>([\s\S]*?)<\/template>/gi, '$1')

  // Remove <template #controls="..."> section
  source = source.replace(/<template\s+#controls[^>]*>[\s\S]*?<\/template>/gi, '')

  // Trim and clean up
  source = source.trim()

  return source
}

/**
 * Extract title from file path
 */
function extractFileTitle(filePath: string): string {
  const fileName = filePath.split('/').pop() || filePath
  return fileName
    .replace(/\.story\.stx$/i, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

/**
 * Generate a URL-safe ID from a title
 */
function generateId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Extract script content from a story file
 */
export function extractScriptContent(content: string): string {
  const match = content.match(/<script[^>]*>([\s\S]*?)<\/script>/i)
  return match ? match[1] : ''
}

/**
 * Extract template content from a story file (everything outside script tags)
 */
export function extractTemplateContent(content: string): string {
  return content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').trim()
}
