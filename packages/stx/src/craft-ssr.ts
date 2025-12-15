/**
 * Craft SSR (Server-Side Rendering) Module
 *
 * This module provides server-side rendering capabilities for stx templates
 * optimized for Craft native apps. It pre-compiles templates into optimized
 * component trees that can be efficiently rendered by Craft's native layer.
 *
 * Key features:
 * - Pre-compilation of stx templates to Craft component trees
 * - Static type checking at build time
 * - Template → native component code generation
 * - Hydration support for interactive components
 * - Streaming SSR for large templates
 */

import type { CraftComponentConfig } from './craft-components'

// ============================================================================
// Types
// ============================================================================

/**
 * Represents a node in the Craft component tree
 */
export interface CraftNode {
  type: 'element' | 'text' | 'component' | 'fragment' | 'slot'
  tag?: string
  props?: Record<string, unknown>
  children?: CraftNode[]
  text?: string
  componentName?: string
  slotName?: string
  isStatic?: boolean
  hydrationKey?: string
}

/**
 * Compiled template representation
 */
export interface CompiledTemplate {
  id: string
  hash: string
  tree: CraftNode
  scripts: string[]
  styles: string[]
  staticParts: Map<string, string>
  dynamicParts: Map<string, string>
  dependencies: string[]
  metadata: TemplateMetadata
}

/**
 * Template metadata for optimization
 */
export interface TemplateMetadata {
  hasSlots: boolean
  hasDynamicContent: boolean
  hasEventHandlers: boolean
  hasAsyncContent: boolean
  componentCount: number
  maxDepth: number
  estimatedSize: number
}

/**
 * SSR configuration options
 */
export interface SSRConfig {
  /** Enable streaming SSR */
  streaming?: boolean
  /** Pre-render static content */
  prerender?: boolean
  /** Generate hydration markers */
  hydrate?: boolean
  /** Minify output */
  minify?: boolean
  /** Enable caching */
  cache?: boolean
  /** Cache TTL in milliseconds */
  cacheTTL?: number
  /** Enable static analysis */
  staticAnalysis?: boolean
  /** Target platform for optimization */
  target?: 'web' | 'craft' | 'both'
}

/**
 * SSR result
 */
export interface SSRResult {
  html: string
  styles: string
  scripts: string
  hydrationData?: Record<string, unknown>
  metadata: SSRMetadata
}

/**
 * SSR metadata
 */
export interface SSRMetadata {
  renderTime: number
  cacheHit: boolean
  streamChunks?: number
  totalSize: number
  componentCount: number
}

/**
 * Optimization hints for Craft
 */
export interface CraftOptimization {
  /** Components that can be rendered natively */
  nativeComponents: string[]
  /** Static HTML that can be pre-rendered */
  staticHTML: string[]
  /** Dynamic parts requiring JS */
  dynamicParts: string[]
  /** Event handlers to attach */
  eventHandlers: Map<string, string>
  /** Suggested native widgets */
  nativeWidgets: NativeWidgetSuggestion[]
}

/**
 * Native widget suggestion
 */
export interface NativeWidgetSuggestion {
  htmlSelector: string
  nativeComponent: string
  confidence: number
  reason: string
}

// ============================================================================
// Template Cache
// ============================================================================

const templateCache = new Map<string, CompiledTemplate>()
const renderCache = new Map<string, { html: string; timestamp: number }>()

// ============================================================================
// Core SSR Functions
// ============================================================================

/**
 * Compile an stx template into a Craft-optimized component tree
 */
export function compileTemplate(
  template: string,
  options?: { id?: string },
): CompiledTemplate {
  const id = options?.id || generateTemplateId(template)
  const hash = generateHash(template)

  // Check cache
  const cached = templateCache.get(id)
  if (cached && cached.hash === hash) {
    return cached
  }

  // Parse template into AST
  const tree = parseTemplateToTree(template)

  // Extract scripts and styles
  const scripts = extractScripts(template)
  const styles = extractStyles(template)

  // Analyze template
  const metadata = analyzeTemplate(tree)

  // Identify static and dynamic parts
  const { staticParts, dynamicParts } = partitionContent(tree)

  // Extract dependencies
  const dependencies = extractDependencies(template)

  const compiled: CompiledTemplate = {
    id,
    hash,
    tree,
    scripts,
    styles,
    staticParts,
    dynamicParts,
    dependencies,
    metadata,
  }

  // Cache compiled template
  templateCache.set(id, compiled)

  return compiled
}

