/**
 * Build-Time Optimization Module
 *
 * Provides tree-shaking, dead code elimination, and compile-time optimizations
 * for stx templates to reduce bundle size and improve runtime performance.
 *
 * ## Features
 *
 * 1. **Tree-Shaking** - Remove unused directive handlers from compiled output
 * 2. **Dead Code Elimination** - Remove unreachable template branches
 * 3. **Constant Folding** - Pre-evaluate static expressions
 * 4. **String Pooling** - Deduplicate repeated string literals
 * 5. **HTML Minification** - Remove whitespace and comments from static HTML
 *
 * ## Usage
 *
 * ```typescript
 * import { optimizeTemplate, createOptimizedBuild } from 'stx/build-optimizer'
 *
 * // Optimize a single template
 * const optimized = optimizeTemplate(template, { treeShake: true })
 *
 * // Create optimized build for multiple templates
 * const build = await createOptimizedBuild(templates, options)
 * ```
 *
 * @module build-optimizer
 */

// =============================================================================
// Types
// =============================================================================

/** Optimization options */
export interface OptimizationOptions {
  /** Enable tree-shaking of unused directives */
  treeShake?: boolean
  /** Enable dead code elimination */
  deadCodeElimination?: boolean
  /** Enable constant folding for static expressions */
  constantFolding?: boolean
  /** Enable string literal pooling */
  stringPooling?: boolean
  /** Enable HTML minification */
  minifyHtml?: boolean
  /** Remove development-only code */
  removeDevCode?: boolean
  /** Known constants for substitution */
  constants?: Record<string, unknown>
  /** Directives to always include (never tree-shake) */
  preserveDirectives?: string[]
  /** Target environment */
  target?: 'production' | 'development'
}

/** Optimization result */
export interface OptimizationResult {
  /** Optimized template content */
  content: string
  /** Original size in bytes */
  originalSize: number
  /** Optimized size in bytes */
  optimizedSize: number
  /** Size reduction percentage */
  reduction: number
  /** Applied optimizations */
  appliedOptimizations: string[]
  /** Removed directives */
  removedDirectives: string[]
  /** Folded constants */
  foldedConstants: string[]
  /** Pooled strings count */
  pooledStrings: number
  /** Warnings generated during optimization */
  warnings: string[]
}

/** Build result for multiple templates */
export interface BuildResult {
  /** Optimized templates by path */
  templates: Map<string, OptimizationResult>
  /** Shared directive bundle (only used directives) */
  directiveBundle?: string
  /** String pool for shared strings */
  stringPool?: Map<string, string>
  /** Total original size */
  totalOriginalSize: number
  /** Total optimized size */
  totalOptimizedSize: number
  /** Overall reduction percentage */
  overallReduction: number
  /** Build warnings */
  warnings: string[]
}

/** Directive usage info */
interface DirectiveUsage {
  name: string
  count: number
  locations: Array<{ line: number, column: number }>
}

/** Dead code branch */
interface DeadBranch {
  start: number
  end: number
  reason: string
}

// =============================================================================
// Default Configuration
// =============================================================================

const DEFAULT_OPTIONS: Required<OptimizationOptions> = {
  treeShake: true,
  deadCodeElimination: true,
  constantFolding: true,
  stringPooling: false, // Can increase size for small templates
  minifyHtml: true,
  removeDevCode: true,
  constants: {},
  preserveDirectives: [],
  target: 'production',
}

