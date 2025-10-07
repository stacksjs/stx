/**
 * stx Template Analyzer - Analyze templates for performance, best practices, and potential issues
 */

export interface AnalysisResult {
  file: string
  metrics: TemplateMetrics
  issues: Issue[]
  suggestions: Suggestion[]
  performance: PerformanceMetrics
}

export interface TemplateMetrics {
  lines: number
  characters: number
  directives: DirectiveCount
  expressions: number
  components: number
  layouts: number
  scriptLines: number
  complexity: number
}

export interface DirectiveCount {
  conditionals: number // @if, @unless
  loops: number // @foreach, @for
  includes: number // @include, @component
  custom: number
  total: number
}

export interface Issue {
  type: 'error' | 'warning' | 'info'
  category: 'performance' | 'security' | 'maintainability' | 'accessibility' | 'syntax'
  message: string
  line?: number
  column?: number
  suggestion?: string
}

export interface Suggestion {
  type: 'optimization' | 'best-practice' | 'refactor'
  message: string
  impact: 'low' | 'medium' | 'high'
  effort: 'low' | 'medium' | 'high'
}

export interface PerformanceMetrics {
  estimatedRenderTime: number // ms
  complexityScore: number // 1-10
  cacheability: 'high' | 'medium' | 'low'
  recommendations: string[]
}

/**
 * Analyze an stx template file
 */