/**
 * Render a compiled template to HTML with SSR optimizations
 */
export async function renderSSR(
  compiled: CompiledTemplate,
  context: Record<string, unknown> = {},
  config: SSRConfig = {},
): Promise<SSRResult> {
  const startTime = performance.now()

  // Check render cache
  if (config.cache) {
    const cacheKey = `${compiled.id}:${JSON.stringify(context)}`
    const cached = renderCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < (config.cacheTTL || 60000)) {
      return {
        html: cached.html,
        styles: compiled.styles.join('\n'),
        scripts: compiled.scripts.join('\n'),
        metadata: {
          renderTime: 0,
          cacheHit: true,
          totalSize: cached.html.length,
          componentCount: compiled.metadata.componentCount,
        },
      }
    }
  }

  // Render tree to HTML
  let html: string
  if (config.streaming) {
    html = await renderTreeStreaming(compiled.tree, context)
  }
  else {
    html = renderTreeToHTML(compiled.tree, context)
  }

  // Add hydration markers if needed
  let hydrationData: Record<string, unknown> | undefined
  if (config.hydrate) {
    const result = addHydrationMarkers(html, compiled, context)
    html = result.html
    hydrationData = result.data
  }

  // Minify if requested
  if (config.minify) {
    html = minifyHTML(html)
  }

  // Cache result
  if (config.cache) {
    const cacheKey = `${compiled.id}:${JSON.stringify(context)}`
    renderCache.set(cacheKey, { html, timestamp: Date.now() })
  }

  const renderTime = performance.now() - startTime

  return {
    html,
    styles: compiled.styles.join('\n'),
    scripts: compiled.scripts.join('\n'),
    hydrationData,
    metadata: {
      renderTime,
      cacheHit: false,
      totalSize: html.length,
      componentCount: compiled.metadata.componentCount,
    },
  }
}

/**
 * Generate Craft optimization hints for a template
 */
export function generateCraftOptimizations(
  compiled: CompiledTemplate,
  _config?: CraftComponentConfig,
): CraftOptimization {
  const nativeComponents: string[] = []
  const staticHTML: string[] = []
  const dynamicParts: string[] = []
  const eventHandlers = new Map<string, string>()
  const nativeWidgets: NativeWidgetSuggestion[] = []

  // Walk the tree and categorize nodes
  walkTree(compiled.tree, (node, _path) => {
    if (node.type === 'component' && node.componentName) {
      if (isCraftComponent(node.componentName)) {
        nativeComponents.push(node.componentName)
      }
    }

    if (node.type === 'element' && node.tag) {
      // Suggest native widget replacements
      const suggestion = suggestNativeWidget(node)
      if (suggestion) {
        nativeWidgets.push(suggestion)
      }

      // Extract event handlers
      if (node.props) {
        for (const [key, value] of Object.entries(node.props)) {
          if (key.startsWith('on') && typeof value === 'string') {
            const handlerId = `handler_${eventHandlers.size}`
            eventHandlers.set(handlerId, value)
          }
        }
      }
    }

    if (node.isStatic && node.type === 'element') {
      staticHTML.push(renderNodeToHTML(node))
    }
    else if (!node.isStatic && node.type !== 'text') {
      dynamicParts.push(node.tag || node.componentName || 'unknown')
    }
  })

  return {
    nativeComponents,
    staticHTML,
    dynamicParts,
    eventHandlers,
    nativeWidgets,
  }
}

/**
 * Pre-render static parts of a template for Craft
 */
export function prerenderForCraft(
  template: string,
  context: Record<string, unknown> = {},
): {
    staticHTML: string
    dynamicPlaceholders: Map<string, string>
    craftComponents: string[]
  } {
  const compiled = compileTemplate(template)
  const staticHTML = renderStaticParts(compiled, context)
  const dynamicPlaceholders = new Map<string, string>()
  const craftComponents: string[] = []

  // Walk tree and extract Craft components
  walkTree(compiled.tree, (node) => {
    if (node.type === 'component' && node.componentName) {
      if (isCraftComponent(node.componentName)) {
        craftComponents.push(node.componentName)
        const placeholder = `<!--craft:${node.componentName}:${node.hydrationKey || 'default'}-->`
        dynamicPlaceholders.set(node.hydrationKey || node.componentName, placeholder)
      }
    }
  })

  return {
    staticHTML,
    dynamicPlaceholders,
    craftComponents,
  }
}

