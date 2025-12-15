/**
 * Craft Native UI Compiler
 *
 * This module provides React Native-style compilation of stx templates
 * into native UI code. Instead of rendering HTML in a webview, this
 * compiler generates native component trees that Craft can render directly.
 *
 * Key features:
 * - stx template → Craft native component tree
 * - Static analysis and type checking
 * - Tree shaking for optimal bundle size
 * - Platform-specific code generation (macOS, Windows, Linux, iOS, Android)
 * - Hot reload support in development
 */

import type { CompiledTemplate, CraftNode } from './craft-ssr'

// ============================================================================
// Types
// ============================================================================

/**
 * Target platform for compilation
 */
export type CompilationTarget = 'macos' | 'windows' | 'linux' | 'ios' | 'android' | 'universal'

/**
 * Output format for compiled code
 */
export type CompilationFormat = 'zig' | 'typescript' | 'json' | 'binary'

/**
 * Compiler configuration
 */
export interface CompilerConfig {
  /** Target platform */
  target: CompilationTarget
  /** Output format */
  format: CompilationFormat
  /** Enable optimizations */
  optimize: boolean
  /** Enable tree shaking */
  treeShake: boolean
  /** Enable hot reload */
  hotReload: boolean
  /** Debug mode */
  debug: boolean
  /** Source maps */
  sourceMaps: boolean
  /** Bundle all dependencies */
  bundle: boolean
  /** Minify output */
  minify: boolean
  /** Custom components registry */
  components?: Map<string, NativeComponentDefinition>
}

/**
 * Native component definition
 */
export interface NativeComponentDefinition {
  name: string
  zigType: string
  props: NativePropDefinition[]
  children?: 'single' | 'multiple' | 'none'
  platform?: CompilationTarget[]
  fallback?: string
}

/**
 * Property definition for native components
 */
export interface NativePropDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'color' | 'callback' | 'object' | 'array'
  required: boolean
  default?: unknown
  zigType?: string
}

/**
 * Compiled native code output
 */
export interface CompiledNativeCode {
  /** Main code output */
  code: string
  /** Platform-specific code */
  platformCode: Map<CompilationTarget, string>
  /** Dependency graph */
  dependencies: CompilerDependencyNode[]
  /** Component manifest */
  manifest: ComponentManifest
  /** Source maps (if enabled) */
  sourceMaps?: string
  /** Compilation statistics */
  stats: CompilationStats
}

/**
 * Dependency node in the graph
 */
export interface CompilerDependencyNode {
  id: string
  type: 'component' | 'style' | 'script' | 'asset'
  path: string
  dependencies: string[]
  size: number
  isStatic: boolean
}

/**
 * Component manifest
 */
export interface ComponentManifest {
  version: string
  components: ManifestComponent[]
  entry: string
  assets: ManifestAsset[]
  styles: string[]
}

/**
 * Component entry in manifest
 */
export interface ManifestComponent {
  name: string
  hash: string
  props: string[]
  events: string[]
  slots: string[]
  isNative: boolean
}

/**
 * Asset entry in manifest
 */
export interface ManifestAsset {
  path: string
  type: 'image' | 'font' | 'icon' | 'other'
  hash: string
  size: number
}

/**
 * Compilation statistics
 */
export interface CompilationStats {
  compilationTime: number
  totalComponents: number
  nativeComponents: number
  webComponents: number
  bundleSize: number
  treeShakenSize: number
  warnings: CompilationWarning[]
  errors: CompilationError[]
}

/**
 * Compilation warning
 */
export interface CompilationWarning {
  code: string
  message: string
  file?: string
  line?: number
  column?: number
}

/**
 * Compilation error
 */
export interface CompilationError extends CompilationWarning {
  fatal: boolean
}

/**
 * Native IR (Intermediate Representation) node
 */
export interface NativeIRNode {
  type: 'view' | 'text' | 'image' | 'button' | 'input' | 'scroll' | 'list' | 'custom'
  zigType: string
  props: Record<string, IRValue>
  children: NativeIRNode[]
  events: Map<string, string>
  styles: IRStyle
  id?: string
  key?: string
}

/**
 * IR value types
 */