export async function analyzeTemplate(filePath: string): Promise<AnalysisResult> {
  try {
    const content = await Bun.file(filePath).text()

    const metrics = calculateMetrics(content)
    const issues = findIssues(content, filePath)
    const suggestions = generateSuggestions(content, metrics)
    const performance = analyzePerformance(content, metrics)

    return {
      file: filePath,
      metrics,
      issues,
      suggestions,
      performance,
    }
  }
  catch (error) {
    throw new Error(`Failed to analyze template ${filePath}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Calculate basic template metrics
 */
function calculateMetrics(content: string): TemplateMetrics {
  const lines = content.split('\n')

  // Extract script content
  const scriptMatch = content.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  const scriptLines = scriptContent.split('\n').length

  // Count directives
  const directives = {
    conditionals: (content.match(/@(if|unless|elseif|else|endif|endunless)\b/g) || []).length,
    loops: (content.match(/@(foreach|for|endforeach|endfor|while|endwhile)\b/g) || []).length,
    includes: (content.match(/@(include|component|extends|section|yield)\b/g) || []).length,
    custom: 0, // Would need to check against registered custom directives
    total: 0,
  }
  directives.total = directives.conditionals + directives.loops + directives.includes + directives.custom

  // Count expressions
  const expressions = (content.match(/\{\{[\s\S]*?\}\}/g) || []).length

  // Count components (custom elements)
  const components = (content.match(/<[A-Z][^>]*>/g) || []).length

  // Count layouts
  const layouts = (content.match(/@extends\(/g) || []).length

  // Calculate complexity score
  const complexity = Math.min(10, Math.ceil(
    directives.total * 0.5
    + expressions * 0.1
    + components * 0.3
    + (scriptLines > 10 ? scriptLines * 0.05 : 0),
  ))

  return {
    lines: lines.length,
    characters: content.length,
    directives,
    expressions,
    components,
    layouts,
    scriptLines,
    complexity,
  }
}

/**
 * Find potential issues in the template
 */
function findIssues(content: string, _filePath: string): Issue[] {
  const issues: Issue[] = []

  // Check for syntax issues
  const unmatchedIfs = findUnmatchedDirectives(content, 'if', 'endif')
  if (unmatchedIfs > 0) {
    issues.push({
      type: 'error',
      category: 'syntax',
      message: `Found ${unmatchedIfs} unmatched @if directive(s)`,
      suggestion: 'Ensure every @if has a corresponding @endif',
    })
  }

  const unmatchedForeachs = findUnmatchedDirectives(content, 'foreach', 'endforeach')
  if (unmatchedForeachs > 0) {
    issues.push({
      type: 'error',
      category: 'syntax',
      message: `Found ${unmatchedForeachs} unmatched @foreach directive(s)`,
      suggestion: 'Ensure every @foreach has a corresponding @endforeach',
    })
  }

  // Check for performance issues
  const nestedLoops = content.match(/@foreach[\s\S]*?@foreach[\s\S]*?@endforeach[\s\S]*?@endforeach/g)
  if (nestedLoops && nestedLoops.length > 0) {
    issues.push({
      type: 'warning',
      category: 'performance',
      message: 'Nested loops detected which may impact performance',
      suggestion: 'Consider preprocessing data or using more efficient data structures',
    })
  }

  // Check for security issues
  const rawOutputs = (content.match(/\{!![\s\S]*?!!\}/g) || []).length
  if (rawOutputs > 0) {
    issues.push({
      type: 'warning',
      category: 'security',
      message: `Found ${rawOutputs} raw output expression(s) {!! !!}`,
      suggestion: 'Ensure raw outputs are properly sanitized to prevent XSS',
    })
  }

  // Check for accessibility issues
  const images = content.match(/<img[^>]*>/g)
  if (images) {
    const imagesWithoutAlt = images.filter(img => !img.includes('alt='))
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'warning',
        category: 'accessibility',
        message: `Found ${imagesWithoutAlt.length} image(s) without alt attributes`,
        suggestion: 'Add alt attributes to all images for screen reader accessibility',
      })
    }
  }

  // Check for maintainability issues
  const longLines = content.split('\n').filter(line => line.length > 120)
  if (longLines.length > 0) {
    issues.push({
      type: 'info',
      category: 'maintainability',
      message: `Found ${longLines.length} line(s) longer than 120 characters`,
      suggestion: 'Consider breaking long lines for better readability',
    })
  }

  // Check for inline styles
  const inlineStyles = (content.match(/style\s*=\s*["'][^"']*["']/g) || []).length
  if (inlineStyles > 3) {
    issues.push({
      type: 'info',
      category: 'maintainability',
      message: `Found ${inlineStyles} inline style attributes`,
      suggestion: 'Consider moving styles to CSS classes for better maintainability',
    })
  }

  return issues
}

/**
 * Generate optimization suggestions
 */
function generateSuggestions(content: string, metrics: TemplateMetrics): Suggestion[] {
  const suggestions: Suggestion[] = []

  // Complexity suggestions
  if (metrics.complexity > 7) {
    suggestions.push({
      type: 'refactor',
      message: 'Template complexity is high. Consider breaking into smaller components.',
      impact: 'high',
      effort: 'medium',
    })
  }

  // Component extraction suggestions
  if (metrics.lines > 100 && metrics.components === 0) {
    suggestions.push({
      type: 'refactor',
      message: 'Large template with no components. Consider extracting reusable parts into components.',
      impact: 'medium',
      effort: 'medium',
    })
  }

  // Performance suggestions
  if (metrics.expressions > 20) {
    suggestions.push({
      type: 'optimization',
      message: 'Many template expressions detected. Consider preprocessing some data in the script section.',
      impact: 'medium',
      effort: 'low',
    })
  }

  // Caching suggestions
  if (metrics.directives.total === 0 && metrics.expressions < 5) {
    suggestions.push({
      type: 'optimization',
      message: 'Template appears static. Consider enabling aggressive caching.',
      impact: 'high',
      effort: 'low',
    })
  }

  // Script optimization
  if (metrics.scriptLines > 50) {
    suggestions.push({
      type: 'refactor',
      message: 'Large script section. Consider moving complex logic to external modules.',
      impact: 'medium',
      effort: 'medium',
    })
  }

  return suggestions
}

/**
 * Analyze performance characteristics
 */
function analyzePerformance(content: string, metrics: TemplateMetrics): PerformanceMetrics {
  // Estimate render time based on complexity
  let estimatedRenderTime = 1 // Base 1ms

  // Add time for directives
  estimatedRenderTime += metrics.directives.conditionals * 0.1
  estimatedRenderTime += metrics.directives.loops * 0.5
  estimatedRenderTime += metrics.directives.includes * 2
  estimatedRenderTime += metrics.expressions * 0.05
  estimatedRenderTime += metrics.components * 1

  // Factor in script complexity
  if (metrics.scriptLines > 10) {
    estimatedRenderTime += metrics.scriptLines * 0.1
  }

  // Determine cacheability
  let cacheability: 'high' | 'medium' | 'low'
  if (metrics.expressions === 0 && metrics.directives.total === 0) {
    cacheability = 'high'
  }
  else if (metrics.expressions < 5 && metrics.directives.total < 3) {
    cacheability = 'medium'
  }
  else {
    cacheability = 'low'
  }

  // Generate recommendations
  const recommendations: string[] = []

  if (estimatedRenderTime > 10) {
    recommendations.push('Consider optimizing template complexity')
  }

  if (cacheability === 'low' && metrics.directives.total > 5) {
    recommendations.push('Reduce dynamic content for better caching')
  }

  if (metrics.components === 0 && metrics.lines > 50) {
    recommendations.push('Extract components to improve reusability and performance')
  }

  return {
    estimatedRenderTime: Math.round(estimatedRenderTime * 100) / 100,
    complexityScore: metrics.complexity,
    cacheability,
    recommendations,
  }
}

/**
 * Find unmatched directive pairs
 */
function findUnmatchedDirectives(content: string, startDirective: string, endDirective: string): number {
  const starts = (content.match(new RegExp(`@${startDirective}\\b`, 'g')) || []).length
  const ends = (content.match(new RegExp(`@${endDirective}\\b`, 'g')) || []).length
  return Math.abs(starts - ends)
}

/**
 * Analyze multiple templates
 */
export async function analyzeProject(patterns: string[] = ['**/*.stx']): Promise<{
  results: AnalysisResult[]
  summary: ProjectSummary
}> {
  const results: AnalysisResult[] = []

  // Find all stx files
  const allFiles: string[] = []
  for (const pattern of patterns) {
    const files = await Array.fromAsync(new Bun.Glob(pattern).scan({ onlyFiles: true, absolute: true }))
    allFiles.push(...files.filter(f => f.endsWith('.stx')))
  }

  // Analyze each file
  for (const file of allFiles) {
    try {
      const result = await analyzeTemplate(file)
      results.push(result)
    }
    catch (error) {
      console.warn(`Failed to analyze ${file}:`, error)
    }
  }

  // Generate project summary
  const summary = generateProjectSummary(results)

  return { results, summary }
}

export interface ProjectSummary {
  totalFiles: number
  totalLines: number
  avgComplexity: number
  totalIssues: number
  issuesByCategory: Record<string, number>
  performanceScore: number // 1-10
  recommendations: string[]
}

function generateProjectSummary(results: AnalysisResult[]): ProjectSummary {
  const totalFiles = results.length
  const totalLines = results.reduce((sum, r) => sum + r.metrics.lines, 0)
  const avgComplexity = results.reduce((sum, r) => sum + r.metrics.complexity, 0) / totalFiles
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)

  const issuesByCategory: Record<string, number> = {}
  results.forEach((r) => {
    r.issues.forEach((issue) => {
      issuesByCategory[issue.category] = (issuesByCategory[issue.category] || 0) + 1
    })
  })

  // Calculate performance score (higher is better)
  const avgRenderTime = results.reduce((sum, r) => sum + r.performance.estimatedRenderTime, 0) / totalFiles
  const performanceScore = Math.max(1, Math.min(10, Math.round(10 - (avgRenderTime / 2) - (avgComplexity / 2))))

  const recommendations: string[] = []

  if (avgComplexity > 6) {
    recommendations.push('Project has high average complexity. Consider refactoring complex templates.')
  }

  if (totalIssues > totalFiles * 2) {
    recommendations.push('High number of issues detected. Run detailed analysis on individual files.')
  }

  if (issuesByCategory.security > 0) {
    recommendations.push('Security issues found. Review raw output usage and input sanitization.')
  }

  return {
    totalFiles,
    totalLines,
    avgComplexity: Math.round(avgComplexity * 100) / 100,
    totalIssues,
    issuesByCategory,
    performanceScore,
    recommendations,
  }
}
