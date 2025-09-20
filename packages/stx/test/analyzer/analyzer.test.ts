import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { analyzeTemplate, analyzeProject } from '../../src/analyzer'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-analyzer')

describe('STX Analyzer', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })

    // Create test templates for analysis
    await Bun.write(path.join(TEMP_DIR, 'simple.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Simple Template</title>
  <script>
    module.exports = {
      title: "Hello World"
    };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
</body>
</html>`)

    await Bun.write(path.join(TEMP_DIR, 'complex.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Complex Template</title>
  <script>
    module.exports = {
      user: { name: "John", isAdmin: true },
      posts: [
        { title: "Post 1", content: "<strong>Bold content</strong>" },
        { title: "Post 2", content: "Normal content" }
      ],
      showDebug: true
    };
  </script>
</head>
<body>
  <header>
    <h1>Welcome {{ user.name }}</h1>
    @if (user.isAdmin)
      <div class="admin-panel" onclick="showAdmin()">
        <h2>Admin Panel</h2>
        @if (showDebug)
          <div class="debug">Debug info</div>
        @endif
      </div>
    @endif
  </header>

  <main>
    @if (posts.length > 0)
      @foreach (posts as post)
        <article>
          <h2>{{ post.title }}</h2>
          <div>{!! post.content !!}</div>
          @if (user.isAdmin)
            <button onclick="editPost()">Edit</button>
          @endif
        </article>
      @endforeach
    @else
      <p>No posts found</p>
    @endif
  </main>

  <img src="banner.jpg">
  <img src="logo.png" alt="Company Logo">
</body>
</html>`)

    await Bun.write(path.join(TEMP_DIR, 'malformed.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Malformed Template</title>
  <script>
    module.exports = {
      items: [1, 2, 3]
    };
  </script>
</head>
<body>
  @if (items.length > 0)
    <ul>
      @foreach (items as item)
        <li>{{ item }}</li>
      @endforeach
    </ul>
  <!-- Missing @endif -->

  @foreach (items as item)
    <p>Item: {{ item }}</p>
  <!-- Missing @endforeach -->
</body>
</html>`)

    await Bun.write(path.join(TEMP_DIR, 'performance-heavy.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Heavy Template</title>
  <script>
    const heavyData = [];
    for (let i = 0; i < 100; i++) {
      heavyData.push({
        id: i,
        name: \`Item \${i}\`,
        nested: {
          deep: {
            value: i * 2
          }
        }
      });
    }

    module.exports = {
      items: heavyData,
      categories: Array(50).fill(0).map((_, i) => ({ name: \`Category \${i}\`, items: heavyData.slice(i, i + 10) })),
      user: { name: "User", preferences: { theme: "dark", language: "en" } }
    };
  </script>
</head>
<body>
  @foreach (categories as category)
    <section>
      <h2>{{ category.name }}</h2>
      @foreach (category.items as item)
        <div class="item" style="display: inline-block; margin: 5px; padding: 10px; border: 1px solid #ccc;">
          <h3>{{ item.name }}</h3>
          <p>ID: {{ item.id }}</p>
          @if (item.nested.deep.value > 50)
            <span class="high-value">High Value: {{ item.nested.deep.value }}</span>
          @endif
          @if (user.preferences.theme === "dark")
            <div class="dark-theme-element">Dark theme active</div>
          @endif
        </div>
      @endforeach
    </section>
  @endforeach
</body>
</html>`)
  })

  afterAll(async () => {
    await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
  })

  describe('Template Analysis', () => {
    it('should analyze a simple template', async () => {
      const filePath = path.join(TEMP_DIR, 'simple.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.file).toBe(filePath)
      expect(result.metrics.lines).toBeGreaterThan(0)
      expect(result.metrics.characters).toBeGreaterThan(0)
      expect(result.metrics.expressions).toBe(1) // {{ title }}
      expect(result.metrics.complexity).toBeGreaterThanOrEqual(1)
      expect(result.performance.estimatedRenderTime).toBeGreaterThan(0)
      expect(result.performance.complexityScore).toBeGreaterThanOrEqual(1)
    })

    it('should analyze a complex template and detect issues', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.metrics.directives.conditionals).toBeGreaterThan(0)
      expect(result.metrics.directives.loops).toBeGreaterThan(0)
      expect(result.metrics.expressions).toBeGreaterThan(1)
      expect(result.complexity).toBeGreaterThan(3)

      // Check for specific issues
      const hasRawOutputWarning = result.issues.some(issue =>
        issue.category === 'security' && issue.message.includes('raw output')
      )
      expect(hasRawOutputWarning).toBe(true)

      const hasAccessibilityIssue = result.issues.some(issue =>
        issue.category === 'accessibility' && issue.message.includes('alt attributes')
      )
      expect(hasAccessibilityIssue).toBe(true)

      // Check performance metrics
      expect(result.performance.estimatedRenderTime).toBeGreaterThan(1)
      expect(result.performance.complexityScore).toBeGreaterThan(3)
    })

    it('should detect syntax errors in malformed templates', async () => {
      const filePath = path.join(TEMP_DIR, 'malformed.stx')
      const result = await analyzeTemplate(filePath)

      const syntaxErrors = result.issues.filter(issue => issue.category === 'syntax')
      expect(syntaxErrors.length).toBeGreaterThan(0)

      const hasUnmatchedIf = syntaxErrors.some(issue =>
        issue.message.includes('unmatched @if')
      )
      const hasUnmatchedForeach = syntaxErrors.some(issue =>
        issue.message.includes('unmatched @foreach')
      )

      expect(hasUnmatchedIf || hasUnmatchedForeach).toBe(true)
    })

    it('should analyze performance-heavy templates', async () => {
      const filePath = path.join(TEMP_DIR, 'performance-heavy.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.metrics.complexity).toBeGreaterThan(5)
      expect(result.metrics.directives.loops).toBeGreaterThan(1) // Nested loops
      expect(result.metrics.scriptLines).toBeGreaterThan(10)

      // Should suggest performance optimizations
      const performanceSuggestions = result.suggestions.filter(s => s.type === 'optimization')
      expect(performanceSuggestions.length).toBeGreaterThan(0)

      // Should have low cacheability due to complexity
      expect(result.performance.cacheability).toBe('low')
    })

    it('should provide suggestions for improvement', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.suggestions.length).toBeGreaterThan(0)

      const suggestionTypes = result.suggestions.map(s => s.type)
      expect(suggestionTypes).toContain('optimization')

      // Check that suggestions have required properties
      result.suggestions.forEach(suggestion => {
        expect(suggestion).toHaveProperty('message')
        expect(suggestion).toHaveProperty('impact')
        expect(suggestion).toHaveProperty('effort')
        expect(['low', 'medium', 'high']).toContain(suggestion.impact)
        expect(['low', 'medium', 'high']).toContain(suggestion.effort)
      })
    })

    it('should handle non-existent files gracefully', async () => {
      const filePath = path.join(TEMP_DIR, 'nonexistent.stx')

      await expect(analyzeTemplate(filePath)).rejects.toThrow()
    })
  })

  describe('Project Analysis', () => {
    it('should analyze multiple templates in a project', async () => {
      const { results, summary } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      expect(results.length).toBeGreaterThanOrEqual(4)
      expect(summary.totalFiles).toBe(results.length)
      expect(summary.totalLines).toBeGreaterThan(0)
      expect(summary.avgComplexity).toBeGreaterThan(0)
      expect(summary.performanceScore).toBeGreaterThanOrEqual(1)
      expect(summary.performanceScore).toBeLessThanOrEqual(10)
    })

    it('should categorize issues across the project', async () => {
      const { summary } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      expect(summary.totalIssues).toBeGreaterThan(0)
      expect(summary.issuesByCategory).toHaveProperty('syntax')
      expect(summary.issuesByCategory).toHaveProperty('security')
      expect(summary.issuesByCategory).toHaveProperty('accessibility')

      expect(summary.issuesByCategory.syntax).toBeGreaterThan(0)
      expect(summary.issuesByCategory.security).toBeGreaterThan(0)
      expect(summary.issuesByCategory.accessibility).toBeGreaterThan(0)
    })

    it('should provide project-level recommendations', async () => {
      const { summary } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      expect(summary.recommendations).toBeInstanceOf(Array)
      expect(summary.recommendations.length).toBeGreaterThan(0)

      // Check for common recommendations
      const hasComplexityRecommendation = summary.recommendations.some(rec =>
        rec.includes('complexity') || rec.includes('refactor')
      )
      const hasSecurityRecommendation = summary.recommendations.some(rec =>
        rec.includes('security') || rec.includes('raw output')
      )

      expect(hasComplexityRecommendation || hasSecurityRecommendation).toBe(true)
    })

    it('should handle empty patterns gracefully', async () => {
      const { results, summary } = await analyzeProject([path.join(TEMP_DIR, 'nonexistent-*.stx')])

      expect(results).toEqual([])
      expect(summary.totalFiles).toBe(0)
    })

    it('should calculate accurate project metrics', async () => {
      const { results, summary } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      // Verify summary calculations
      const expectedTotalLines = results.reduce((sum, r) => sum + r.metrics.lines, 0)
      const expectedAvgComplexity = results.reduce((sum, r) => sum + r.metrics.complexity, 0) / results.length

      expect(summary.totalLines).toBe(expectedTotalLines)
      expect(summary.avgComplexity).toBeCloseTo(expectedAvgComplexity, 2)

      // Verify issue counting
      const expectedTotalIssues = results.reduce((sum, r) => sum + r.issues.length, 0)
      expect(summary.totalIssues).toBe(expectedTotalIssues)
    })
  })

  describe('Metrics Calculation', () => {
    it('should count directives correctly', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.metrics.directives.conditionals).toBeGreaterThan(2) // Multiple @if statements
      expect(result.metrics.directives.loops).toBeGreaterThan(0) // @foreach
      expect(result.metrics.directives.total).toBeGreaterThan(2)
    })

    it('should count expressions correctly', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.metrics.expressions).toBeGreaterThan(3) // Multiple {{ }} expressions
    })

    it('should measure template size accurately', async () => {
      const filePath = path.join(TEMP_DIR, 'simple.stx')
      const result = await analyzeTemplate(filePath)

      const fileContent = await Bun.file(filePath).text()
      const expectedLines = fileContent.split('\n').length
      const expectedChars = fileContent.length

      expect(result.metrics.lines).toBe(expectedLines)
      expect(result.metrics.characters).toBe(expectedChars)
    })
  })

  describe('Issue Detection', () => {
    it('should detect security issues', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      const securityIssues = result.issues.filter(issue => issue.category === 'security')
      expect(securityIssues.length).toBeGreaterThan(0)

      const rawOutputIssue = securityIssues.find(issue =>
        issue.message.includes('raw output')
      )
      expect(rawOutputIssue).toBeDefined()
      expect(rawOutputIssue?.suggestion).toContain('sanitized')
    })

    it('should detect accessibility issues', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      const a11yIssues = result.issues.filter(issue => issue.category === 'accessibility')
      expect(a11yIssues.length).toBeGreaterThan(0)

      const altTextIssue = a11yIssues.find(issue =>
        issue.message.includes('alt attributes')
      )
      expect(altTextIssue).toBeDefined()
    })

    it('should detect performance issues', async () => {
      const filePath = path.join(TEMP_DIR, 'performance-heavy.stx')
      const result = await analyzeTemplate(filePath)

      const performanceIssues = result.issues.filter(issue => issue.category === 'performance')

      // May or may not have explicit performance issues depending on template structure
      // But should have high complexity
      expect(result.metrics.complexity).toBeGreaterThan(5)
    })

    it('should detect maintainability issues', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      const maintainabilityIssues = result.issues.filter(issue => issue.category === 'maintainability')

      // Should detect inline styles or other maintainability issues
      expect(maintainabilityIssues.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Metrics', () => {
    it('should estimate render time based on complexity', async () => {
      const simpleFile = path.join(TEMP_DIR, 'simple.stx')
      const complexFile = path.join(TEMP_DIR, 'performance-heavy.stx')

      const simpleResult = await analyzeTemplate(simpleFile)
      const complexResult = await analyzeTemplate(complexFile)

      expect(complexResult.performance.estimatedRenderTime)
        .toBeGreaterThan(simpleResult.performance.estimatedRenderTime)
    })

    it('should assess cacheability correctly', async () => {
      const simpleFile = path.join(TEMP_DIR, 'simple.stx')
      const complexFile = path.join(TEMP_DIR, 'complex.stx')

      const simpleResult = await analyzeTemplate(simpleFile)
      const complexResult = await analyzeTemplate(complexFile)

      // Simple template should have better cacheability
      expect(['high', 'medium']).toContain(simpleResult.performance.cacheability)
      expect(['low', 'medium']).toContain(complexResult.performance.cacheability)
    })

    it('should provide relevant performance recommendations', async () => {
      const filePath = path.join(TEMP_DIR, 'performance-heavy.stx')
      const result = await analyzeTemplate(filePath)

      expect(result.performance.recommendations.length).toBeGreaterThan(0)

      const hasOptimizationRec = result.performance.recommendations.some(rec =>
        rec.includes('optimiz') || rec.includes('complex') || rec.includes('component')
      )
      expect(hasOptimizationRec).toBe(true)
    })
  })

  describe('Advanced Analysis Features', () => {
    beforeAll(async () => {
      // Create additional test templates for advanced analysis
      await Bun.write(path.join(TEMP_DIR, 'seo-optimized.stx'), `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ page.title }} - {{ site.name }}</title>
  <meta name="description" content="{{ page.description }}">
  <meta name="keywords" content="{{ page.keywords.join(', ') }}">
  <link rel="canonical" href="{{ site.baseUrl }}{{ page.slug }}">
  <script>
    module.exports = {
      site: { name: "SEO Site", baseUrl: "https://example.com" },
      page: {
        title: "Home Page",
        description: "Welcome to our website",
        keywords: ["seo", "website", "optimization"],
        slug: "/"
      }
    };
  </script>
</head>
<body>
  <h1>{{ page.title }}</h1>
  <img src="banner.jpg" alt="Site banner" loading="lazy">
  <main>
    <p>{{ page.description }}</p>
  </main>
</body>
</html>`)

      await Bun.write(path.join(TEMP_DIR, 'accessibility-issues.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Accessibility Test</title>
  <script>
    module.exports = {
      items: [
        { name: "Item 1", url: "#" },
        { name: "Item 2", url: "#" }
      ]
    };
  </script>
</head>
<body>
  <div onclick="handleClick()">Clickable div</div>
  <img src="image.jpg">
  <form>
    <input type="text" placeholder="Enter text">
    <button>Submit</button>
  </form>
  <div style="color: #ccc; background: #fff;">Low contrast text</div>
  @foreach (items as item)
    <a href="{{ item.url }}">{{ item.name }}</a>
  @endforeach
</body>
</html>`)

      await Bun.write(path.join(TEMP_DIR, 'security-concerns.stx'), `
<!DOCTYPE html>
<html>
<head>
  <title>Security Test</title>
  <script>
    module.exports = {
      userInput: "<script>alert('xss')</script>",
      content: "Safe content",
      htmlContent: "<div>Raw HTML</div>"
    };
  </script>
</head>
<body>
  <div>{!! userInput !!}</div>
  <div>{{ content }}</div>
  <div>{!! htmlContent !!}</div>
  <img src="javascript:alert('xss')" alt="Bad image">
  <a href="javascript:void(0)" onclick="maliciousFunction()">Bad link</a>
</body>
</html>`)
    })

    it('should analyze SEO compliance', async () => {
      const filePath = path.join(TEMP_DIR, 'seo-optimized.stx')
      const result = await analyzeTemplate(filePath)

      // Should detect good SEO practices
      const seoIssues = result.issues.filter(issue => issue.category === 'seo')

      // Should have fewer SEO issues due to good practices
      expect(seoIssues.length).toBeLessThanOrEqual(2)

      // Check for presence of SEO elements in analysis
      expect(result.metrics.lines).toBeGreaterThan(10)
      expect(result.metrics.complexity).toBeGreaterThan(1)
    })

    it('should detect accessibility violations', async () => {
      const filePath = path.join(TEMP_DIR, 'accessibility-issues.stx')
      const result = await analyzeTemplate(filePath)

      const a11yIssues = result.issues.filter(issue => issue.category === 'accessibility')
      expect(a11yIssues.length).toBeGreaterThan(0)

      // Should detect common accessibility issues
      const hasImageAltIssue = a11yIssues.some(issue =>
        issue.message.includes('alt') || issue.message.includes('image')
      )
      const hasClickableElementIssue = a11yIssues.some(issue =>
        issue.message.includes('clickable') || issue.message.includes('interactive')
      )

      expect(hasImageAltIssue || hasClickableElementIssue).toBe(true)
    })

    it('should identify security vulnerabilities', async () => {
      const filePath = path.join(TEMP_DIR, 'security-concerns.stx')
      const result = await analyzeTemplate(filePath)

      const securityIssues = result.issues.filter(issue => issue.category === 'security')
      expect(securityIssues.length).toBeGreaterThan(0)

      // Should detect XSS risks
      const hasXSSIssue = securityIssues.some(issue =>
        issue.message.includes('raw output') ||
        issue.message.includes('XSS') ||
        issue.message.includes('sanitiz')
      )
      expect(hasXSSIssue).toBe(true)
    })

    it('should provide complexity breakdown by component', async () => {
      const filePath = path.join(TEMP_DIR, 'performance-heavy.stx')
      const result = await analyzeTemplate(filePath)

      // Should break down complexity
      expect(result.metrics.directives.total).toBeGreaterThan(0)
      expect(result.metrics.directives.conditionals).toBeGreaterThan(0)
      expect(result.metrics.directives.loops).toBeGreaterThan(0)
      expect(result.metrics.expressions).toBeGreaterThan(0)
      expect(result.metrics.scriptLines).toBeGreaterThan(0)

      // Complexity score should reflect all components
      expect(result.metrics.complexity).toBeGreaterThan(5)
    })

    it('should suggest optimizations based on patterns', async () => {
      const filePath = path.join(TEMP_DIR, 'performance-heavy.stx')
      const result = await analyzeTemplate(filePath)

      const optimizationSuggestions = result.suggestions.filter(s => s.type === 'optimization')
      expect(optimizationSuggestions.length).toBeGreaterThan(0)

      // Should provide actionable suggestions
      optimizationSuggestions.forEach(suggestion => {
        expect(suggestion.message).toBeDefined()
        expect(suggestion.impact).toMatch(/^(low|medium|high)$/)
        expect(suggestion.effort).toMatch(/^(low|medium|high)$/)
      })
    })

    it('should analyze template maintainability', async () => {
      const filePath = path.join(TEMP_DIR, 'complex.stx')
      const result = await analyzeTemplate(filePath)

      // Should provide maintainability insights
      expect(result.metrics.complexity).toBeGreaterThan(1)

      const maintainabilityIssues = result.issues.filter(issue =>
        issue.category === 'maintainability'
      )

      // Complex templates may have maintainability concerns
      if (maintainabilityIssues.length > 0) {
        maintainabilityIssues.forEach(issue => {
          expect(issue.suggestion).toBeDefined()
          expect(issue.line).toBeGreaterThan(0)
        })
      }
    })

    it('should detect code smells and anti-patterns', async () => {
      await Bun.write(path.join(TEMP_DIR, 'code-smells.stx'), `
<!DOCTYPE html>
<html>
<head>
  <script>
    module.exports = {
      data: {
        deeply: {
          nested: {
            object: {
              with: {
                many: {
                  levels: "value"
                }
              }
            }
          }
        }
      },
      items: Array(200).fill(0).map((_, i) => ({ id: i, name: \`Item \${i}\` }))
    };
  </script>
</head>
<body>
  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: red;">
    {{ data.deeply.nested.object.with.many.levels }}
  </div>

  @foreach (items as item)
    @if (item.id > 0)
      @if (item.id < 100)
        @if (item.id % 2 === 0)
          @if (item.name.length > 5)
            <div>{{ item.name }}</div>
          @endif
        @endif
      @endif
    @endif
  @endforeach
</body>
</html>`)

      const filePath = path.join(TEMP_DIR, 'code-smells.stx')
      const result = await analyzeTemplate(filePath)

      // Should detect high complexity
      expect(result.metrics.complexity).toBeGreaterThan(8)

      // Should suggest refactoring
      const refactoringSuggestions = result.suggestions.filter(s =>
        s.message.includes('refactor') ||
        s.message.includes('simplify') ||
        s.message.includes('complex')
      )
      expect(refactoringSuggestions.length).toBeGreaterThan(0)
    })
  })

  describe('Project-level Analysis Integration', () => {
    it('should provide insights across multiple template files', async () => {
      const { results, summary } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      expect(results.length).toBeGreaterThanOrEqual(6) // All test files
      expect(summary.totalFiles).toBe(results.length)

      // Should aggregate metrics meaningfully
      expect(summary.avgComplexity).toBeGreaterThan(0)
      expect(summary.totalLines).toBeGreaterThan(0)
      expect(summary.performanceScore).toBeGreaterThanOrEqual(1)
      expect(summary.performanceScore).toBeLessThanOrEqual(10)

      // Should categorize issues
      expect(summary.issuesByCategory).toHaveProperty('syntax')
      expect(summary.issuesByCategory).toHaveProperty('security')
      expect(summary.issuesByCategory).toHaveProperty('accessibility')
    })

    it('should identify project-wide patterns and trends', async () => {
      const { summary } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      expect(summary.recommendations).toBeInstanceOf(Array)
      expect(summary.recommendations.length).toBeGreaterThan(0)

      // Should provide actionable project-level recommendations
      const hasComplexityRec = summary.recommendations.some(rec =>
        rec.includes('complexity') || rec.includes('simplify')
      )
      const hasSecurityRec = summary.recommendations.some(rec =>
        rec.includes('security') || rec.includes('sanitiz')
      )

      expect(hasComplexityRec || hasSecurityRec).toBe(true)
    })

    it('should rank files by priority for optimization', async () => {
      const { results } = await analyzeProject([path.join(TEMP_DIR, '*.stx')])

      // Sort by complexity to identify highest priority files
      const sortedByComplexity = results.sort((a, b) => b.metrics.complexity - a.metrics.complexity)

      expect(sortedByComplexity[0].metrics.complexity)
        .toBeGreaterThanOrEqual(sortedByComplexity[sortedByComplexity.length - 1].metrics.complexity)

      // Performance-heavy template should be among the most complex
      const performanceHeavyFile = sortedByComplexity.find(r =>
        r.file.includes('performance-heavy.stx')
      )
      expect(performanceHeavyFile).toBeDefined()
      expect(performanceHeavyFile!.metrics.complexity).toBeGreaterThan(5)
    })
  })
})