// All available directives
const ALL_DIRECTIVES = [
  // Control flow
  'if',
  'else',
  'elseif',
  'endif',
  'unless',
  'endunless',
  'switch',
  'case',
  'default',
  'endswitch',
  // Loops
  'for',
  'endfor',
  'foreach',
  'endforeach',
  'forelse',
  'endforelse',
  'while',
  'endwhile',
  'break',
  'continue',
  'empty',
  // Layout
  'extends',
  'section',
  'endsection',
  'yield',
  'parent',
  'include',
  'includeIf',
  'includeWhen',
  'includeFirst',
  'once',
  'endonce',
  'push',
  'endpush',
  'prepend',
  'endprepend',
  'stack',
  // Components
  'component',
  'endcomponent',
  'slot',
  'endslot',
  'props',
  // Auth
  'auth',
  'endauth',
  'guest',
  'endguest',
  'can',
  'endcan',
  'cannot',
  'endcannot',
  'role',
  'endrole',
  'hasRole',
  'endhasRole',
  'hasAnyRole',
  'endhasAnyRole',
  // Forms
  'csrf',
  'method',
  'error',
  'enderror',
  'old',
  'input',
  'textarea',
  'select',
  'checkbox',
  'radio',
  'file',
  // i18n
  'translate',
  'lang',
  'choice',
  // SEO
  'meta',
  'title',
  'seo',
  'jsonld',
  'canonical',
  'robots',
  'sitemap',
  // Code blocks
  'ts',
  'endts',
  'js',
  'endjs',
  'css',
  'endcss',
  'markdown',
  'endmarkdown',
  // Other
  'verbatim',
  'endverbatim',
  'env',
  'production',
  'debug',
  'isset',
  'endisset',
  'empty',
  'endempty',
]

// =============================================================================
// Tree Shaking
// =============================================================================

/**
 * Analyze which directives are used in a template.
 */
export function analyzeDirectiveUsage(template: string): DirectiveUsage[] {
  const usage: Map<string, DirectiveUsage> = new Map()
  const directiveRegex = /@(\w+)/g

  let match
  let line = 1
  let lastNewline = 0

  // eslint-disable-next-line no-cond-assign
  while ((match = directiveRegex.exec(template)) !== null) {
    const name = match[1]

    // Count newlines up to this point
    const beforeMatch = template.slice(lastNewline, match.index)
    line += (beforeMatch.match(/\n/g) || []).length
    lastNewline = match.index

    const column = match.index - template.lastIndexOf('\n', match.index - 1)

    if (ALL_DIRECTIVES.includes(name)) {
      const existing = usage.get(name)
      if (existing) {
        existing.count++
        existing.locations.push({ line, column })
      }
      else {
        usage.set(name, {
          name,
          count: 1,
          locations: [{ line, column }],
        })
      }
    }
  }

  return Array.from(usage.values())
}

/**
 * Get list of unused directives for tree-shaking.
 */
export function getUnusedDirectives(
  template: string,
  preserveDirectives: string[] = [],
): string[] {
  const used = analyzeDirectiveUsage(template)
  const usedNames = new Set(used.map(u => u.name))

  // Add preserved directives
  for (const dir of preserveDirectives) {
    usedNames.add(dir)
  }

  // Add matching end directives
  for (const name of Array.from(usedNames)) {
    if (!name.startsWith('end')) {
      usedNames.add(`end${name}`)
    }
  }

  return ALL_DIRECTIVES.filter(d => !usedNames.has(d))
}

/**
 * Generate tree-shaken directive loader code.
 */
export function generateTreeShakenBundle(usedDirectives: string[]): string {
  const imports: string[] = []

  // Group directives by module
  const modules: Record<string, string[]> = {
    conditionals: ['if', 'else', 'elseif', 'endif', 'unless', 'endunless', 'switch', 'case', 'default', 'endswitch', 'isset', 'endisset'],
    loops: ['for', 'endfor', 'foreach', 'endforeach', 'forelse', 'endforelse', 'while', 'endwhile', 'break', 'continue', 'empty'],
    includes: ['include', 'includeIf', 'includeWhen', 'includeFirst', 'once', 'endonce', 'extends', 'section', 'endsection', 'yield', 'parent', 'push', 'endpush', 'prepend', 'endprepend', 'stack'],
    components: ['component', 'endcomponent', 'slot', 'endslot', 'props'],
    auth: ['auth', 'endauth', 'guest', 'endguest', 'can', 'endcan', 'cannot', 'endcannot', 'role', 'endrole', 'hasRole', 'endhasRole', 'hasAnyRole', 'endhasAnyRole'],
    forms: ['csrf', 'method', 'error', 'enderror', 'old', 'input', 'textarea', 'select', 'checkbox', 'radio', 'file'],
    i18n: ['translate', 'lang', 'choice'],
    seo: ['meta', 'title', 'seo', 'jsonld', 'canonical', 'robots', 'sitemap'],
  }

  const neededModules = new Set<string>()

  for (const dir of usedDirectives) {
    for (const [module, directives] of Object.entries(modules)) {
      if (directives.includes(dir)) {
        neededModules.add(module)
        break
      }
    }
  }

  // Generate imports
  for (const module of neededModules) {
    imports.push(`import { process${capitalize(module)} } from './${module}'`)
  }

  // Generate directive map
  const directiveMap = usedDirectives
    .filter(d => !d.startsWith('end'))
    .map(d => `  '${d}': true`)
    .join(',\n')

  return `// Tree-shaken directive bundle
// Only includes: ${usedDirectives.join(', ')}
${imports.join('\n')}

export const activeDirectives = {
${directiveMap}
}

export function isDirectiveActive(name: string): boolean {
  return name in activeDirectives
}
`
}

