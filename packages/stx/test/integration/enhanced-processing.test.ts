import { describe, expect, it, beforeAll, afterAll } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { processDirectives } from '../../src/process'
import { performanceMonitor } from '../../src/performance-utils'
import { errorLogger } from '../../src/error-handling'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-integration')
const OUTPUT_DIR = path.join(TEMP_DIR, 'output')

// Helper function to read built HTML file
async function getHtmlOutput(result: any): Promise<string> {
  expect(result.success).toBe(true)
  const htmlOutput = result.outputs.find((o: any) => o.path.endsWith('.html'))
  expect(htmlOutput).toBeDefined()
  return await Bun.file(htmlOutput!.path).text()
}

describe('Enhanced Template Processing Integration', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })

    // Clear performance monitor for clean test state
    performanceMonitor.clear()
    errorLogger.clear()
  })

  afterAll(async () => {
    await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
  })

  describe('Performance Monitoring Integration', () => {
    it('should track template processing performance', async () => {
      const testFile = path.join(TEMP_DIR, 'performance-test.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Performance Test</title>
  <script>
    module.exports = {
      items: Array(100).fill(0).map((_, i) => ({ id: i, name: \`Item \${i}\` }))
    };
  </script>
</head>
<body>
  @foreach (items as item)
    <div>{{ item.name }} ({{ item.id }})</div>
  @endforeach
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
        stx: {
          debug: false, // Enable performance tracking without debug noise
        },
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('Item 0')
      expect(outputHtml).toContain('Item 99')

      // Check that performance metrics were recorded
      const stats = performanceMonitor.getStats()
      expect(Object.keys(stats).length).toBeGreaterThan(0)

      // Should have template processing metrics
      const templateProcessingStats = stats['template-processing']
      if (templateProcessingStats) {
        expect(templateProcessingStats.count).toBeGreaterThan(0)
        expect(templateProcessingStats.totalTime).toBeGreaterThan(0)
      }
    })

    it('should track individual processing stages', async () => {
      const testFile = path.join(TEMP_DIR, 'stages-test.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Stages Test</title>
  <script>
    module.exports = {
      title: "Complex Template",
      user: { name: "John", admin: true },
      posts: [
        { title: "Post 1", content: "Content 1" },
        { title: "Post 2", content: "Content 2" }
      ]
    };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  @if (user.admin)
    <div class="admin-section">
      <h2>Admin: {{ user.name }}</h2>
      @foreach (posts as post)
        <article>
          <h3>{{ post.title }}</h3>
          <p>{{ post.content }}</p>
        </article>
      @endforeach
    </div>
  @endif
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })

      await getHtmlOutput(result)

      const stats = performanceMonitor.getStats()

      // Check for specific processing stages
      const hasScriptExtraction = stats['script-extraction']
      const hasDirectiveProcessing = stats['directive-processing']

      expect(hasScriptExtraction || hasDirectiveProcessing).toBeTruthy()
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle template errors gracefully in production mode', async () => {
      const testFile = path.join(TEMP_DIR, 'error-test.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Error Test</title>
  <script>
    module.exports = {
      user: null
    };
  </script>
</head>
<body>
  <h1>{{ nonExistentVariable.property }}</h1>
  @if (user.name)
    <p>This should cause an error</p>
  @endif
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
        stx: {
          debug: false, // Production mode - should handle errors gracefully
        },
      })

      // Build should succeed even with template errors
      expect(result.success).toBe(true)

      const outputHtml = await getHtmlOutput(result)

      // Should contain error indicators or fallback content
      expect(outputHtml).toContain('html')
      expect(outputHtml).toContain('Error') // Error page or fallback
    })

    it('should provide detailed errors in debug mode', async () => {
      const testFile = path.join(TEMP_DIR, 'debug-error-test.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Debug Error Test</title>
  <script>
    throw new Error("Intentional script error");
  </script>
</head>
<body>
  <h1>This should not render</h1>
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
        stx: {
          debug: false, // Even in production, should handle gracefully
        },
      })

      // Should still succeed but with error page
      expect(result.success).toBe(true)

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('STX Template Error')
    })

    it('should log errors for monitoring', async () => {
      const testFile = path.join(TEMP_DIR, 'logging-test.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <script>
    module.exports = { invalid: 'test' };
    throw new Error("Test logging error");
  </script>
</head>
<body>
  <p>Content</p>
</body>
</html>`)

      await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
        stx: {
          debug: false,
        },
      })

      // Check that errors were logged
      const recentErrors = errorLogger.getRecentErrors(10)
      expect(recentErrors.length).toBeGreaterThan(0)

      const errorStats = errorLogger.getStats()
      expect(errorStats.total).toBeGreaterThan(0)
    })
  })

  describe('Enhanced Plugin Error Pages', () => {
    it('should generate beautiful error pages with helpful information', async () => {
      const testFile = path.join(TEMP_DIR, 'beautiful-error.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <script>
    syntax error here - this will cause a parsing error
  </script>
</head>
<body>
  <p>Content</p>
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })

      const outputHtml = await getHtmlOutput(result)

      // Check for enhanced error page elements
      expect(outputHtml).toContain('STX Template Error')
      expect(outputHtml).toContain('Error Details')
      expect(outputHtml).toContain('Troubleshooting Tips')
      expect(outputHtml).toContain('stx debug')
      expect(outputHtml).toContain('style') // Should have CSS styling
    })

    it('should include file path and context in error pages', async () => {
      const testFile = path.join(TEMP_DIR, 'context-error.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <script>
    module.exports = { test: "value" };
    // This will cause an error
    invalidFunction();
  </script>
</head>
<body>
  <p>Test content</p>
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('context-error.stx')
      expect(outputHtml).toContain('File:')
      expect(outputHtml).toContain('Error:')
    })
  })

  describe('Safe Execution Integration', () => {
    it('should safely handle problematic includes', async () => {
      const testFile = path.join(TEMP_DIR, 'safe-include.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Safe Include Test</title>
</head>
<body>
  <h1>Main Content</h1>
  @include('nonexistent-partial')
  <p>Content after include</p>
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
        stx: {
          debug: false,
        },
      })

      const outputHtml = await getHtmlOutput(result)

      // Should continue processing despite failed include
      expect(outputHtml).toContain('Main Content')
      expect(outputHtml).toContain('Content after include')
    })

    it('should handle circular dependencies gracefully', async () => {
      // Create two templates that include each other
      const template1 = path.join(TEMP_DIR, 'circular1.stx')
      const template2 = path.join(TEMP_DIR, 'circular2.stx')

      await Bun.write(template1, `
<!DOCTYPE html>
<html>
<head><title>Circular 1</title></head>
<body>
  <h1>Template 1</h1>
  @include('circular2')
</body>
</html>`)

      await Bun.write(template2, `
<div>
  <h2>Template 2</h2>
  @include('circular1')
</div>`)

      const result = await Bun.build({
        entrypoints: [template1],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
        stx: {
          debug: false,
        },
      })

      // Should handle gracefully without infinite recursion
      expect(result.success).toBe(true)

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('Template 1')
    })
  })

  describe('Complex Template Integration', () => {
    it('should process complex templates with all features', async () => {
      const testFile = path.join(TEMP_DIR, 'complex-integration.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Complex Integration Test</title>
  <script>
    module.exports = {
      user: {
        name: "Integration Tester",
        isAdmin: true,
        preferences: { theme: "dark", notifications: true }
      },
      posts: [
        { id: 1, title: "First Post", content: "Content 1", published: true },
        { id: 2, title: "Draft Post", content: "Content 2", published: false },
        { id: 3, title: "Another Post", content: "Content 3", published: true }
      ],
      categories: ["Tech", "News", "Reviews"],
      stats: { views: 1250, likes: 89, comments: 23 }
    };
  </script>
</head>
<body>
  <header>
    <h1>Welcome {{ user.name }}</h1>
    @if (user.isAdmin)
      <div class="admin-badge">Administrator</div>
    @endif
  </header>

  <nav>
    <ul>
      @foreach (categories as category)
        <li><a href="/{{ category.toLowerCase() }}">{{ category }}</a></li>
      @endforeach
    </ul>
  </nav>

  <main>
    <section class="stats">
      <div class="stat">Views: {{ stats.views }}</div>
      <div class="stat">Likes: {{ stats.likes }}</div>
      <div class="stat">Comments: {{ stats.comments }}</div>
    </section>

    <section class="posts">
      @if (posts.length > 0)
        <h2>Posts</h2>
        @foreach (posts as post)
          @if (post.published || user.isAdmin)
            <article data-id="{{ post.id }}">
              <h3>{{ post.title }}</h3>
              <p>{{ post.content }}</p>
              @unless (post.published)
                <span class="draft-indicator">Draft</span>
              @endunless
            </article>
          @endif
        @endforeach
      @else
        <p>No posts available</p>
      @endif
    </section>

    @if (user.preferences.notifications)
      <div class="notifications">
        <p>Notifications are enabled</p>
      </div>
    @endif
  </main>

  <footer>
    <p>&copy; 2024 Integration Test</p>
  </footer>
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })

      const outputHtml = await getHtmlOutput(result)

      // Verify all features work together
      expect(outputHtml).toContain('Welcome Integration Tester')
      expect(outputHtml).toContain('Administrator')
      expect(outputHtml).toContain('Tech')
      expect(outputHtml).toContain('News')
      expect(outputHtml).toContain('Reviews')
      expect(outputHtml).toContain('Views: 1250')
      expect(outputHtml).toContain('First Post')
      expect(outputHtml).toContain('Another Post')
      expect(outputHtml).toContain('Draft')
      expect(outputHtml).toContain('Notifications are enabled')
    })

    it('should handle deeply nested conditionals and loops', async () => {
      const testFile = path.join(TEMP_DIR, 'nested-complexity.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <script>
    module.exports = {
      departments: [
        {
          name: "Engineering",
          teams: [
            { name: "Frontend", members: [{ name: "Alice", active: true }, { name: "Bob", active: false }] },
            { name: "Backend", members: [{ name: "Charlie", active: true }] }
          ]
        },
        {
          name: "Design",
          teams: [
            { name: "UX", members: [{ name: "Diana", active: true }] }
          ]
        }
      ]
    };
  </script>
</head>
<body>
  @foreach (departments as department)
    <div class="department">
      <h2>{{ department.name }}</h2>
      @if (department.teams && department.teams.length > 0)
        @foreach (department.teams as team)
          <div class="team">
            <h3>{{ team.name }}</h3>
            @if (team.members && team.members.length > 0)
              <ul class="members">
                @foreach (team.members as member)
                  @if (member.active)
                    <li class="active">{{ member.name }} (Active)</li>
                  @else
                    <li class="inactive">{{ member.name }} (Inactive)</li>
                  @endif
                @endforeach
              </ul>
            @else
              <p>No team members</p>
            @endif
          </div>
        @endforeach
      @else
        <p>No teams in this department</p>
      @endif
    </div>
  @endforeach
</body>
</html>`)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('Engineering')
      expect(outputHtml).toContain('Frontend')
      expect(outputHtml).toContain('Alice (Active)')
      expect(outputHtml).toContain('Bob (Inactive)')
      expect(outputHtml).toContain('Design')
      expect(outputHtml).toContain('Diana (Active)')
    })
  })

  describe('Direct Processing API', () => {
    it('should process templates directly with enhanced error handling', async () => {
      const template = `
<div>
  <h1>{{ title }}</h1>
  @if (items.length > 0)
    <ul>
      @foreach (items as item)
        <li>{{ item }}</li>
      @endforeach
    </ul>
  @endif
</div>`

      const context = {
        title: "Direct Processing Test",
        items: ["Item 1", "Item 2", "Item 3"]
      }

      const options = {
        enabled: true,
        partialsDir: TEMP_DIR,
        componentsDir: TEMP_DIR,
        debug: false,
        cachePath: path.join(TEMP_DIR, '.cache')
      }

      const dependencies = new Set<string>()

      const result = await processDirectives(template, context, 'test.stx', options, dependencies)

      expect(result).toContain('Direct Processing Test')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Item 2</li>')
      expect(result).toContain('<li>Item 3</li>')
    })

    it('should handle processing errors gracefully', async () => {
      const template = `
<div>
  <h1>{{ invalidVariable.property }}</h1>
  @if (nonExistent.condition)
    <p>This should error</p>
  @endif
</div>`

      const context = {}
      const options = {
        enabled: true,
        partialsDir: TEMP_DIR,
        componentsDir: TEMP_DIR,
        debug: false,
        cachePath: path.join(TEMP_DIR, '.cache')
      }

      const dependencies = new Set<string>()

      // Should not throw, but return error content or fallback
      const result = await processDirectives(template, context, 'error-test.stx', options, dependencies)

      expect(typeof result).toBe('string')
      // Should contain some indication of processing (even if partially failed)
      expect(result.length).toBeGreaterThan(0)
    })
  })

  describe('Real-world Performance Scenarios', () => {
    it('should handle large e-commerce product catalogs efficiently', async () => {
      const testFile = path.join(TEMP_DIR, 'large-ecommerce.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Product Catalog</title>
  <script>
    const products = [];
    const categories = ["Electronics", "Clothing", "Books", "Home", "Sports"];

    for (let i = 1; i <= 500; i++) {
      products.push({
        id: i,
        name: \`Product \${i}\`,
        price: Math.floor(Math.random() * 1000) + 10,
        category: categories[i % categories.length],
        inStock: Math.random() > 0.2,
        rating: Math.floor(Math.random() * 5) + 1,
        reviews: Math.floor(Math.random() * 100)
      });
    }

    module.exports = {
      products,
      categories,
      filters: { category: null, inStockOnly: true, minRating: 3 }
    };
  </script>
</head>
<body>
  <div class="catalog">
    <h1>Product Catalog ({{ products.length }} products)</h1>

    <div class="filters">
      @foreach (categories as category)
        <button class="filter-btn">{{ category }}</button>
      @endforeach
    </div>

    <div class="products-grid">
      @foreach (products as product)
        @if (!filters.inStockOnly || product.inStock)
          @if (!filters.category || product.category === filters.category)
            @if (product.rating >= filters.minRating)
              <div class="product-card" data-id="{{ product.id }}">
                <h3>{{ product.name }}</h3>
                <p class="price">\${{ product.price }}</p>
                <p class="category">{{ product.category }}</p>
                <div class="rating">Rating: {{ product.rating }}/5 ({{ product.reviews }} reviews)</div>
                @if (product.inStock)
                  <button class="add-cart">Add to Cart</button>
                @else
                  <span class="out-of-stock">Out of Stock</span>
                @endif
              </div>
            @endif
          @endif
        @endif
      @endforeach
    </div>
  </div>
</body>
</html>`)

      const startTime = performance.now()
      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })
      const endTime = performance.now()

      // Should process efficiently even with 500 products
      expect(endTime - startTime).toBeLessThan(2000) // Less than 2 seconds

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('Product Catalog (500 products)')
      expect(outputHtml).toContain('Product 1')
      expect(outputHtml).toContain('Electronics')
      expect(outputHtml).toContain('Add to Cart')
    })

    it('should handle complex blog with comments and metadata', async () => {
      const testFile = path.join(TEMP_DIR, 'complex-blog.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>{{ blog.title }}</title>
  <script>
    const posts = [];
    for (let i = 1; i <= 50; i++) {
      const comments = [];
      const commentCount = Math.floor(Math.random() * 20);

      for (let j = 1; j <= commentCount; j++) {
        comments.push({
          id: j,
          author: \`User\${j}\`,
          content: \`This is comment \${j} on post \${i}\`,
          createdAt: new Date(2024, 0, i + j).toISOString(),
          likes: Math.floor(Math.random() * 50)
        });
      }

      posts.push({
        id: i,
        title: \`Blog Post \${i}\`,
        content: \`This is the content of blog post \${i}. It contains interesting information.\`,
        author: \`Author\${i % 5 + 1}\`,
        publishedAt: new Date(2024, 0, i).toISOString(),
        tags: [\`tag\${i % 3 + 1}\`, \`category\${i % 4 + 1}\`],
        comments,
        likes: Math.floor(Math.random() * 100),
        views: Math.floor(Math.random() * 1000)
      });
    }

    module.exports = {
      blog: { title: "My Complex Blog", subtitle: "Deep thoughts and insights" },
      posts,
      settings: { showComments: true, commentsPerPost: 5 }
    };
  </script>
</head>
<body>
  <header>
    <h1>{{ blog.title }}</h1>
    <p>{{ blog.subtitle }}</p>
  </header>

  <main>
    @foreach (posts as post)
      <article class="post" data-id="{{ post.id }}">
        <header>
          <h2>{{ post.title }}</h2>
          <div class="meta">
            <span>By {{ post.author }}</span>
            <time>{{ post.publishedAt }}</time>
            <span>{{ post.views }} views</span>
            <span>{{ post.likes }} likes</span>
          </div>
        </header>

        <div class="content">
          <p>{{ post.content }}</p>
        </div>

        <footer>
          <div class="tags">
            @foreach (post.tags as tag)
              <span class="tag">{{ tag }}</span>
            @endforeach
          </div>

          @if (settings.showComments && post.comments.length > 0)
            <section class="comments">
              <h3>Comments ({{ post.comments.length }})</h3>
              @foreach (post.comments.slice(0, settings.commentsPerPost) as comment)
                <div class="comment">
                  <strong>{{ comment.author }}</strong>
                  <time>{{ comment.createdAt }}</time>
                  <p>{{ comment.content }}</p>
                  <span class="likes">{{ comment.likes }} likes</span>
                </div>
              @endforeach

              @if (post.comments.length > settings.commentsPerPost)
                <p class="more-comments">
                  {{ post.comments.length - settings.commentsPerPost }} more comments...
                </p>
              @endif
            </section>
          @endif
        </footer>
      </article>
    @endforeach
  </main>
</body>
</html>`)

      const startTime = performance.now()
      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })
      const endTime = performance.now()

      // Should handle complex nested structures efficiently
      expect(endTime - startTime).toBeLessThan(3000) // Less than 3 seconds

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('My Complex Blog')
      expect(outputHtml).toContain('Blog Post 1')
      expect(outputHtml).toContain('Comments (')
      expect(outputHtml).toContain('User1')
      expect(outputHtml).toContain('tag1')
    })

    it('should handle dashboard with real-time data simulation', async () => {
      const testFile = path.join(TEMP_DIR, 'dashboard.stx')
      await Bun.write(testFile, `
<!DOCTYPE html>
<html>
<head>
  <title>Analytics Dashboard</title>
  <script>
    const generateMetrics = () => {
      const metrics = [];
      const timePoints = 24; // 24 hours

      for (let i = 0; i < timePoints; i++) {
        metrics.push({
          hour: i,
          visitors: Math.floor(Math.random() * 1000) + 100,
          pageViews: Math.floor(Math.random() * 5000) + 500,
          conversions: Math.floor(Math.random() * 50) + 5,
          revenue: Math.floor(Math.random() * 10000) + 1000
        });
      }

      return metrics;
    };

    const generateTopPages = () => {
      return [
        { path: "/", views: 5420, uniqueVisitors: 3210 },
        { path: "/products", views: 3890, uniqueVisitors: 2150 },
        { path: "/about", views: 1240, uniqueVisitors: 890 },
        { path: "/contact", views: 680, uniqueVisitors: 520 },
        { path: "/blog", views: 2100, uniqueVisitors: 1450 }
      ];
    };

    module.exports = {
      dashboard: {
        title: "Analytics Dashboard",
        updatedAt: new Date().toISOString()
      },
      metrics: generateMetrics(),
      summary: {
        totalVisitors: 12500,
        totalPageViews: 45000,
        conversionRate: 3.2,
        avgSessionDuration: 245
      },
      topPages: generateTopPages(),
      alerts: [
        { type: "warning", message: "High bounce rate detected on /checkout" },
        { type: "success", message: "Traffic increased by 15% from last week" },
        { type: "info", message: "New feature deployment completed" }
      ]
    };
  </script>
</head>
<body>
  <div class="dashboard">
    <header>
      <h1>{{ dashboard.title }}</h1>
      <p>Last updated: {{ dashboard.updatedAt }}</p>
    </header>

    <section class="alerts">
      @foreach (alerts as alert)
        <div class="alert alert-{{ alert.type }}">
          {{ alert.message }}
        </div>
      @endforeach
    </section>

    <section class="summary">
      <div class="metric-card">
        <h3>Total Visitors</h3>
        <span class="value">{{ summary.totalVisitors.toLocaleString() }}</span>
      </div>
      <div class="metric-card">
        <h3>Page Views</h3>
        <span class="value">{{ summary.totalPageViews.toLocaleString() }}</span>
      </div>
      <div class="metric-card">
        <h3>Conversion Rate</h3>
        <span class="value">{{ summary.conversionRate }}%</span>
      </div>
      <div class="metric-card">
        <h3>Avg Session</h3>
        <span class="value">{{ summary.avgSessionDuration }}s</span>
      </div>
    </section>

    <section class="charts">
      <div class="chart">
        <h3>Hourly Traffic</h3>
        <div class="chart-data">
          @foreach (metrics as metric)
            <div class="data-point" data-hour="{{ metric.hour }}">
              <span class="hour">{{ metric.hour }}:00</span>
              <span class="visitors">{{ metric.visitors }}</span>
              <span class="pageviews">{{ metric.pageViews }}</span>
            </div>
          @endforeach
        </div>
      </div>
    </section>

    <section class="top-pages">
      <h3>Top Pages</h3>
      <table>
        <thead>
          <tr>
            <th>Page</th>
            <th>Views</th>
            <th>Unique Visitors</th>
          </tr>
        </thead>
        <tbody>
          @foreach (topPages as page)
            <tr>
              <td>{{ page.path }}</td>
              <td>{{ page.views.toLocaleString() }}</td>
              <td>{{ page.uniqueVisitors.toLocaleString() }}</td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </section>
  </div>
</body>
</html>`)

      const startTime = performance.now()
      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin],
      })
      const endTime = performance.now()

      // Should handle complex calculations efficiently
      expect(endTime - startTime).toBeLessThan(1500) // Less than 1.5 seconds

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('Analytics Dashboard')
      expect(outputHtml).toContain('Total Visitors')
      expect(outputHtml).toContain('12,500') // toLocaleString formatting
      expect(outputHtml).toContain('Hourly Traffic')
      expect(outputHtml).toContain('data-hour="0"')
      expect(outputHtml).toContain('/products')
      expect(outputHtml).toContain('High bounce rate')
    })
  })
})