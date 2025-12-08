/**
 * Visual Editor Integration Module
 *
 * Provides APIs for visual template editing in IDEs and editors.
 * This module enables:
 * - Template AST visualization
 * - Component outline/structure view
 * - Drag-and-drop component editing
 * - Live preview support
 * - Template property inspection
 *
 * ## Usage
 *
 * ```typescript
 * import { analyzeTemplate, getTemplateOutline, generatePreview } from 'stx/visual-editor'
 *
 * // Analyze template structure
 * const analysis = analyzeTemplate(templateContent)
 *
 * // Get hierarchical outline
 * const outline = getTemplateOutline(templateContent)
 *
 * // Generate preview HTML
 * const preview = await generatePreview(templateContent, context)
 * ```
 *
 * @module visual-editor
 */

// =============================================================================
// Types
// =============================================================================

/** Node types in template outline */
export type OutlineNodeType =
  | 'document'
  | 'element'
  | 'component'
  | 'directive'
  | 'slot'
  | 'section'
  | 'expression'
  | 'script'
  | 'style'
  | 'comment'
  | 'text'

/** Directive category for visual grouping */
export type DirectiveCategory =
  | 'control-flow'
  | 'loop'
  | 'layout'
  | 'component'
  | 'auth'
  | 'form'
  | 'seo'
  | 'i18n'
  | 'custom'

/** Template outline node */
export interface OutlineNode {
  type: OutlineNodeType
  name: string
  label: string
  range: { start: number, end: number, line: number, column: number }
  children: OutlineNode[]
  attributes?: Record<string, string | true>
  directiveCategory?: DirectiveCategory
  isClosable?: boolean
  icon?: string
  description?: string
}

/** Template analysis result */
export interface TemplateAnalysis {
  /** Detected variables used in template */
  variables: VariableUsage[]
  /** Components referenced */
  components: ComponentReference[]
  /** Directives used */
  directives: VisualEditorDirectiveUsage[]
  /** Slots defined */
  slots: SlotDefinition[]
  /** Sections defined */
  sections: SectionDefinition[]
  /** Script blocks */
  scripts: ScriptBlock[]
  /** Style blocks */
  styles: StyleBlock[]
  /** Layout inheritance */
  layout?: LayoutInfo
  /** Template complexity metrics */
  metrics: VisualEditorMetrics
}

/** Variable usage info */
export interface VariableUsage {
  name: string
  line: number
  column: number
  context: 'expression' | 'directive' | 'attribute'
  inferredType?: string
}

/** Component reference info */
export interface ComponentReference {
  name: string
  path?: string
  line: number
  props: Record<string, string | true>
  hasSlot: boolean
}

/** Visual editor directive usage info */
export interface VisualEditorDirectiveUsage {
  name: string
  category: DirectiveCategory
  line: number
  params?: string
  hasEndTag: boolean
}

/** Slot definition */
export interface SlotDefinition {
  name: string
  line: number
  isNamed: boolean
  defaultContent?: string
}

/** Section definition */
export interface SectionDefinition {
  name: string
  line: number
  content: string
}

/** Script block info */
export interface ScriptBlock {
  type: 'typescript' | 'javascript'
  line: number
  content: string
  exports: string[]
}

/** Style block info */
export interface StyleBlock {
  type: 'css' | 'scss' | 'less'
  line: number
  content: string
  scoped: boolean
}

/** Layout info */
export interface LayoutInfo {
  extends: string
  line: number
  sections: string[]
}

/** Visual editor template complexity metrics */
export interface VisualEditorMetrics {
  /** Total line count */
  lines: number
  /** Total character count */
  characters: number
  /** Maximum nesting depth */
  maxNestingDepth: number
  /** Number of directives */
  directiveCount: number
  /** Number of components */
  componentCount: number
  /** Number of expressions */
  expressionCount: number
  /** Cyclomatic complexity estimate */
  complexity: number
}

/** Visual editor preview options */
export interface VisualEditorPreviewOptions {
  /** Context data for rendering */
  context?: Record<string, unknown>
  /** Include styles */
  includeStyles?: boolean
  /** Include scripts */
  includeScripts?: boolean
  /** Wrap in HTML document */
  wrapInDocument?: boolean
  /** Base URL for assets */
  baseUrl?: string
  /** Custom CSS to inject */
  customCss?: string
}