// =============================================================================
// Dead Code Elimination
// =============================================================================

/**
 * Find dead code branches that can be eliminated.
 */
export function findDeadBranches(
  template: string,
  constants: Record<string, unknown> = {},
): DeadBranch[] {
  const deadBranches: DeadBranch[] = []

  // Find @if(false) or @if(constant that evaluates to false)
  const ifRegex = /@if\(([^)]+)\)[\s\S]*?@endif/g
  const ifMatches = template.matchAll(ifRegex)

  for (const match of ifMatches) {
    const condition = match[1].trim()
    const evaluated = evaluateConstant(condition, constants)

    if (evaluated === false) {
      deadBranches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        reason: `@if condition always false: ${condition}`,
      })
    }
  }

  // Find @unless(true) or @unless(constant that evaluates to true)
  const unlessRegex = /@unless\(([^)]+)\)[\s\S]*?@endunless/g
  const unlessMatches = template.matchAll(unlessRegex)

  for (const match of unlessMatches) {
    const condition = match[1].trim()
    const evaluated = evaluateConstant(condition, constants)

    if (evaluated === true) {
      deadBranches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        reason: `@unless condition always true: ${condition}`,
      })
    }
  }

  // Find @env('development') in production mode
  const envRegex = /@env\(['"]development['"]\)[\s\S]*?@endenv/g

  if (constants.__ENV__ === 'production') {
    const envMatches = template.matchAll(envRegex)
    for (const match of envMatches) {
      deadBranches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        reason: 'Development-only code in production build',
      })
    }
  }

  // Find @debug blocks in production
  const debugRegex = /@debug[\s\S]*?@enddebug/g

  if (constants.__ENV__ === 'production') {
    const debugMatches = template.matchAll(debugRegex)
    for (const match of debugMatches) {
      deadBranches.push({
        start: match.index!,
        end: match.index! + match[0].length,
        reason: 'Debug code in production build',
      })
    }
  }

  return deadBranches
}

/**
 * Remove dead code branches from template.
 */
export function eliminateDeadCode(
  template: string,
  constants: Record<string, unknown> = {},
): { content: string, removed: string[] } {
  const deadBranches = findDeadBranches(template, constants)
  const removed: string[] = []

  // Sort by position descending to avoid index shifting
  deadBranches.sort((a, b) => b.start - a.start)

  let result = template
  for (const branch of deadBranches) {
    result = result.slice(0, branch.start) + result.slice(branch.end)
    removed.push(branch.reason)
  }

  return { content: result, removed }
}

// =============================================================================
// Constant Folding
// =============================================================================

/**
 * Evaluate a constant expression at compile time.
 */
