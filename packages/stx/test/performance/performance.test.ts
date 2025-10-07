/* eslint-disable no-console */
import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { clearOnceStore } from '../../src/includes'
import { processDirectives } from '../../src/process'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'perf-temp')

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: path.join(TEMP_DIR, 'components'),
  partialsDir: path.join(TEMP_DIR, 'partials'),
}

// Helper function to process a template and measure performance
async function benchmarkTemplate(template: string, context: Record<string, any> = {}, iterations: number = 1000): Promise<{ avgTime: number, totalTime: number, opsPerSecond: number }> {
  const dependencies = new Set<string>()

  // Warm up
  for (let i = 0; i < 10; i++) {
    await processDirectives(template, context, path.join(TEMP_DIR, 'benchmark.stx'), defaultOptions, dependencies)
  }

  // Benchmark
  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    await processDirectives(template, context, path.join(TEMP_DIR, 'benchmark.stx'), defaultOptions, dependencies)
  }

  const endTime = performance.now()
  const totalTime = endTime - startTime
  const avgTime = totalTime / iterations
  const opsPerSecond = (iterations / totalTime) * 1000

  return { avgTime, totalTime, opsPerSecond }
}

// Helper to generate large datasets
function generateLargeDataset(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    description: `This is item ${i} with some description text that adds bulk`,
    category: `Category ${i % 10}`,
    price: Math.round(Math.random() * 1000 * 100) / 100,
    tags: Array.from({ length: 5 }, (_, j) => `tag${i}-${j}`),
    metadata: {
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      version: Math.floor(Math.random() * 100),
    },
  }))
}