/** Component palette item */
export interface PaletteItem {
  name: string
  displayName: string
  category: string
  description: string
  icon?: string
  snippet: string
  props?: VisualEditorPropDefinition[]
  slots?: string[]
}

/** Visual editor prop definition for palette */
export interface VisualEditorPropDefinition {
  name: string
  type: string
  required: boolean
  default?: string
  description?: string
}

/** Editor selection/position */
export interface EditorPosition {
  line: number
  column: number
  offset: number
}

/** Insert operation result */
export interface InsertResult {
  content: string
  cursorPosition: EditorPosition
}

// =============================================================================
// Directive Metadata
// =============================================================================

const DIRECTIVE_CATEGORIES: Record<string, DirectiveCategory> = {
  // Control flow
  if: 'control-flow',
  else: 'control-flow',
  elseif: 'control-flow',
  unless: 'control-flow',
  switch: 'control-flow',
  case: 'control-flow',
  default: 'control-flow',

  // Loops
  for: 'loop',
  foreach: 'loop',
  forelse: 'loop',
  while: 'loop',
  empty: 'loop',
  break: 'loop',
  continue: 'loop',

  // Layout
  extends: 'layout',
  section: 'layout',
  yield: 'layout',
  parent: 'layout',
  include: 'layout',
  includeIf: 'layout',
  includeWhen: 'layout',
  includeFirst: 'layout',
  once: 'layout',
  push: 'layout',
  prepend: 'layout',
  stack: 'layout',

  // Components
  component: 'component',
  slot: 'component',
  props: 'component',
  webcomponent: 'component',

  // Auth
  auth: 'auth',
  guest: 'auth',
  can: 'auth',
  cannot: 'auth',
  role: 'auth',
  hasRole: 'auth',
  hasAnyRole: 'auth',

  // Forms
  csrf: 'form',
  method: 'form',
  error: 'form',
  old: 'form',
  input: 'form',
  textarea: 'form',
  select: 'form',
  checkbox: 'form',
  radio: 'form',

  // SEO
  meta: 'seo',
  title: 'seo',
  seo: 'seo',
  jsonld: 'seo',
  canonical: 'seo',

  // i18n
  translate: 'i18n',
  lang: 'i18n',
  choice: 'i18n',
}

const DIRECTIVE_ICONS: Record<DirectiveCategory, string> = {
  'control-flow': 'symbol-branch',
  'loop': 'symbol-loop',
  'layout': 'symbol-structure',
  'component': 'symbol-class',
  'auth': 'shield',
  'form': 'symbol-field',
  'seo': 'search',
  'i18n': 'globe',
  'custom': 'symbol-misc',
}

// =============================================================================
// Template Outline Generation
// =============================================================================

/**
 * Generate a hierarchical outline of the template.
 * Used for document outline view in IDEs.
 */