export function evaluateConstant(
  expression: string,
  constants: Record<string, unknown>,
): unknown {
  // Simple literal values
  if (expression === 'true')
    return true
  if (expression === 'false')
    return false
  if (expression === 'null')
    return null
  if (/^\d+$/.test(expression))
    return Number.parseInt(expression, 10)
  if (/^\d+\.\d+$/.test(expression))
    return Number.parseFloat(expression)
  if (/^['"].*['"]$/.test(expression))
    return expression.slice(1, -1)

  // Check if it's a known constant
  if (expression in constants) {
    return constants[expression]
  }

  // Simple comparisons with constants
  const comparisonMatch = expression.match(/^(\w+)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/)
  if (comparisonMatch) {
    const [, left, op, right] = comparisonMatch
    const leftVal = left in constants ? constants[left] : undefined
    const rightVal = evaluateConstant(right, constants)

    if (leftVal !== undefined && rightVal !== undefined) {
      switch (op) {
        case '==':
        case '===':
          return leftVal === rightVal
        case '!=':
        case '!==':
          return leftVal !== rightVal
        case '>':
          return (leftVal as number) > (rightVal as number)
        case '<':
          return (leftVal as number) < (rightVal as number)
        case '>=':
          return (leftVal as number) >= (rightVal as number)
        case '<=':
          return (leftVal as number) <= (rightVal as number)
      }
    }
  }

  // Cannot evaluate at compile time
  return undefined
}

/**
 * Fold constant expressions in template.
 */
export function foldConstants(
  template: string,
  constants: Record<string, unknown>,
): { content: string, folded: string[] } {
  const folded: string[] = []
  let result = template

  // Fold expressions {{ CONSTANT }}
  result = result.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name) => {
    if (name in constants) {
      folded.push(`{{ ${name} }} -> ${constants[name]}`)
      return String(constants[name])
    }
    return match
  })

  // Fold simple arithmetic: {{ 1 + 2 }}
  result = result.replace(/\{\{\s*(\d+)\s*([+\-*])\s*(\d+)\s*\}\}/g, (match, a, op, b) => {
    const numA = Number.parseInt(a, 10)
    const numB = Number.parseInt(b, 10)
    let result: number

    switch (op) {
      case '+':
        result = numA + numB
        break
      case '-':
        result = numA - numB
        break
      case '*':
        result = numA * numB
        break
      default:
        return match
    }

    folded.push(`{{ ${a} ${op} ${b} }} -> ${result}`)
    return String(result)
  })

  return { content: result, folded }
}

// =============================================================================
// HTML Minification
// =============================================================================

/**
 * Minify HTML content while preserving template directives.
 */
export function minifyHtml(template: string): string {
  let result = template

  // Preserve pre, code, script, style, and template blocks
  const preserved: Array<{ marker: string, content: string }> = []
  let markerIndex = 0

  // Preserve pre/code blocks
  result = result.replace(/<(pre|code|script|style)([^>]*)>([\s\S]*?)<\/\1>/gi, (match) => {
    const marker = `__PRESERVE_${markerIndex++}__`
    preserved.push({ marker, content: match })
    return marker
  })

  // Preserve template directive content (don't minify expression content)
  result = result.replace(/\{\{([\s\S]*?)\}\}/g, (match) => {
    const marker = `__PRESERVE_${markerIndex++}__`
    preserved.push({ marker, content: match })
    return marker
  })

  // Preserve stx comments
  result = result.replace(/\{\{--([\s\S]*?)--\}\}/g, '')

  // Remove HTML comments
  result = result.replace(/<!--[\s\S]*?-->/g, '')

  // Collapse whitespace between tags
  result = result.replace(/>\s+</g, '><')

  // Remove leading/trailing whitespace from lines
  result = result.replace(/^\s+/gm, '')
  result = result.replace(/\s+$/gm, '')

  // Collapse multiple spaces
  result = result.replace(/\s{2,}/g, ' ')

  // Restore preserved content
  for (const { marker, content } of preserved) {
    result = result.replace(marker, content)
  }

  return result.trim()
}

// =============================================================================
// String Pooling
// =============================================================================

/**
 * Pool repeated string literals in template.
 */