// ============================================================================
// Tree Parsing and Manipulation
// ============================================================================

/**
 * Parse template string into a CraftNode tree
 */
function parseTemplateToTree(template: string): CraftNode {
  const root: CraftNode = {
    type: 'fragment',
    children: [],
  }

  // Simple HTML parser
  let current = root
  const stack: CraftNode[] = [root]
  let remaining = template

  // Self-closing tags
  const selfClosing = new Set([
    'area',
    'base',
    'br',
    'col',
    'embed',
    'hr',
    'img',
    'input',
    'link',
    'meta',
    'param',
    'source',
    'track',
    'wbr',
  ])

  while (remaining.length > 0) {
    // Match opening tag
    const openMatch = remaining.match(/^<(@?[\w-]+)([^>]*)>/)
    if (openMatch) {
      const [full, tag, attrsStr] = openMatch
      const props = parseAttributes(attrsStr)
      const isCraft = tag.startsWith('@craft-')
      const normalizedTag = isCraft ? tag : tag.toLowerCase()

      const node: CraftNode = {
        type: isCraft ? 'component' : 'element',
        tag: normalizedTag,
        props,
        children: [],
        componentName: isCraft ? normalizedTag.slice(1) : undefined,
        isStatic: !hasExpression(attrsStr),
        hydrationKey: generateHydrationKey(),
      }

      current.children = current.children || []
      current.children.push(node)

      if (!selfClosing.has(normalizedTag) && !attrsStr.endsWith('/')) {
        stack.push(node)
        current = node
      }

      remaining = remaining.slice(full.length)
      continue
    }

    // Match closing tag
    const closeMatch = remaining.match(/^<\/(@?[\w-]+)>/)
    if (closeMatch) {
      const [full, tag] = closeMatch
      const isCraft = tag.startsWith('@craft-')
      const normalizedTag = isCraft ? tag : tag.toLowerCase()

      // Pop stack until we find matching tag
      while (stack.length > 1) {
        const popped = stack.pop()!
        current = stack[stack.length - 1]
        if (popped.tag === normalizedTag) {
          break
        }
      }

      remaining = remaining.slice(full.length)
      continue
    }

    // Match text content
    const textMatch = remaining.match(/^[^<]+/)
    if (textMatch) {
      const text = textMatch[0]
      if (text.trim()) {
        const textNode: CraftNode = {
          type: 'text',
          text,
          isStatic: !hasExpression(text),
        }
        current.children = current.children || []
        current.children.push(textNode)
      }
      remaining = remaining.slice(text.length)
      continue
    }

    // Skip unmatched character
    remaining = remaining.slice(1)
  }

  return root
}

/**
 * Parse HTML attributes string into props object
 */
function parseAttributes(attrsStr: string): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const attrRegex = /([\w-:@]+)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g

  let match
  while ((match = attrRegex.exec(attrsStr)) !== null) {
    const [, name, doubleQuoted, singleQuoted, unquoted] = match
    const value = doubleQuoted ?? singleQuoted ?? unquoted ?? true
    props[name] = value
  }

  return props
}

/**
 * Walk the tree and call callback for each node
 */