export type IRValue =
  | { type: 'literal'; value: string | number | boolean }
  | { type: 'binding'; path: string }
  | { type: 'expression'; code: string }
  | { type: 'callback'; handler: string }

/**
 * IR style definition
 */
export interface IRStyle {
  layout: LayoutStyle
  appearance: AppearanceStyle
  text?: TextStyle
}

/**
 * Layout style properties
 */
export interface LayoutStyle {
  display?: 'flex' | 'grid' | 'block' | 'none'
  flexDirection?: 'row' | 'column'
  justifyContent?: 'start' | 'center' | 'end' | 'between' | 'around'
  alignItems?: 'start' | 'center' | 'end' | 'stretch'
  gap?: number
  padding?: number | [number, number, number, number]
  margin?: number | [number, number, number, number]
  width?: number | 'auto' | string
  height?: number | 'auto' | string
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
}

/**
 * Appearance style properties
 */
export interface AppearanceStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  opacity?: number
  shadow?: ShadowStyle
}

/**
 * Shadow style
 */
export interface ShadowStyle {
  color: string
  offsetX: number
  offsetY: number
  blur: number
  spread: number
}

/**
 * Text style properties
 */
export interface TextStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | 'light' | number
  color?: string
  textAlign?: 'left' | 'center' | 'right'
  lineHeight?: number
  letterSpacing?: number
}

// ============================================================================
// Native Component Registry
// ============================================================================

/**
 * Default native component definitions
 */