export function poolStrings(template: string): {
  content: string
  pool: Map<string, string>
  count: number
} {
  const pool: Map<string, string> = new Map()
  const stringCounts: Map<string, number> = new Map()

  // Find all string literals in expressions
  const stringRegex = /(['"])([^'"]{10,})\1/g
  let match

  // eslint-disable-next-line no-cond-assign
  while ((match = stringRegex.exec(template)) !== null) {
    const str = match[2]
    stringCounts.set(str, (stringCounts.get(str) || 0) + 1)
  }

  // Only pool strings that appear more than once
  let poolIndex = 0
  let result = template

  for (const [str, count] of stringCounts) {
    if (count > 1) {
      const varName = `__STR_${poolIndex++}__`
      pool.set(varName, str)

      // Replace all occurrences
      const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`(['"])${escaped}\\1`, 'g')
      result = result.replace(regex, varName)
    }
  }

  return { content: result, pool, count: pool.size }
}

// =============================================================================
// Main Optimization Function
// =============================================================================

/**
 * Optimize a single template with all available optimizations.
 */
export function optimizeTemplate(
  template: string,
  options: OptimizationOptions = {},
): OptimizationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const originalSize = new Blob([template]).size

  let content = template
  const appliedOptimizations: string[] = []
  const warnings: string[] = []
  let removedDirectives: string[] = []
  let foldedConstants: string[] = []
  let pooledStrings = 0

  // Add environment constant
  if (opts.target === 'production') {
    opts.constants = { ...opts.constants, __ENV__: 'production' }
  }

  // 1. Dead code elimination (before other optimizations)
  if (opts.deadCodeElimination) {
    const result = eliminateDeadCode(content, opts.constants)
    content = result.content
    if (result.removed.length > 0) {
      appliedOptimizations.push('Dead code elimination')
      warnings.push(...result.removed.map(r => `Removed: ${r}`))
    }
  }

  // 2. Constant folding
  if (opts.constantFolding && Object.keys(opts.constants).length > 0) {
    const result = foldConstants(content, opts.constants)
    content = result.content
    foldedConstants = result.folded
    if (foldedConstants.length > 0) {
      appliedOptimizations.push('Constant folding')
    }
  }

  // 3. Tree shaking analysis
  if (opts.treeShake) {
    removedDirectives = getUnusedDirectives(content, opts.preserveDirectives)
    if (removedDirectives.length > 0) {
      appliedOptimizations.push('Tree shaking')
    }
  }

  // 4. String pooling
  if (opts.stringPooling) {
    const result = poolStrings(content)
    content = result.content
    pooledStrings = result.count
    if (pooledStrings > 0) {
      appliedOptimizations.push('String pooling')
    }
  }

  // 5. HTML minification (last, to preserve other optimizations)
  if (opts.minifyHtml) {
    const minified = minifyHtml(content)
    if (minified.length < content.length) {
      content = minified
      appliedOptimizations.push('HTML minification')
    }
  }

  const optimizedSize = new Blob([content]).size
  const reduction = originalSize > 0
    ? Math.round((1 - optimizedSize / originalSize) * 100)
    : 0

  return {
    content,
    originalSize,
    optimizedSize,
    reduction,
    appliedOptimizations,
    removedDirectives,
    foldedConstants,
    pooledStrings,
    warnings,
  }
}

// =============================================================================
// Build Function
// =============================================================================

/**
 * Create optimized build for multiple templates.
 */
export async function createOptimizedBuild(
  templates: Map<string, string>,
  options: OptimizationOptions = {},
): Promise<BuildResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const results = new Map<string, OptimizationResult>()
  const warnings: string[] = []
  let totalOriginalSize = 0
  let totalOptimizedSize = 0

  // Collect all used directives across templates
  const allUsedDirectives = new Set<string>()

  for (const [path, template] of templates) {
    const result = optimizeTemplate(template, opts)
    results.set(path, result)

    totalOriginalSize += result.originalSize
    totalOptimizedSize += result.optimizedSize
    warnings.push(...result.warnings.map(w => `${path}: ${w}`))

    // Track used directives
    const usage = analyzeDirectiveUsage(template)
    for (const u of usage) {
      allUsedDirectives.add(u.name)
    }
  }

  // Generate tree-shaken directive bundle if tree-shaking enabled
  let directiveBundle: string | undefined
  if (opts.treeShake) {
    directiveBundle = generateTreeShakenBundle(Array.from(allUsedDirectives))
  }

  // Generate shared string pool if string pooling enabled
  let stringPool: Map<string, string> | undefined
  if (opts.stringPooling) {
    stringPool = new Map()
    // Note: String pool would be populated by a more comprehensive pass
    // that analyzes repeated strings across all templates
    // For now, individual template optimization handles this
  }

  const overallReduction = totalOriginalSize > 0
    ? Math.round((1 - totalOptimizedSize / totalOriginalSize) * 100)
    : 0

  return {
    templates: results,
    directiveBundle,
    stringPool,
    totalOriginalSize,
    totalOptimizedSize,
    overallReduction,
    warnings,
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// =============================================================================
// Export Analysis Functions
// =============================================================================

export {
  analyzeDirectiveUsage as analyzeUsage,
  findDeadBranches as findDeadCode,
}