describe('Performance Tests', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(path.join(TEMP_DIR, 'components'), { recursive: true })
    await fs.promises.mkdir(path.join(TEMP_DIR, 'partials'), { recursive: true })

    // Create performance test partials
    await Bun.write(path.join(TEMP_DIR, 'partials', 'item.stx'), `
      <div class="item" data-id="{{ id }}">
        <h3>{{ name }}</h3>
        <p>{{ description }}</p>
        <span class="category">{{ category }}</span>
        <span class="price">\${{ price }}</span>
        <div class="tags">
          @foreach(tags as tag)
            <span class="tag">{{ tag }}</span>
          @endforeach
        </div>
      </div>
    `)

    await Bun.write(path.join(TEMP_DIR, 'partials', 'card.stx'), `
      <div class="card">
        <div class="card-header">
          <h4>{{ title }}</h4>
          @if(subtitle)
            <p class="subtitle">{{ subtitle }}</p>
          @endif
        </div>
        <div class="card-body">
          {{ content }}
        </div>
        @if(footer)
          <div class="card-footer">{{ footer }}</div>
        @endif
      </div>
    `)
  })

  afterAll(async () => {
    try {
      await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
    }
    catch {
      // Ignore cleanup errors
    }
  })

  describe('Basic Template Performance', () => {
    test('should process simple expressions extremely fast', async () => {
      const template = `
        <div>
          <h1>{{ title }}</h1>
          <p>{{ content }}</p>
          <span>{{ count }}</span>
        </div>
      `

      const context = {
        title: 'Performance Test',
        content: 'This is a performance test',
        count: 42,
      }

      const result = await benchmarkTemplate(template, context, 10000)

      expect(result.avgTime).toBeLessThan(0.1) // Less than 0.1ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(10000) // More than 10k ops/sec

      console.log(`Simple expressions: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })

    test('should process conditionals extremely fast', async () => {
      const template = `
        @if(showTitle)
          <h1>{{ title }}</h1>
        @endif
        @if(showContent)
          <p>{{ content }}</p>
        @else
          <p>No content available</p>
        @endif
        @unless(hideFooter)
          <footer>{{ footerText }}</footer>
        @endunless
      `

      const context = {
        showTitle: true,
        showContent: true,
        hideFooter: false,
        title: 'Performance Test',
        content: 'Content here',
        footerText: 'Footer text',
      }

      const result = await benchmarkTemplate(template, context, 5000)

      expect(result.avgTime).toBeLessThan(0.2) // Less than 0.2ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(5000) // More than 5k ops/sec

      console.log(`Conditionals: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })

    test('should process switch statements extremely fast', async () => {
      const template = `
        @switch(userRole)
          @case('admin')
            <div class="admin-panel">Admin Panel</div>
          @case('editor')
            <div class="editor-panel">Editor Panel</div>
          @case('user')
            <div class="user-panel">User Panel</div>
          @default
            <div class="guest-panel">Guest Panel</div>
        @endswitch
      `

      const context = { userRole: 'admin' }

      const result = await benchmarkTemplate(template, context, 5000)

      expect(result.avgTime).toBeLessThan(0.3) // Less than 0.3ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(3000) // More than 3k ops/sec

      console.log(`Switch statements: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })
  })

  describe('Loop Performance', () => {
    test('should process small loops extremely fast', async () => {
      const template = `
        <ul>
          @foreach(items as item)
            <li>{{ item.name }} - {{ item.value }}</li>
          @endforeach
        </ul>
      `

      const context = {
        items: Array.from({ length: 100 }, (_, i) => ({ name: `Item ${i}`, value: i * 2 })),
      }

      const result = await benchmarkTemplate(template, context, 1000)

      expect(result.avgTime).toBeLessThan(1) // Less than 1ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(1000) // More than 1k ops/sec

      console.log(`Small loops (100 items): ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })

    test('should process medium loops efficiently', async () => {
      const template = `
        <div class="items-grid">
          @foreach(items as item)
            <div class="item">
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
              @if(item.featured)
                <span class="featured">Featured</span>
              @endif
              <span class="price">\${{ item.price }}</span>
            </div>
          @endforeach
        </div>
      `

      const context = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          name: `Product ${i}`,
          description: `Description for product ${i}`,
          featured: i % 10 === 0,
          price: (Math.random() * 100).toFixed(2),
        })),
      }

      const result = await benchmarkTemplate(template, context, 100)

      expect(result.avgTime).toBeLessThan(15) // Less than 15ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(80) // More than 80 ops/sec

      console.log(`Medium loops (1000 items): ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })
  })

  describe('Complex Template Performance', () => {
    test('should process complex nested templates efficiently', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>{{ pageTitle }}</title>
          @if(isDevelopment)
            <script src="/debug.js"></script>
          @endif
        </head>
        <body>
          <header>
            <nav>
              @foreach(navigation as nav)
                <a href="{{ nav.url }}" @if(nav.active)class="active"@endif>{{ nav.title }}</a>
              @endforeach
            </nav>
          </header>

          <main>
            @switch(pageType)
              @case('dashboard')
                <section class="dashboard">
                  <h1>Dashboard</h1>
                  @foreach(widgets as widget)
                    <div class="widget widget-{{ widget.type }}">
                      <h3>{{ widget.title }}</h3>
                      <div class="widget-content">
                        @if(widget.type === 'chart')
                          <canvas data-chart="{{ widget.data }}"></canvas>
                        @elseif(widget.type === 'list')
                          <ul>
                            @foreach(widget.items as item)
                              <li>{{ item.text }} @if(item.count)({{ item.count }})@endif</li>
                            @endforeach
                          </ul>
                        @else
                          <p>{{ widget.content }}</p>
                        @endif
                      </div>
                    </div>
                  @endforeach
                </section>
              @case('profile')
                <section class="profile">
                  <h1>{{ user.name }}</h1>
                  <div class="user-details">
                    <p>Email: {{ user.email }}</p>
                    <p>Role: {{ user.role }}</p>
                    @if(user.avatar)
                      <img src="{{ user.avatar }}" alt="Avatar">
                    @endif
                  </div>
                </section>
              @default
                <section class="home">
                  <h1>{{ pageTitle }}</h1>
                  <p>{{ content }}</p>
                </section>
            @endswitch
          </main>

          <footer>
            <p>&copy; {{ currentYear }} {{ siteName }}</p>
          </footer>
        </body>
        </html>
      `

      const context = {
        pageTitle: 'Complex App',
        pageType: 'dashboard',
        isDevelopment: false,
        siteName: 'stx Demo',
        currentYear: 2024,
        navigation: [
          { title: 'Home', url: '/', active: false },
          { title: 'Dashboard', url: '/dashboard', active: true },
          { title: 'Profile', url: '/profile', active: false },
        ],
        widgets: [
          {
            type: 'chart',
            title: 'Analytics',
            data: JSON.stringify({ views: 1000, clicks: 50 }),
          },
          {
            type: 'list',
            title: 'Recent Items',
            items: [
              { text: 'Item 1', count: 5 },
              { text: 'Item 2', count: 3 },
              { text: 'Item 3' },
            ],
          },
          {
            type: 'text',
            title: 'Status',
            content: 'All systems operational',
          },
        ],
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'admin',
          avatar: '/avatar.jpg',
        },
        content: 'Welcome to the app',
      }

      const result = await benchmarkTemplate(template, context, 100)

      expect(result.avgTime).toBeLessThan(5) // Less than 5ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(200) // More than 200 ops/sec

      console.log(`Complex nested templates: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })
  })

  describe('Stress Tests', () => {
    test('should handle large datasets without performance degradation', async () => {
      const template = `
        <div class="products">
          @foreach(products as product)
            <div class="product" data-id="{{ product.id }}">
              <h3>{{ product.name }}</h3>
              <p>{{ product.description }}</p>
              <div class="meta">
                <span>Category: {{ product.category }}</span>
                <span>Price: \${{ product.price }}</span>
                <span>Created: {{ product.metadata.created }}</span>
              </div>
              <div class="tags">
                @foreach(product.tags as tag)
                  <span class="tag">{{ tag }}</span>
                @endforeach
              </div>
            </div>
          @endforeach
        </div>
      `

      const largeDataset = generateLargeDataset(5000)
      const context = { products: largeDataset }

      const result = await benchmarkTemplate(template, context, 10)

      expect(result.avgTime).toBeLessThan(150) // Less than 150ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(8) // More than 8 ops/sec

      console.log(`Large dataset (5000 items): ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })

    test('should handle extremely large datasets', async () => {
      const template = `
        <div class="items-container">
          <h1>{{ totalItems }} Total Items</h1>
          @foreach(items as item)
            <div class="item-{{ item.id }}">{{ item.name }}</div>
          @endforeach
        </div>
      `

      const extremeDataset = Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
      }))

      const context = {
        items: extremeDataset,
        totalItems: extremeDataset.length,
      }

      const startTime = performance.now()
      const dependencies = new Set<string>()
      await processDirectives(template, context, path.join(TEMP_DIR, 'stress.stx'), defaultOptions, dependencies)
      const endTime = performance.now()

      const processingTime = endTime - startTime

      expect(processingTime).toBeLessThan(1000) // Less than 1 second for 50k items

      console.log(`Extreme dataset (50000 items): ${processingTime.toFixed(2)}ms total time`)
    })

    test('should handle deeply nested conditionals efficiently', async () => {
      const template = `
        @if(level1)
          <div class="level1">
            @if(level2)
              <div class="level2">
                @if(level3)
                  <div class="level3">
                    @if(level4)
                      <div class="level4">
                        @if(level5)
                          <div class="level5">
                            @foreach(items as item)
                              @if(item.visible)
                                @switch(item.type)
                                  @case('important')
                                    <span class="important">{{ item.text }}</span>
                                  @case('normal')
                                    <span class="normal">{{ item.text }}</span>
                                  @default
                                    <span class="default">{{ item.text }}</span>
                                @endswitch
                              @endif
                            @endforeach
                          </div>
                        @endif
                      </div>
                    @endif
                  </div>
                @endif
              </div>
            @endif
          </div>
        @endif
      `

      const context = {
        level1: true,
        level2: true,
        level3: true,
        level4: true,
        level5: true,
        items: Array.from({ length: 1000 }, (_, i) => ({
          text: `Item ${i}`,
          visible: i % 2 === 0,
          type: i % 3 === 0 ? 'important' : i % 2 === 0 ? 'normal' : 'other',
        })),
      }

      const result = await benchmarkTemplate(template, context, 100)

      expect(result.avgTime).toBeLessThan(20) // Less than 20ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(50) // More than 50 ops/sec

      console.log(`Deeply nested conditionals: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })
  })

  describe('Memory Efficiency Tests', () => {
    test('should not leak memory during repeated processing', async () => {
      const template = `
        <div>
          @foreach(items as item)
            <p>{{ item.text }} - {{ item.id }}</p>
          @endforeach
        </div>
      `

      const initialMemory = process.memoryUsage().heapUsed

      // Process many templates
      for (let i = 0; i < 1000; i++) {
        const context = {
          items: Array.from({ length: 100 }, (_, j) => ({
            id: i * 100 + j,
            text: `Item ${i}-${j}`,
          })),
        }
        const dependencies = new Set<string>()
        await processDirectives(template, context, path.join(TEMP_DIR, 'memory.stx'), defaultOptions, dependencies)

        // Force garbage collection periodically
        if (i % 100 === 0 && globalThis.gc) {
          globalThis.gc()
        }
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024 // MB

      // Should not increase by more than 50MB (generous threshold)
      expect(memoryIncrease).toBeLessThan(50)

      console.log(`Memory increase after 1000 iterations: ${memoryIncrease.toFixed(2)}MB`)
    })

    test('should handle @once directive efficiently', async () => {
      clearOnceStore() // Start fresh

      const template = `
        @once
          <link rel="stylesheet" href="/styles.css">
          <script src="/app.js"></script>
        @endonce

        <div>{{ content }}</div>

        @once
          <link rel="stylesheet" href="/styles.css">
          <script src="/app.js"></script>
        @endonce
      `

      const context = { content: 'Page content' }

      const result = await benchmarkTemplate(template, context, 1000)

      expect(result.avgTime).toBeLessThan(0.5) // Less than 0.5ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(2000) // More than 2k ops/sec

      console.log(`@once directive: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })
  })

  describe('Real-World Performance Scenarios', () => {
    test('should render e-commerce product listing extremely fast', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>{{ store.name }} - {{ category.name }}</title>
          <meta name="description" content="{{ category.description }}">
        </head>
        <body>
          <header>
            <h1>{{ store.name }}</h1>
            <nav>
              @foreach(categories as cat)
                <a href="/category/{{ cat.slug }}" @if(cat.id === category.id)class="active"@endif>
                  {{ cat.name }}
                </a>
              @endforeach
            </nav>
          </header>

          <main>
            <h2>{{ category.name }}</h2>
            <div class="filters">
              @foreach(filters as filter)
                <div class="filter-group">
                  <h4>{{ filter.name }}</h4>
                  @foreach(filter.options as option)
                    <label>
                      <input type="checkbox" value="{{ option.value }}">
                      {{ option.label }} ({{ option.count }})
                    </label>
                  @endforeach
                </div>
              @endforeach
            </div>

            <div class="products-grid">
              @foreach(products as product)
                <div class="product-card">
                  <img src="{{ product.image }}" alt="{{ product.name }}">
                  <h3>{{ product.name }}</h3>
                  <p class="description">{{ product.description }}</p>
                  <div class="price">
                    @if(product.salePrice)
                      <span class="sale-price">\${{ product.salePrice }}</span>
                      <span class="original-price">\${{ product.originalPrice }}</span>
                    @else
                      <span class="price">\${{ product.price }}</span>
                    @endif
                  </div>
                  <div class="rating">
                    @for(let i = 1; i <= 5; i++)
                      @if(i <= product.rating)
                        <span class="star filled">★</span>
                      @else
                        <span class="star">☆</span>
                      @endif
                    @endfor
                    <span class="rating-count">({{ product.reviewCount }})</span>
                  </div>
                  <button class="add-to-cart" data-product-id="{{ product.id }}">
                    Add to Cart
                  </button>
                </div>
              @endforeach
            </div>

            @if(pagination.hasPages)
              <div class="pagination">
                @if(pagination.hasPrevious)
                  <a href="?page={{ pagination.previousPage }}">&laquo; Previous</a>
                @endif

                @foreach(pagination.pages as page)
                  @if(page.isCurrent)
                    <span class="current">{{ page.number }}</span>
                  @else
                    <a href="?page={{ page.number }}">{{ page.number }}</a>
                  @endif
                @endforeach

                @if(pagination.hasNext)
                  <a href="?page={{ pagination.nextPage }}">Next &raquo;</a>
                @endif
              </div>
            @endif
          </main>
        </body>
        </html>
      `

      const context = {
        store: { name: 'stx Store' },
        category: { id: 1, name: 'Electronics', description: 'Latest electronics', slug: 'electronics' },
        categories: [
          { id: 1, name: 'Electronics', slug: 'electronics' },
          { id: 2, name: 'Clothing', slug: 'clothing' },
          { id: 3, name: 'Books', slug: 'books' },
        ],
        filters: [
          {
            name: 'Price',
            options: [
              { value: '0-50', label: 'Under $50', count: 120 },
              { value: '50-100', label: '$50-$100', count: 80 },
              { value: '100+', label: 'Over $100', count: 45 },
            ],
          },
          {
            name: 'Brand',
            options: [
              { value: 'apple', label: 'Apple', count: 25 },
              { value: 'samsung', label: 'Samsung', count: 30 },
              { value: 'sony', label: 'Sony', count: 15 },
            ],
          },
        ],
        products: Array.from({ length: 50 }, (_, i) => ({
          id: i + 1,
          name: `Product ${i + 1}`,
          description: `This is product ${i + 1} with great features`,
          image: `/images/product-${i + 1}.jpg`,
          price: (Math.random() * 200 + 50).toFixed(2),
          salePrice: i % 3 === 0 ? (Math.random() * 150 + 30).toFixed(2) : null,
          originalPrice: i % 3 === 0 ? (Math.random() * 200 + 50).toFixed(2) : null,
          rating: Math.floor(Math.random() * 5) + 1,
          reviewCount: Math.floor(Math.random() * 100) + 1,
        })),
        pagination: {
          hasPages: true,
          hasPrevious: true,
          hasNext: true,
          previousPage: 1,
          nextPage: 3,
          pages: [
            { number: 1, isCurrent: false },
            { number: 2, isCurrent: true },
            { number: 3, isCurrent: false },
          ],
        },
      }

      const result = await benchmarkTemplate(template, context, 50)

      expect(result.avgTime).toBeLessThan(20) // Less than 20ms per operation
      expect(result.opsPerSecond).toBeGreaterThan(50) // More than 50 ops/sec

      console.log(`E-commerce listing: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    })
  })
})