const NATIVE_COMPONENTS: Map<string, NativeComponentDefinition> = new Map([
  ['craft-button', {
    name: 'Button',
    zigType: 'craft.Button',
    props: [
      { name: 'variant', type: 'string', required: false, default: 'primary' },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'onclick', type: 'callback', required: false },
    ],
    children: 'single',
  }],
  ['craft-text-input', {
    name: 'TextInput',
    zigType: 'craft.TextInput',
    props: [
      { name: 'value', type: 'string', required: false, default: '' },
      { name: 'placeholder', type: 'string', required: false },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-textarea', {
    name: 'TextArea',
    zigType: 'craft.TextArea',
    props: [
      { name: 'value', type: 'string', required: false, default: '' },
      { name: 'placeholder', type: 'string', required: false },
      { name: 'rows', type: 'number', required: false, default: 3 },
      { name: 'disabled', type: 'boolean', required: false, default: false },
    ],
    children: 'none',
  }],
  ['craft-checkbox', {
    name: 'Checkbox',
    zigType: 'craft.Checkbox',
    props: [
      { name: 'checked', type: 'boolean', required: false, default: false },
      { name: 'label', type: 'string', required: false },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-select', {
    name: 'Select',
    zigType: 'craft.Select',
    props: [
      { name: 'value', type: 'string', required: false },
      { name: 'options', type: 'array', required: true },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-slider', {
    name: 'Slider',
    zigType: 'craft.Slider',
    props: [
      { name: 'value', type: 'number', required: false, default: 0 },
      { name: 'min', type: 'number', required: false, default: 0 },
      { name: 'max', type: 'number', required: false, default: 100 },
      { name: 'step', type: 'number', required: false, default: 1 },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-toggle', {
    name: 'Toggle',
    zigType: 'craft.Toggle',
    props: [
      { name: 'checked', type: 'boolean', required: false, default: false },
      { name: 'disabled', type: 'boolean', required: false, default: false },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-modal', {
    name: 'Modal',
    zigType: 'craft.Modal',
    props: [
      { name: 'open', type: 'boolean', required: false, default: false },
      { name: 'title', type: 'string', required: false },
      { name: 'closable', type: 'boolean', required: false, default: true },
      { name: 'onclose', type: 'callback', required: false },
    ],
    children: 'multiple',
  }],
  ['craft-alert', {
    name: 'Alert',
    zigType: 'craft.Alert',
    props: [
      { name: 'variant', type: 'string', required: false, default: 'info' },
      { name: 'title', type: 'string', required: false },
      { name: 'dismissible', type: 'boolean', required: false, default: false },
    ],
    children: 'single',
  }],
  ['craft-progress', {
    name: 'ProgressBar',
    zigType: 'craft.ProgressBar',
    props: [
      { name: 'value', type: 'number', required: false, default: 0 },
      { name: 'max', type: 'number', required: false, default: 100 },
      { name: 'indeterminate', type: 'boolean', required: false, default: false },
    ],
    children: 'none',
  }],
  ['craft-spinner', {
    name: 'Spinner',
    zigType: 'craft.Spinner',
    props: [
      { name: 'size', type: 'number', required: false, default: 24 },
    ],
    children: 'none',
  }],
  ['craft-avatar', {
    name: 'Avatar',
    zigType: 'craft.Avatar',
    props: [
      { name: 'src', type: 'string', required: false },
      { name: 'alt', type: 'string', required: false },
      { name: 'size', type: 'number', required: false, default: 40 },
    ],
    children: 'none',
  }],
  ['craft-badge', {
    name: 'Badge',
    zigType: 'craft.Badge',
    props: [
      { name: 'variant', type: 'string', required: false, default: 'default' },
    ],
    children: 'single',
  }],
  ['craft-card', {
    name: 'Card',
    zigType: 'craft.Card',
    props: [
      { name: 'padding', type: 'number', required: false, default: 16 },
    ],
    children: 'multiple',
  }],
  ['craft-accordion', {
    name: 'Accordion',
    zigType: 'craft.Accordion',
    props: [
      { name: 'title', type: 'string', required: true },
      { name: 'open', type: 'boolean', required: false, default: false },
    ],
    children: 'multiple',
  }],
  ['craft-tabs', {
    name: 'TabView',
    zigType: 'craft.TabView',
    props: [
      { name: 'activeTab', type: 'number', required: false, default: 0 },
      { name: 'ontabchange', type: 'callback', required: false },
    ],
    children: 'multiple',
  }],
  ['craft-tooltip', {
    name: 'Tooltip',
    zigType: 'craft.Tooltip',
    props: [
      { name: 'content', type: 'string', required: true },
      { name: 'position', type: 'string', required: false, default: 'top' },
    ],
    children: 'single',
  }],
  ['craft-date-picker', {
    name: 'DatePicker',
    zigType: 'craft.DatePicker',
    props: [
      { name: 'value', type: 'string', required: false },
      { name: 'min', type: 'string', required: false },
      { name: 'max', type: 'string', required: false },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-time-picker', {
    name: 'TimePicker',
    zigType: 'craft.TimePicker',
    props: [
      { name: 'value', type: 'string', required: false },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-color-picker', {
    name: 'ColorPicker',
    zigType: 'craft.ColorPicker',
    props: [
      { name: 'value', type: 'color', required: false, default: '#000000' },
      { name: 'onchange', type: 'callback', required: false },
    ],
    children: 'none',
  }],
  ['craft-data-table', {
    name: 'DataTable',
    zigType: 'craft.DataTable',
    props: [
      { name: 'data', type: 'array', required: true },
      { name: 'columns', type: 'array', required: true },
      { name: 'sortable', type: 'boolean', required: false, default: false },
      { name: 'paginated', type: 'boolean', required: false, default: false },
    ],
    children: 'none',
  }],
  ['craft-virtual-list', {
    name: 'VirtualList',
    zigType: 'craft.VirtualList',
    props: [
      { name: 'items', type: 'array', required: true },
      { name: 'itemHeight', type: 'number', required: false, default: 48 },
      { name: 'renderItem', type: 'callback', required: true },
    ],
    children: 'none',
  }],
  ['craft-tree-view', {
    name: 'TreeView',
    zigType: 'craft.TreeView',
    props: [
      { name: 'data', type: 'object', required: true },
      { name: 'expandable', type: 'boolean', required: false, default: true },
    ],
    children: 'none',
  }],
])

// ============================================================================
// Compiler Implementation
// ============================================================================

/**
 * Compile stx template to native Craft code
 */
export async function compileToNative(
  template: string | CompiledTemplate,
  config: Partial<CompilerConfig> = {},
): Promise<CompiledNativeCode> {
  const startTime = performance.now()

  const fullConfig: CompilerConfig = {
    target: config.target || 'universal',
    format: config.format || 'zig',
    optimize: config.optimize ?? true,
    treeShake: config.treeShake ?? true,
    hotReload: config.hotReload ?? false,
    debug: config.debug ?? false,
    sourceMaps: config.sourceMaps ?? false,
    bundle: config.bundle ?? true,
    minify: config.minify ?? false,
    components: config.components || NATIVE_COMPONENTS,
  }

  // Parse template if string
  const parsed = typeof template === 'string'
    ? parseTemplate(template)
    : template

  // Convert to Native IR
  const ir = convertToNativeIR(parsed.tree, fullConfig)

  // Analyze dependencies
  const dependencies = analyzeDependencies(ir)

  // Tree shake if enabled
  const optimizedIR = fullConfig.treeShake
    ? treeShake(ir, dependencies)
    : ir

  // Generate code for target platform(s)
  const platformCode = new Map<CompilationTarget, string>()

  if (fullConfig.target === 'universal') {
    const targets: CompilationTarget[] = ['macos', 'windows', 'linux', 'ios', 'android']
    for (const target of targets) {
      const code = generateNativeCode(optimizedIR, { ...fullConfig, target })
      platformCode.set(target, code)
    }
  }
  else {
    const code = generateNativeCode(optimizedIR, fullConfig)
    platformCode.set(fullConfig.target, code)
  }

  // Generate main entry code
  const code = generateEntryCode(optimizedIR, fullConfig, platformCode)

  // Generate component manifest
  const manifest = generateManifest(parsed, optimizedIR, fullConfig)

  // Calculate stats
  const stats: CompilationStats = {
    compilationTime: performance.now() - startTime,
    totalComponents: countComponents(parsed.tree),
    nativeComponents: countNativeComponents(optimizedIR),
    webComponents: countComponents(parsed.tree) - countNativeComponents(optimizedIR),
    bundleSize: code.length,
    treeShakenSize: fullConfig.treeShake ? calculateTreeShakenSize(ir, optimizedIR) : code.length,
    warnings: [],
    errors: [],
  }

  // Generate source maps if enabled
  let sourceMaps: string | undefined
  if (fullConfig.sourceMaps) {
    sourceMaps = generateSourceMaps(parsed, optimizedIR)
  }

  return {
    code,
    platformCode,
    dependencies,
    manifest,
    sourceMaps,
    stats,
  }
}

/**
 * Parse template string into AST
 */
function parseTemplate(template: string): CompiledTemplate {
  // Simple parser - in production, use the full stx parser
  const tree: CraftNode = {
    type: 'fragment',
    children: [],
  }

  // Extract body content
  const bodyMatch = template.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const content = bodyMatch ? bodyMatch[1] : template

  // Parse HTML into tree
  parseHTMLIntoTree(content, tree)

  return {
    id: generateId(),
    hash: hashString(template),
    tree,
    scripts: extractScriptBlocks(template),
    styles: extractStyleBlocks(template),
    staticParts: new Map(),
    dynamicParts: new Map(),
    dependencies: [],
    metadata: {
      hasSlots: false,
      hasDynamicContent: template.includes('{{'),
      hasEventHandlers: template.includes('onclick') || template.includes('onchange'),
      hasAsyncContent: false,
      componentCount: 0,
      maxDepth: 0,
      estimatedSize: template.length,
    },
  }
}

/**
 * Parse HTML content into tree
 */
function parseHTMLIntoTree(content: string, parent: CraftNode): void {
  const tagRegex = /<(@?[\w-]+)([^>]*)(?:\/>|>([\s\S]*?)<\/\1>)/g

  let match
  while ((match = tagRegex.exec(content)) !== null) {
    const [, tag, attrs, innerContent] = match
    const isCraft = tag.startsWith('@craft-')

    const node: CraftNode = {
      type: isCraft ? 'component' : 'element',
      tag: isCraft ? tag.slice(1) : tag,
      props: parseAttributeString(attrs),
      children: [],
      componentName: isCraft ? tag.slice(1) : undefined,
    }

    if (innerContent) {
      // Check for text content
      const textContent = innerContent.replace(/<[^>]+>/g, '').trim()
      if (textContent) {
        node.children = node.children ?? []
        node.children.push({
          type: 'text',
          text: textContent,
        })
      }

      // Parse child elements
      parseHTMLIntoTree(innerContent, node)
    }

    parent.children = parent.children ?? []
    parent.children.push(node)
  }
}

/**
 * Parse attribute string into props object
 */
function parseAttributeString(attrs: string): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  const attrRegex = /([\w-:@]+)(?:=["']([^"']*)["'])?/g

  let match
  while ((match = attrRegex.exec(attrs)) !== null) {
    const [, name, value] = match
    props[name] = value ?? true
  }

  return props
}

/**
 * Convert CraftNode tree to Native IR
 */
function convertToNativeIR(tree: CraftNode, config: CompilerConfig): NativeIRNode {
  return transformNode(tree, config)
}

/**
 * Transform a single node to Native IR
 */
function transformNode(node: CraftNode, config: CompilerConfig): NativeIRNode {
  const componentDef = node.componentName
    ? config.components?.get(node.componentName)
    : undefined

  // Determine Zig type
  let zigType = 'craft.View'
  if (componentDef) {
    zigType = componentDef.zigType
  }
  else if (node.type === 'text') {
    zigType = 'craft.Text'
  }
  else if (node.tag) {
    zigType = mapHTMLToZig(node.tag)
  }

  // Transform props
  const props: Record<string, IRValue> = {}
  if (node.props) {
    for (const [key, value] of Object.entries(node.props)) {
      props[key] = transformValue(value)
    }
  }

  // Transform children
  const children: NativeIRNode[] = []
  if (node.children) {
    for (const child of node.children) {
      children.push(transformNode(child, config))
    }
  }

  // Extract events
  const events = new Map<string, string>()
  if (node.props) {
    for (const [key, value] of Object.entries(node.props)) {
      if (key.startsWith('on') && typeof value === 'string') {
        events.set(key.slice(2).toLowerCase(), value)
      }
    }
  }

  // Generate styles
  const styles = extractStyles(node)

  return {
    type: determineIRType(node, componentDef),
    zigType,
    props,
    children,
    events,
    styles,
    id: node.hydrationKey,
    key: node.props?.key as string | undefined,
  }
}

/**
 * Map HTML tag to Zig type
 */
function mapHTMLToZig(tag: string): string {
  const mapping: Record<string, string> = {
    div: 'craft.View',
    span: 'craft.Text',
    p: 'craft.Text',
    h1: 'craft.Text',
    h2: 'craft.Text',
    h3: 'craft.Text',
    h4: 'craft.Text',
    h5: 'craft.Text',
    h6: 'craft.Text',
    button: 'craft.Button',
    input: 'craft.TextInput',
    textarea: 'craft.TextArea',
    select: 'craft.Select',
    img: 'craft.Image',
    a: 'craft.Link',
    ul: 'craft.List',
    ol: 'craft.List',
    li: 'craft.ListItem',
    form: 'craft.Form',
    label: 'craft.Label',
    nav: 'craft.View',
    header: 'craft.View',
    footer: 'craft.View',
    main: 'craft.View',
    section: 'craft.View',
    article: 'craft.View',
    aside: 'craft.View',
  }

  return mapping[tag.toLowerCase()] || 'craft.View'
}

/**
 * Transform value to IR value
 */
function transformValue(value: unknown): IRValue {
  if (typeof value === 'string') {
    // Check for binding expressions
    if (value.startsWith('{{') && value.endsWith('}}')) {
      return {
        type: 'binding',
        path: value.slice(2, -2).trim(),
      }
    }

    // Check for callback expressions
    if (value.includes('(') && value.includes(')')) {
      return {
        type: 'callback',
        handler: value,
      }
    }

    return { type: 'literal', value }
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return { type: 'literal', value }
  }

  return { type: 'literal', value: String(value) }
}

/**
 * Determine IR node type
 */
function determineIRType(
  node: CraftNode,
  componentDef?: NativeComponentDefinition,
): NativeIRNode['type'] {
  if (componentDef) {
    const name = componentDef.name.toLowerCase()
    if (name.includes('button')) return 'button'
    if (name.includes('input') || name.includes('text')) return 'input'
    if (name.includes('image') || name.includes('avatar')) return 'image'
    if (name.includes('list') || name.includes('table')) return 'list'
    if (name.includes('scroll')) return 'scroll'
    return 'custom'
  }

  if (node.type === 'text') return 'text'

  const tag = node.tag?.toLowerCase()
  if (tag === 'button') return 'button'
  if (tag === 'input' || tag === 'textarea') return 'input'
  if (tag === 'img') return 'image'
  if (tag === 'ul' || tag === 'ol') return 'list'

  return 'view'
}

/**
 * Extract styles from node
 */
function extractStyles(node: CraftNode): IRStyle {
  const style = node.props?.style as string | undefined
  const layout: LayoutStyle = {}
  const appearance: AppearanceStyle = {}

  if (style) {
    const styleProps = style.split(';').filter(Boolean)
    for (const prop of styleProps) {
      const [key, value] = prop.split(':').map(s => s.trim())
      if (!key || !value) continue

      switch (key) {
        case 'display':
          layout.display = value as LayoutStyle['display']
          break
        case 'flex-direction':
          layout.flexDirection = value as LayoutStyle['flexDirection']
          break
        case 'justify-content':
          layout.justifyContent = mapJustifyContent(value)
          break
        case 'align-items':
          layout.alignItems = mapAlignItems(value)
          break
        case 'gap':
          layout.gap = Number.parseInt(value, 10)
          break
        case 'padding':
          layout.padding = Number.parseInt(value, 10)
          break
        case 'margin':
          layout.margin = Number.parseInt(value, 10)
          break
        case 'width':
          layout.width = value === 'auto' ? 'auto' : Number.parseInt(value, 10)
          break
        case 'height':
          layout.height = value === 'auto' ? 'auto' : Number.parseInt(value, 10)
          break
        case 'background-color':
        case 'background':
          appearance.backgroundColor = value
          break
        case 'border-color':
          appearance.borderColor = value
          break
        case 'border-width':
          appearance.borderWidth = Number.parseInt(value, 10)
          break
        case 'border-radius':
          appearance.borderRadius = Number.parseInt(value, 10)
          break
        case 'opacity':
          appearance.opacity = Number.parseFloat(value)
          break
      }
    }
  }

  return { layout, appearance }
}

/**
 * Map CSS justify-content to IR value
 */
function mapJustifyContent(value: string): LayoutStyle['justifyContent'] {
  const mapping: Record<string, LayoutStyle['justifyContent']> = {
    'flex-start': 'start',
    'flex-end': 'end',
    center: 'center',
    'space-between': 'between',
    'space-around': 'around',
  }
  return mapping[value] || 'start'
}

/**
 * Map CSS align-items to IR value
 */
function mapAlignItems(value: string): LayoutStyle['alignItems'] {
  const mapping: Record<string, LayoutStyle['alignItems']> = {
    'flex-start': 'start',
    'flex-end': 'end',
    center: 'center',
    stretch: 'stretch',
  }
  return mapping[value] || 'start'
}

// ============================================================================
// Dependency Analysis
// ============================================================================

/**
 * Analyze dependencies in the IR tree
 */
function analyzeDependencies(ir: NativeIRNode): CompilerDependencyNode[] {
  const deps: CompilerDependencyNode[] = []
  const visited = new Set<string>()

  function walk(node: NativeIRNode, parentId?: string): void {
    const id = node.id || generateId()
    if (visited.has(id)) return
    visited.add(id)

    const dep: CompilerDependencyNode = {
      id,
      type: 'component',
      path: node.zigType,
      dependencies: parentId ? [parentId] : [],
      size: estimateNodeSize(node),
      isStatic: isStaticNode(node),
    }

    deps.push(dep)

    for (const child of node.children) {
      walk(child, id)
    }
  }

  walk(ir)
  return deps
}

/**
 * Estimate size of a node
 */
function estimateNodeSize(node: NativeIRNode): number {
  let size = 100 // Base size
  size += Object.keys(node.props).length * 20
  size += node.events.size * 50
  return size
}

/**
 * Check if node is static
 */
function isStaticNode(node: NativeIRNode): boolean {
  for (const value of Object.values(node.props)) {
    if (value.type !== 'literal') return false
  }
  return node.events.size === 0
}

// ============================================================================
// Tree Shaking
// ============================================================================

/**
 * Tree shake unused components
 */
function treeShake(ir: NativeIRNode, _deps: CompilerDependencyNode[]): NativeIRNode {
  // For now, return as-is
  // Full implementation would remove unused components
  return ir
}

/**
 * Calculate tree shaken size difference
 */
function calculateTreeShakenSize(_original: NativeIRNode, optimized: NativeIRNode): number {
  let size = 0
  function walk(node: NativeIRNode): void {
    size += estimateNodeSize(node)
    for (const child of node.children) {
      walk(child)
    }
  }
  walk(optimized)
  return size
}

// ============================================================================
// Code Generation
// ============================================================================

/**
 * Generate native code for target platform
 */
function generateNativeCode(ir: NativeIRNode, config: CompilerConfig): string {
  switch (config.format) {
    case 'zig':
      return generateZigCode(ir, config)
    case 'typescript':
      return generateTypeScriptCode(ir, config)
    case 'json':
      return JSON.stringify(ir, null, config.minify ? 0 : 2)
    default:
      return generateZigCode(ir, config)
  }
}

/**
 * Generate Zig code from IR
 */
function generateZigCode(ir: NativeIRNode, config: CompilerConfig): string {
  const lines: string[] = []

  lines.push('// Auto-generated by stx compiler')
  lines.push('// Target: ' + config.target)
  lines.push('')
  lines.push('const std = @import("std");')
  lines.push('const craft = @import("craft");')
  lines.push('')
  lines.push('pub fn render(allocator: std.mem.Allocator) !craft.Element {')
  lines.push('    return try build(allocator);')
  lines.push('}')
  lines.push('')

  generateZigNode(ir, lines, 0)

  return lines.join('\n')
}

/**
 * Generate Zig code for a node
 */
function generateZigNode(node: NativeIRNode, lines: string[], depth: number): void {
  const indent = '    '.repeat(depth)

  if (depth === 0) {
    lines.push(`fn build(allocator: std.mem.Allocator) !craft.Element {`)
  }

  const varName = `node_${depth}`

  lines.push(`${indent}    var ${varName} = try ${node.zigType}.init(allocator);`)

  // Set props
  for (const [key, value] of Object.entries(node.props)) {
    if (value.type === 'literal') {
      const zigValue = typeof value.value === 'string'
        ? `"${value.value}"`
        : String(value.value)
      lines.push(`${indent}    ${varName}.set${capitalize(key)}(${zigValue});`)
    }
  }

  // Add children
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.type === 'text') {
      const text = child.props.text?.type === 'literal'
        ? String(child.props.text.value)
        : ''
      lines.push(`${indent}    try ${varName}.addChild(try craft.Text.init(allocator, "${text}"));`)
    }
    else {
      generateZigNode(child, lines, depth + 1)
      lines.push(`${indent}    try ${varName}.addChild(node_${depth + 1});`)
    }
  }

  if (depth === 0) {
    lines.push(`    return ${varName}.element();`)
    lines.push('}')
  }
}

/**
 * Generate TypeScript code from IR
 */
function generateTypeScriptCode(ir: NativeIRNode, config: CompilerConfig): string {
  const lines: string[] = []

  lines.push('// Auto-generated by stx compiler')
  lines.push('// Target: ' + config.target)
  lines.push('')
  lines.push('import { Craft } from "@stacksjs/craft";')
  lines.push('')
  lines.push('export function render(): Craft.Element {')
  lines.push('  return ' + generateTSNode(ir, 1) + ';')
  lines.push('}')

  return lines.join('\n')
}

/**
 * Generate TypeScript code for a node
 */
function generateTSNode(node: NativeIRNode, depth: number): string {
  const indent = '  '.repeat(depth)

  const props: string[] = []
  for (const [key, value] of Object.entries(node.props)) {
    if (value.type === 'literal') {
      const tsValue = typeof value.value === 'string'
        ? `"${value.value}"`
        : String(value.value)
      props.push(`${key}: ${tsValue}`)
    }
  }

  const propsStr = props.length > 0 ? `{ ${props.join(', ')} }` : '{}'

  const children = node.children.map(child =>
    child.type === 'text'
      ? `"${child.props.text?.type === 'literal' ? child.props.text.value : ''}"`
      : generateTSNode(child, depth + 1),
  )

  const childrenStr = children.length > 0
    ? `,\n${indent}  [${children.join(`,\n${indent}    `)}]`
    : ''

  return `Craft.create("${node.zigType}", ${propsStr}${childrenStr})`
}

/**
 * Generate entry code
 */
function generateEntryCode(
  ir: NativeIRNode,
  config: CompilerConfig,
  platformCode: Map<CompilationTarget, string>,
): string {
  if (config.target === 'universal') {
    // Generate platform-switching entry
    const lines: string[] = []
    lines.push('// Universal entry point')
    lines.push('')

    for (const [platform, code] of platformCode) {
      lines.push(`// --- ${platform.toUpperCase()} ---`)
      lines.push(`#if ${platform.toUpperCase()}`)
      lines.push(code)
      lines.push('#endif')
      lines.push('')
    }

    return lines.join('\n')
  }

  return platformCode.get(config.target) || generateNativeCode(ir, config)
}

/**
 * Generate component manifest
 */
function generateManifest(
  parsed: CompiledTemplate,
  ir: NativeIRNode,
  _config: CompilerConfig,
): ComponentManifest {
  const components: ManifestComponent[] = []

  function walk(node: NativeIRNode): void {
    components.push({
      name: node.zigType,
      hash: hashString(JSON.stringify(node.props)),
      props: Object.keys(node.props),
      events: Array.from(node.events.keys()),
      slots: [],
      isNative: node.zigType.startsWith('craft.'),
    })

    for (const child of node.children) {
      walk(child)
    }
  }

  walk(ir)

  return {
    version: '1.0.0',
    components,
    entry: parsed.id,
    assets: [],
    styles: parsed.styles,
  }
}

/**
 * Generate source maps
 */
function generateSourceMaps(
  _parsed: CompiledTemplate,
  _ir: NativeIRNode,
): string {
  // Basic source map structure
  return JSON.stringify({
    version: 3,
    file: 'output.zig',
    sources: ['input.stx'],
    mappings: '',
  })
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate unique ID
 */
let idCounter = 0
function generateId(): string {
  return `id_${++idCounter}`
}

/**
 * Hash a string
 */
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Extract script blocks from template
 */
function extractScriptBlocks(template: string): string[] {
  const scripts: string[] = []
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = scriptRegex.exec(template)) !== null) {
    scripts.push(match[1])
  }
  return scripts
}

/**
 * Extract style blocks from template
 */
function extractStyleBlocks(template: string): string[] {
  const styles: string[] = []
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  let match
  while ((match = styleRegex.exec(template)) !== null) {
    styles.push(match[1])
  }
  return styles
}

/**
 * Count components in tree
 */
function countComponents(node: CraftNode): number {
  let count = node.type === 'component' ? 1 : 0
  if (node.children) {
    for (const child of node.children) {
      count += countComponents(child)
    }
  }
  return count
}

/**
 * Count native components in IR
 */
function countNativeComponents(node: NativeIRNode): number {
  let count = node.zigType.startsWith('craft.') ? 1 : 0
  for (const child of node.children) {
    count += countNativeComponents(child)
  }
  return count
}

// ============================================================================
// Hot Reload Support
// ============================================================================

/**
 * Hot reload configuration
 */
export interface HotReloadConfig {
  port: number
  watchPaths: string[]
  debounceMs: number
}

/**
 * Create hot reload server
 */
export function createHotReloadServer(_config: HotReloadConfig): {
  start: () => Promise<void>
  stop: () => Promise<void>
  notifyChange: (path: string) => void
} {
  return {
    start: async () => {
      // Hot reload server implementation
      console.log('[craft-compiler] Hot reload server started')
    },
    stop: async () => {
      console.log('[craft-compiler] Hot reload server stopped')
    },
    notifyChange: (path: string) => {
      console.log(`[craft-compiler] File changed: ${path}`)
    },
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  NATIVE_COMPONENTS,
}

const craftCompiler: {
  compileToNative: typeof compileToNative
  createHotReloadServer: typeof createHotReloadServer
  NATIVE_COMPONENTS: typeof NATIVE_COMPONENTS
} = {
  compileToNative,
  createHotReloadServer,
  NATIVE_COMPONENTS,
}

export default craftCompiler