export function getTemplateOutline(template: string): OutlineNode {
  const root: OutlineNode = {
    type: 'document',
    name: 'document',
    label: 'Document',
    range: { start: 0, end: template.length, line: 1, column: 1 },
    children: [],
  }

  const stack: OutlineNode[] = [root]
  let pos = 0
  let line = 1
  let column = 1

  const updatePosition = (char: string) => {
    if (char === '\n') {
      line++
      column = 1
    }
    else {
      column++
    }
    pos++
  }

  const getPosition = () => ({ start: pos, end: pos, line, column })

  // Parse template into outline nodes
  while (pos < template.length) {
    const remaining = template.slice(pos)

    // Check for directives
    const directiveMatch = remaining.match(/^@(\w+)(?:\s*\(([^)]*)\))?/)
    if (directiveMatch) {
      const [full, name, params] = directiveMatch
      const category = DIRECTIVE_CATEGORIES[name] || 'custom'

      // Check if this is an end directive
      if (name.startsWith('end')) {
        // Pop from stack
        const baseName = name.slice(3)
        const parent = stack[stack.length - 1]
        if (parent.name === baseName && stack.length > 1) {
          parent.range.end = pos + full.length
          stack.pop()
        }
      }
      else {
        const isClosable = hasEndTag(name)
        const node: OutlineNode = {
          type: 'directive',
          name,
          label: `@${name}${params ? `(${truncate(params, 30)})` : ''}`,
          range: getPosition(),
          children: [],
          directiveCategory: category,
          isClosable,
          icon: DIRECTIVE_ICONS[category],
          description: params,
        }

        stack[stack.length - 1].children.push(node)

        if (isClosable) {
          stack.push(node)
        }
      }

      // Update position
      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for components (PascalCase tags)
    const componentMatch = remaining.match(/^<([A-Z][A-Za-z0-9]+)([^>]*)>/)
    if (componentMatch) {
      const [full, name, attrs] = componentMatch
      const node: OutlineNode = {
        type: 'component',
        name,
        label: `<${name}>`,
        range: getPosition(),
        children: [],
        attributes: parseSimpleAttributes(attrs),
        icon: 'symbol-class',
        isClosable: !full.endsWith('/>'),
      }

      stack[stack.length - 1].children.push(node)

      if (node.isClosable) {
        stack.push(node)
      }

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for component closing tags
    const componentCloseMatch = remaining.match(/^<\/([A-Z][A-Za-z0-9]+)>/)
    if (componentCloseMatch) {
      const [full, name] = componentCloseMatch
      const parent = stack[stack.length - 1]
      if (parent.name === name && parent.type === 'component' && stack.length > 1) {
        parent.range.end = pos + full.length
        stack.pop()
      }

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for HTML elements
    const elementMatch = remaining.match(/^<([a-z][a-z0-9-]*)([^>]*)>/i)
    if (elementMatch) {
      const [full, tag, attrs] = elementMatch
      const isSelfClosing = full.endsWith('/>') || isVoidElement(tag)

      const node: OutlineNode = {
        type: 'element',
        name: tag,
        label: `<${tag}>`,
        range: getPosition(),
        children: [],
        attributes: parseSimpleAttributes(attrs),
        isClosable: !isSelfClosing,
      }

      stack[stack.length - 1].children.push(node)

      if (node.isClosable) {
        stack.push(node)
      }

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for element closing tags
    const elementCloseMatch = remaining.match(/^<\/([a-z][a-z0-9-]*)>/i)
    if (elementCloseMatch) {
      const [full, tag] = elementCloseMatch
      const parent = stack[stack.length - 1]
      if (parent.name === tag && parent.type === 'element' && stack.length > 1) {
        parent.range.end = pos + full.length
        stack.pop()
      }

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for expressions
    const exprMatch = remaining.match(/^\{\{([^}]+)\}\}/)
    if (exprMatch) {
      const [full, expr] = exprMatch
      const node: OutlineNode = {
        type: 'expression',
        name: 'expression',
        label: `{{ ${truncate(expr.trim(), 30)} }}`,
        range: getPosition(),
        children: [],
        icon: 'symbol-variable',
      }

      stack[stack.length - 1].children.push(node)

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for script blocks
    const scriptMatch = remaining.match(/^<script([^>]*)>/)
    if (scriptMatch) {
      const [full] = scriptMatch
      const node: OutlineNode = {
        type: 'script',
        name: 'script',
        label: '<script>',
        range: getPosition(),
        children: [],
        icon: 'symbol-event',
        isClosable: true,
      }

      stack[stack.length - 1].children.push(node)
      stack.push(node)

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for script closing
    if (remaining.startsWith('</script>')) {
      const full = '</script>'
      const parent = stack[stack.length - 1]
      if (parent.type === 'script' && stack.length > 1) {
        parent.range.end = pos + full.length
        stack.pop()
      }

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for style blocks
    const styleMatch = remaining.match(/^<style([^>]*)>/)
    if (styleMatch) {
      const [full] = styleMatch
      const node: OutlineNode = {
        type: 'style',
        name: 'style',
        label: '<style>',
        range: getPosition(),
        children: [],
        icon: 'symbol-color',
        isClosable: true,
      }

      stack[stack.length - 1].children.push(node)
      stack.push(node)

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for style closing
    if (remaining.startsWith('</style>')) {
      const full = '</style>'
      const parent = stack[stack.length - 1]
      if (parent.type === 'style' && stack.length > 1) {
        parent.range.end = pos + full.length
        stack.pop()
      }

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Check for comments
    const commentMatch = remaining.match(/^\{\{--([^}]*?)--\}\}/)
    if (commentMatch) {
      const [full, content] = commentMatch
      const node: OutlineNode = {
        type: 'comment',
        name: 'comment',
        label: `{{-- ${truncate(content.trim(), 30)} --}}`,
        range: getPosition(),
        children: [],
        icon: 'comment',
      }

      stack[stack.length - 1].children.push(node)

      for (const char of full) {
        updatePosition(char)
      }
      continue
    }

    // Skip to next character
    updatePosition(template[pos])
  }

  return root
}

// =============================================================================
// Template Analysis
// =============================================================================

/**
 * Analyze a template for visual editor purposes
 * (Alias: analyzeTemplateContent)
 */
export function analyzeVisualEditorTemplate(template: string): TemplateAnalysis {
  return analyzeTemplateContentImpl(template)
}

/**
 * Analyze a template string and extract all relevant information
 * Use this for analyzing template content directly (not from a file path)
 */
export function analyzeTemplateContent(template: string): TemplateAnalysis {
  return analyzeTemplateContentImpl(template)
}

/**
 * Internal implementation of template analysis
 */
function analyzeTemplateContentImpl(template: string): TemplateAnalysis {
  const variables: VariableUsage[] = []
  const components: ComponentReference[] = []
  const directives: VisualEditorDirectiveUsage[] = []
  const slots: SlotDefinition[] = []
  const sections: SectionDefinition[] = []
  const scripts: ScriptBlock[] = []
  const styles: StyleBlock[] = []
  let layout: LayoutInfo | undefined

  // Extract expressions {{ var }}
  const exprRegex = /\{\{\s*([^}]+?)\s*\}\}/g
  const exprMatches = template.matchAll(exprRegex)
  for (const match of exprMatches) {
    const expr = match[1]
    const varMatch = expr.match(/^([a-z_$][\w$]*)/i)
    if (varMatch) {
      const lineNum = getLineNumber(template, match.index)
      variables.push({
        name: varMatch[1],
        line: lineNum,
        column: getColumnNumber(template, match.index),
        context: 'expression',
      })
    }
  }

  // Extract directives
  const directiveRegex = /@(\w+)(?:\s*\(([^)]*)\))?/g
  const directiveMatches = template.matchAll(directiveRegex)
  for (const match of directiveMatches) {
    const name = match[1]
    const params = match[2]
    const lineNum = getLineNumber(template, match.index!)

    if (name === 'extends' && params) {
      layout = {
        extends: params.replace(/['"]/g, ''),
        line: lineNum,
        sections: [],
      }
    }
    else if (name === 'section' && params) {
      const sectionName = params.replace(/['"]/g, '').split(',')[0].trim()
      sections.push({
        name: sectionName,
        line: lineNum,
        content: '',
      })
      if (layout) {
        layout.sections.push(sectionName)
      }
    }
    else if (name === 'slot') {
      slots.push({
        name: params ? params.replace(/['"]/g, '') : 'default',
        line: lineNum,
        isNamed: !!params,
      })
    }
    else if (name === 'component' && params) {
      const componentName = params.replace(/['"]/g, '').split(',')[0].trim()
      components.push({
        name: componentName,
        line: lineNum,
        props: {},
        hasSlot: false,
      })
    }

    directives.push({
      name,
      category: DIRECTIVE_CATEGORIES[name] || 'custom',
      line: lineNum,
      params,
      hasEndTag: hasEndTag(name),
    })
  }

  // Extract PascalCase components
  const componentRegex = /<([A-Z][A-Za-z0-9]+)([^>]*)>/g
  const componentMatches = template.matchAll(componentRegex)
  for (const match of componentMatches) {
    const name = match[1]
    const attrsStr = match[2]
    const lineNum = getLineNumber(template, match.index!)

    // Check if component has slot content
    const closeTagPos = template.indexOf(`</${name}>`, match.index)
    const hasSlot = closeTagPos !== -1 && template.slice(match.index! + match[0].length, closeTagPos).trim().length > 0

    components.push({
      name,
      line: lineNum,
      props: parseSimpleAttributes(attrsStr),
      hasSlot,
    })
  }

  // Extract script blocks
  const scriptRegex = /<script([^>]*)>([\s\S]*?)<\/script>/g
  const scriptMatches = template.matchAll(scriptRegex)
  for (const match of scriptMatches) {
    const attrs = match[1]
    const content = match[2]
    const lineNum = getLineNumber(template, match.index!)
    const isTS = attrs.includes('lang="ts"') || attrs.includes('lang=\'ts\'')

    // Extract exports
    const exports: string[] = []
    const exportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g
    const exportMatches = content.matchAll(exportRegex)
    for (const exportMatch of exportMatches) {
      exports.push(exportMatch[1])
    }

    scripts.push({
      type: isTS ? 'typescript' : 'javascript',
      line: lineNum,
      content,
      exports,
    })
  }

  // Extract style blocks
  const styleRegex = /<style([^>]*)>([\s\S]*?)<\/style>/g
  const styleMatches = template.matchAll(styleRegex)
  for (const match of styleMatches) {
    const attrs = match[1]
    const content = match[2]
    const lineNum = getLineNumber(template, match.index!)

    let type: 'css' | 'scss' | 'less' = 'css'
    if (attrs.includes('lang="scss"') || attrs.includes('lang=\'scss\''))
      type = 'scss'
    if (attrs.includes('lang="less"') || attrs.includes('lang=\'less\''))
      type = 'less'

    styles.push({
      type,
      line: lineNum,
      content,
      scoped: attrs.includes('scoped'),
    })
  }

  // Calculate metrics
  const metrics = calculateMetrics(template, directives, components, variables)

  return {
    variables,
    components,
    directives,
    slots,
    sections,
    scripts,
    styles,
    layout,
    metrics,
  }
}

// =============================================================================
// Metrics Calculation
// =============================================================================

function calculateMetrics(
  template: string,
  directives: VisualEditorDirectiveUsage[],
  components: ComponentReference[],
  variables: VariableUsage[],
): VisualEditorMetrics {
  const lines = template.split('\n').length
  const characters = template.length

  // Calculate nesting depth
  let maxDepth = 0
  let currentDepth = 0
  for (const dir of directives) {
    if (dir.hasEndTag && !dir.name.startsWith('end')) {
      currentDepth++
      maxDepth = Math.max(maxDepth, currentDepth)
    }
    else if (dir.name.startsWith('end')) {
      currentDepth--
    }
  }

  // Estimate complexity (control flow decisions + loops)
  const controlFlowDirs = directives.filter(d =>
    d.category === 'control-flow' || d.category === 'loop',
  )
  const complexity = 1 + controlFlowDirs.length

  return {
    lines,
    characters,
    maxNestingDepth: maxDepth,
    directiveCount: directives.length,
    componentCount: components.length,
    expressionCount: variables.length,
    complexity,
  }
}

// =============================================================================
// Preview Generation
// =============================================================================

/**
 * Generate preview HTML for a template.
 * This is a simplified preview for editor integration.
 */
export async function generatePreview(
  template: string,
  options: VisualEditorPreviewOptions = {},
): Promise<string> {
  const {
    context = {},
    includeStyles = true,
    includeScripts = false,
    wrapInDocument = true,
    baseUrl = '',
    customCss = '',
  } = options

  // Simple variable substitution for preview
  let preview = template

  // Replace expressions with context values
  preview = preview.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expr) => {
    const varName = expr.trim().split('.')[0].split('[')[0]
    if (varName in context) {
      const value = context[varName]
      return typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    return `<span class="stx-preview-placeholder">${expr}</span>`
  })

  // Remove directives for clean preview
  preview = preview.replace(/@(\w+)(?:\s*\([^)]*\))?/g, (match, name) => {
    if (name.startsWith('end'))
      return ''
    return `<span class="stx-preview-directive" data-directive="${name}">${match}</span>`
  })

  // Remove script blocks if not included
  if (!includeScripts) {
    preview = preview.replace(/<script[\s\S]*?<\/script>/gi, '')
  }

  // Extract and process styles
  let styles = ''
  if (includeStyles) {
    const styleMatches = preview.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)
    for (const match of styleMatches) {
      styles += match[1]
    }
    // Remove inline style tags
    preview = preview.replace(/<style[\s\S]*?<\/style>/gi, '')
  }

  if (wrapInDocument) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STX Preview</title>
  ${baseUrl ? `<base href="${baseUrl}">` : ''}
  <style>
    .stx-preview-placeholder {
      background: #fff3cd;
      padding: 2px 4px;
      border-radius: 2px;
      font-family: monospace;
      font-size: 0.9em;
    }
    .stx-preview-directive {
      background: #d1ecf1;
      padding: 2px 4px;
      border-radius: 2px;
      font-family: monospace;
      font-size: 0.9em;
    }
    ${customCss}
    ${styles}
  </style>
</head>
<body>
  ${preview}
</body>
</html>`
  }

  return preview
}

// =============================================================================
// Component Palette
// =============================================================================

/**
 * Get default component palette items.
 */
export function getDefaultPalette(): PaletteItem[] {
  return [
    // Layout
    {
      name: 'extends',
      displayName: 'Extends Layout',
      category: 'Layout',
      description: 'Extend a parent layout template',
      icon: 'symbol-structure',
      snippet: '@extends(\'$1\')\n\n@section(\'content\')\n  $0\n@endsection',
    },
    {
      name: 'section',
      displayName: 'Section',
      category: 'Layout',
      description: 'Define a section within a layout',
      icon: 'symbol-structure',
      snippet: '@section(\'$1\')\n  $0\n@endsection',
    },
    {
      name: 'include',
      displayName: 'Include Partial',
      category: 'Layout',
      description: 'Include another template',
      icon: 'file-add',
      snippet: '@include(\'$1\')',
    },

    // Control Flow
    {
      name: 'if',
      displayName: 'If Block',
      category: 'Control Flow',
      description: 'Conditional rendering',
      icon: 'symbol-branch',
      snippet: '@if($1)\n  $0\n@endif',
    },
    {
      name: 'if-else',
      displayName: 'If-Else Block',
      category: 'Control Flow',
      description: 'Conditional with else branch',
      icon: 'symbol-branch',
      snippet: '@if($1)\n  $2\n@else\n  $0\n@endif',
    },
    {
      name: 'switch',
      displayName: 'Switch Block',
      category: 'Control Flow',
      description: 'Switch statement for multiple conditions',
      icon: 'symbol-branch',
      snippet: '@switch($1)\n  @case($2)\n    $3\n    @break\n  @default\n    $0\n@endswitch',
    },

    // Loops
    {
      name: 'foreach',
      displayName: 'For Each Loop',
      category: 'Loops',
      description: 'Iterate over a collection',
      icon: 'symbol-loop',
      snippet: '@foreach($1 as $2)\n  $0\n@endforeach',
    },
    {
      name: 'forelse',
      displayName: 'For Else Loop',
      category: 'Loops',
      description: 'Loop with empty state',
      icon: 'symbol-loop',
      snippet: '@forelse($1 as $2)\n  $3\n@empty\n  $0\n@endforelse',
    },
    {
      name: 'for',
      displayName: 'For Loop',
      category: 'Loops',
      description: 'Traditional for loop',
      icon: 'symbol-loop',
      snippet: '@for($1 = 0; $1 < $2; $1++)\n  $0\n@endfor',
    },

    // Components
    {
      name: 'component',
      displayName: 'Component',
      category: 'Components',
      description: 'Include a reusable component',
      icon: 'symbol-class',
      snippet: '@component(\'$1\')\n  $0\n@endcomponent',
    },
    {
      name: 'slot',
      displayName: 'Slot',
      category: 'Components',
      description: 'Define slot content placeholder',
      icon: 'symbol-class',
      snippet: '@slot(\'$1\')\n  $0\n@endslot',
    },

    // Forms
    {
      name: 'csrf',
      displayName: 'CSRF Token',
      category: 'Forms',
      description: 'Insert CSRF protection token',
      icon: 'shield',
      snippet: '@csrf',
    },
    {
      name: 'error',
      displayName: 'Error Display',
      category: 'Forms',
      description: 'Display validation error',
      icon: 'error',
      snippet: '@error(\'$1\')\n  <span class="error">{{ \\$message }}</span>\n@enderror',
    },

    // Auth
    {
      name: 'auth',
      displayName: 'Auth Check',
      category: 'Auth',
      description: 'Show content for authenticated users',
      icon: 'shield',
      snippet: '@auth\n  $0\n@endauth',
    },
    {
      name: 'guest',
      displayName: 'Guest Check',
      category: 'Auth',
      description: 'Show content for guests',
      icon: 'shield',
      snippet: '@guest\n  $0\n@endguest',
    },

    // SEO
    {
      name: 'meta',
      displayName: 'Meta Tag',
      category: 'SEO',
      description: 'Insert meta tag',
      icon: 'search',
      snippet: '@meta(\'$1\', \'$2\')',
    },
    {
      name: 'title',
      displayName: 'Page Title',
      category: 'SEO',
      description: 'Set page title',
      icon: 'search',
      snippet: '@title(\'$1\')',
    },

    // i18n
    {
      name: 'translate',
      displayName: 'Translation',
      category: 'i18n',
      description: 'Translate a string',
      icon: 'globe',
      snippet: '@translate(\'$1\')',
    },
  ]
}

// =============================================================================
// Insertion Helpers
// =============================================================================

/**
 * Generate insert result for a palette item.
 */
export function insertPaletteItem(
  item: PaletteItem,
  position: EditorPosition,
  indentation: string = '',
): InsertResult {
  // Apply indentation to snippet
  const lines = item.snippet.split('\n')
  const indentedLines = lines.map((line, i) =>
    i === 0 ? line : indentation + line,
  )
  const content = indentedLines.join('\n')

  // Find cursor position ($0 or first $n)
  const cursorMatch = content.match(/\$\d/)
  let cursorOffset = content.length
  if (cursorMatch) {
    cursorOffset = content.indexOf(cursorMatch[0])
  }

  // Calculate final cursor position
  const newContent = content.replace(/\$\d/g, '')
  const beforeCursor = newContent.slice(0, cursorOffset)
  const cursorLine = beforeCursor.split('\n').length - 1
  const lastLineStart = beforeCursor.lastIndexOf('\n') + 1
  const cursorColumn = cursorOffset - lastLineStart

  return {
    content: newContent,
    cursorPosition: {
      line: position.line + cursorLine,
      column: cursorLine === 0 ? position.column + cursorColumn : cursorColumn,
      offset: position.offset + cursorOffset,
    },
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function hasEndTag(directiveName: string): boolean {
  const closableDirectives = [
    'if',
    'unless',
    'switch',
    'for',
    'foreach',
    'forelse',
    'while',
    'section',
    'component',
    'slot',
    'push',
    'prepend',
    'auth',
    'guest',
    'can',
    'cannot',
    'role',
    'hasRole',
    'hasAnyRole',
    'error',
    'isset',
    'empty',
    'ts',
    'js',
    'css',
    'markdown',
    'verbatim',
    'once',
  ]
  return closableDirectives.includes(directiveName)
}

function isVoidElement(tag: string): boolean {
  const voidElements = [
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
  ]
  return voidElements.includes(tag.toLowerCase())
}

function parseSimpleAttributes(attrsStr: string): Record<string, string | true> {
  const attrs: Record<string, string | true> = {}
  const regex = /([^\s=]+)(?:=["']([^"']*)["'])?/g
  const matches = attrsStr.matchAll(regex)
  for (const match of matches) {
    const [, name, value] = match
    attrs[name] = value ?? true
  }
  return attrs
}

function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength)
    return str
  return `${str.slice(0, maxLength - 3)}...`
}

function getLineNumber(template: string, offset: number): number {
  return template.slice(0, offset).split('\n').length
}

function getColumnNumber(template: string, offset: number): number {
  const lastNewline = template.lastIndexOf('\n', offset - 1)
  return offset - lastNewline
}