function walkTree(
  node: CraftNode,
  callback: (node: CraftNode, path: string[]) => void,
  path: string[] = [],
): void {
  callback(node, path)

  if (node.children) {
    node.children.forEach((child, index) => {
      walkTree(child, callback, [...path, `${index}`])
    })
  }
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render a CraftNode tree to HTML string
 */
function renderTreeToHTML(
  node: CraftNode,
  context: Record<string, unknown>,
): string {
  switch (node.type) {
    case 'text':
      return interpolateExpressions(node.text || '', context)

    case 'element':
    case 'component': {
      const tag = node.tag || 'div'
      const attrs = renderAttributes(node.props || {}, context)
      const children = (node.children || [])
        .map(child => renderTreeToHTML(child, context))
        .join('')

      // Self-closing check
      if (!node.children || node.children.length === 0) {
        const selfClosing = ['input', 'br', 'hr', 'img', 'meta', 'link']
        if (selfClosing.includes(tag)) {
          return `<${tag}${attrs} />`
        }
      }

      return `<${tag}${attrs}>${children}</${tag}>`
    }

    case 'fragment':
      return (node.children || [])
        .map(child => renderTreeToHTML(child, context))
        .join('')

    case 'slot':
      return `<!--slot:${node.slotName || 'default'}-->`

    default:
      return ''
  }
}

/**
 * Render a single node to HTML (without children recursion for static extraction)
 */
function renderNodeToHTML(node: CraftNode): string {
  if (node.type === 'text') {
    return node.text || ''
  }

  const tag = node.tag || 'div'
  const attrs = renderAttributes(node.props || {}, {})

  return `<${tag}${attrs}></${tag}>`
}

/**
 * Render attributes to string
 */
function renderAttributes(
  props: Record<string, unknown>,
  context: Record<string, unknown>,
): string {
  const attrs: string[] = []

  for (const [key, value] of Object.entries(props)) {
    if (value === true) {
      attrs.push(` ${key}`)
    }
    else if (value !== false && value !== null && value !== undefined) {
      const strValue = interpolateExpressions(String(value), context)
      attrs.push(` ${key}="${escapeHTML(strValue)}"`)
    }
  }

  return attrs.join('')
}

/**
 * Streaming render for large templates
 */
async function renderTreeStreaming(
  node: CraftNode,
  context: Record<string, unknown>,
): Promise<string> {
  // For now, use standard rendering
  // In production, this would yield chunks via async generators
  return renderTreeToHTML(node, context)
}

/**
 * Render only static parts of the template
 */
function renderStaticParts(
  compiled: CompiledTemplate,
  context: Record<string, unknown>,
): string {
  const parts: string[] = []

  walkTree(compiled.tree, (node) => {
    if (node.isStatic) {
      parts.push(renderTreeToHTML(node, context))
    }
  })

  return parts.join('')
}

// ============================================================================
// Hydration
// ============================================================================

/**
 * Add hydration markers to rendered HTML
 */
function addHydrationMarkers(
  html: string,
  compiled: CompiledTemplate,
  context: Record<string, unknown>,
): { html: string; data: Record<string, unknown> } {
  const data: Record<string, unknown> = {
    templateId: compiled.id,
    context,
    dynamicParts: Array.from(compiled.dynamicParts.entries()),
  }

  // Add hydration script
  const hydrationScript = `
<script data-craft-hydration>
  window.__CRAFT_HYDRATION__ = ${JSON.stringify(data)};
</script>`

  return {
    html: html + hydrationScript,
    data,
  }
}

// ============================================================================
// Analysis Functions
// ============================================================================

/**
 * Analyze template tree and generate metadata
 */
function analyzeTemplate(tree: CraftNode): TemplateMetadata {
  let hasSlots = false
  let hasDynamicContent = false
  let hasEventHandlers = false
  let hasAsyncContent = false
  let componentCount = 0
  let maxDepth = 0

  function analyze(node: CraftNode, depth: number): void {
    maxDepth = Math.max(maxDepth, depth)

    if (node.type === 'slot') {
      hasSlots = true
    }

    if (node.type === 'component') {
      componentCount++
    }

    if (!node.isStatic) {
      hasDynamicContent = true
    }

    if (node.props) {
      for (const key of Object.keys(node.props)) {
        if (key.startsWith('on')) {
          hasEventHandlers = true
        }
        if (key === '@async' || key === 'data-async') {
          hasAsyncContent = true
        }
      }
    }

    if (node.children) {
      node.children.forEach(child => analyze(child, depth + 1))
    }
  }

  analyze(tree, 0)

  return {
    hasSlots,
    hasDynamicContent,
    hasEventHandlers,
    hasAsyncContent,
    componentCount,
    maxDepth,
    estimatedSize: JSON.stringify(tree).length,
  }
}

/**
 * Partition content into static and dynamic parts
 */
function partitionContent(tree: CraftNode): {
  staticParts: Map<string, string>
  dynamicParts: Map<string, string>
} {
  const staticParts = new Map<string, string>()
  const dynamicParts = new Map<string, string>()

  walkTree(tree, (node, path) => {
    const key = path.join('.')
    if (node.isStatic) {
      staticParts.set(key, renderNodeToHTML(node))
    }
    else {
      dynamicParts.set(key, node.tag || node.componentName || 'dynamic')
    }
  })

  return { staticParts, dynamicParts }
}

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Extract script tags from template
 */
function extractScripts(template: string): string[] {
  const scripts: string[] = []
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi

  let match
  while ((match = scriptRegex.exec(template)) !== null) {
    scripts.push(match[1])
  }

  return scripts
}

/**
 * Extract style tags from template
 */
function extractStyles(template: string): string[] {
  const styles: string[] = []
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi

  let match
  while ((match = styleRegex.exec(template)) !== null) {
    styles.push(match[1])
  }

  return styles
}

/**
 * Extract template dependencies (includes, components)
 */
function extractDependencies(template: string): string[] {
  const deps: string[] = []

  // @include directives
  const includeRegex = /@include\s*\(\s*['"]([^'"]+)['"]/g
  let match
  while ((match = includeRegex.exec(template)) !== null) {
    deps.push(match[1])
  }

  // @component directives
  const componentRegex = /@component\s*\(\s*['"]([^'"]+)['"]/g
  while ((match = componentRegex.exec(template)) !== null) {
    deps.push(match[1])
  }

  // Craft component tags
  const craftRegex = /<@craft-[\w-]+/g
  while ((match = craftRegex.exec(template)) !== null) {
    deps.push(match[0].slice(2)) // Remove '<@'
  }

  return [...new Set(deps)]
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if string contains template expressions
 */
function hasExpression(str: string): boolean {
  return /\{\{.*?\}\}|\{\!\!.*?\!\!\}/.test(str)
}

/**
 * Interpolate template expressions
 */
function interpolateExpressions(
  str: string,
  context: Record<string, unknown>,
): string {
  // Handle {{ }} expressions (escaped)
  let result = str.replace(/\{\{\s*(.+?)\s*\}\}/g, (_match, expr) => {
    try {
      const value = evaluateExpression(expr.trim(), context)
      return escapeHTML(String(value ?? ''))
    }
    catch {
      return ''
    }
  })

  // Handle {!! !!} expressions (unescaped)
  result = result.replace(/\{!!\s*(.+?)\s*!!\}/g, (_match, expr) => {
    try {
      const value = evaluateExpression(expr.trim(), context)
      return String(value ?? '')
    }
    catch {
      return ''
    }
  })

  return result
}

/**
 * Simple expression evaluator
 */
function evaluateExpression(
  expr: string,
  context: Record<string, unknown>,
): unknown {
  // Simple property access
  if (/^[\w.]+$/.test(expr)) {
    const parts = expr.split('.')
    let value: unknown = context

    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part]
      }
      else {
        return undefined
      }
    }

    return value
  }

  // For complex expressions, use Function constructor (be careful with security)
  try {
    const fn = new Function(...Object.keys(context), `return ${expr}`)
    return fn(...Object.values(context))
  }
  catch {
    return undefined
  }
}

/**
 * Escape HTML special characters
 */
function escapeHTML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Minify HTML
 */
function minifyHTML(html: string): string {
  return html
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim()
}

/**
 * Generate template ID from content
 */
function generateTemplateId(template: string): string {
  let hash = 0
  for (let i = 0; i < template.length; i++) {
    const char = template.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `tpl_${Math.abs(hash).toString(36)}`
}

/**
 * Generate content hash
 */
function generateHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Generate unique hydration key
 */
let hydrationKeyCounter = 0
function generateHydrationKey(): string {
  return `h_${++hydrationKeyCounter}`
}

/**
 * Check if component is a Craft native component
 */
function isCraftComponent(name: string): boolean {
  const craftComponents = [
    'craft-button',
    'craft-text-input',
    'craft-textarea',
    'craft-checkbox',
    'craft-radio',
    'craft-select',
    'craft-slider',
    'craft-toggle',
    'craft-date-picker',
    'craft-time-picker',
    'craft-color-picker',
    'craft-file-input',
    'craft-modal',
    'craft-alert',
    'craft-toast',
    'craft-progress',
    'craft-spinner',
    'craft-avatar',
    'craft-badge',
    'craft-card',
    'craft-accordion',
    'craft-tabs',
    'craft-tooltip',
    'craft-popover',
    'craft-dropdown',
    'craft-context-menu',
    'craft-data-table',
    'craft-virtual-list',
    'craft-tree-view',
    'craft-map',
    'craft-chart',
    'craft-video',
    'craft-audio',
    'craft-webview',
    'craft-canvas',
    'craft-image-viewer',
    'craft-pdf-viewer',
    'craft-code-editor',
    'craft-rich-editor',
  ]

  return craftComponents.includes(name)
}

/**
 * Suggest native widget replacement for HTML element
 */
function suggestNativeWidget(node: CraftNode): NativeWidgetSuggestion | null {
  const tag = node.tag?.toLowerCase()
  const type = node.props?.type as string | undefined

  const suggestions: Record<
    string,
    { component: string; confidence: number; reason: string }
  > = {
    button: {
      component: 'craft-button',
      confidence: 0.95,
      reason: 'Native button provides better touch feedback',
    },
    'input:text': {
      component: 'craft-text-input',
      confidence: 0.9,
      reason: 'Native text input has better keyboard handling',
    },
    'input:checkbox': {
      component: 'craft-checkbox',
      confidence: 0.95,
      reason: 'Native checkbox follows platform conventions',
    },
    'input:range': {
      component: 'craft-slider',
      confidence: 0.9,
      reason: 'Native slider provides smooth interaction',
    },
    'input:date': {
      component: 'craft-date-picker',
      confidence: 0.95,
      reason: 'Native date picker provides platform-specific UI',
    },
    'input:time': {
      component: 'craft-time-picker',
      confidence: 0.95,
      reason: 'Native time picker provides platform-specific UI',
    },
    'input:color': {
      component: 'craft-color-picker',
      confidence: 0.9,
      reason: 'Native color picker provides platform-specific UI',
    },
    textarea: {
      component: 'craft-textarea',
      confidence: 0.85,
      reason: 'Native textarea handles multiline input better',
    },
    select: {
      component: 'craft-select',
      confidence: 0.9,
      reason: 'Native select provides platform dropdown UI',
    },
    progress: {
      component: 'craft-progress',
      confidence: 0.95,
      reason: 'Native progress bar matches platform style',
    },
    video: {
      component: 'craft-video',
      confidence: 0.95,
      reason: 'Native video provides hardware acceleration',
    },
    audio: {
      component: 'craft-audio',
      confidence: 0.95,
      reason: 'Native audio provides system integration',
    },
    dialog: {
      component: 'craft-modal',
      confidence: 0.9,
      reason: 'Native modal provides proper layering and focus',
    },
  }

  const key = type ? `${tag}:${type}` : tag
  const suggestion = suggestions[key || ''] || suggestions[tag || '']

  if (suggestion) {
    return {
      htmlSelector: key || tag || '',
      nativeComponent: suggestion.component,
      confidence: suggestion.confidence,
      reason: suggestion.reason,
    }
  }

  return null
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear template cache
 */
export function clearTemplateCache(): void {
  templateCache.clear()
}

/**
 * Clear render cache
 */
export function clearRenderCache(): void {
  renderCache.clear()
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  clearTemplateCache()
  clearRenderCache()
}

/**
 * Get SSR cache statistics
 */
export function getSSRCacheStats(): {
  templateCacheSize: number
  renderCacheSize: number
  totalEntries: number
} {
  return {
    templateCacheSize: templateCache.size,
    renderCacheSize: renderCache.size,
    totalEntries: templateCache.size + renderCache.size,
  }
}

// ============================================================================
// Export
// ============================================================================

const craftSSR: {
  compileTemplate: typeof compileTemplate
  renderSSR: typeof renderSSR
  generateCraftOptimizations: typeof generateCraftOptimizations
  prerenderForCraft: typeof prerenderForCraft
  clearTemplateCache: typeof clearTemplateCache
  clearRenderCache: typeof clearRenderCache
  clearAllCaches: typeof clearAllCaches
  getSSRCacheStats: typeof getSSRCacheStats
} = {
  compileTemplate,
  renderSSR,
  generateCraftOptimizations,
  prerenderForCraft,
  clearTemplateCache,
  clearRenderCache,
  clearAllCaches,
  getSSRCacheStats,
}

export default craftSSR
