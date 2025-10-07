/* eslint-disable no-console */
import type { StxOptions } from '../../src/types'
import { describe, expect, test } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

// Helper to measure memory usage
function measureMemoryUsage() {
  if (globalThis.gc) {
    globalThis.gc()
  }
  return process.memoryUsage()
}

// Helper to generate massive datasets
function generateMassiveDataset(size: number) {
  return {
    totalCount: size,
    categories: Array.from({ length: Math.min(50, size / 100) }, (_, i) => ({
      id: i,
      name: `Category ${i}`,
      slug: `category-${i}`,
      description: `This is category ${i} with a longer description that adds more text content to test string processing performance.`,
      itemCount: Math.floor(size / 50),
    })),
    items: Array.from({ length: size }, (_, i) => ({
      id: i,
      title: `Item ${i}`,
      description: `This is a detailed description for item ${i}. It contains multiple sentences to simulate real-world content. The description includes various details about the item, its features, benefits, and other relevant information that would typically be found in a product catalog or content management system.`,
      category: `Category ${i % 50}`,
      categoryId: i % 50,
      price: Math.round(Math.random() * 10000) / 100,
      salePrice: i % 7 === 0 ? Math.round(Math.random() * 8000) / 100 : null,
      featured: i % 23 === 0,
      inStock: i % 13 !== 0,
      rating: Math.floor(Math.random() * 5) + 1,
      reviewCount: Math.floor(Math.random() * 1000),
      tags: Array.from({ length: 3 + (i % 5) }, (_, j) => `tag-${i}-${j}`),
      attributes: {
        color: ['red', 'blue', 'green', 'yellow', 'black', 'white'][i % 6],
        size: ['XS', 'S', 'M', 'L', 'XL', 'XXL'][i % 6],
        weight: Math.round(Math.random() * 1000) / 10,
        dimensions: {
          length: Math.round(Math.random() * 100),
          width: Math.round(Math.random() * 100),
          height: Math.round(Math.random() * 100),
        },
      },
      metadata: {
        created: new Date(2020 + (i % 4), (i % 12), (i % 28) + 1).toISOString(),
        updated: new Date(2023, (i % 12), (i % 28) + 1).toISOString(),
        views: Math.floor(Math.random() * 10000),
        likes: Math.floor(Math.random() * 1000),
        shares: Math.floor(Math.random() * 100),
      },
    })),
  }
}

describe('Extreme Stress Tests', () => {
  test('should handle 50,000 item dataset efficiently', async () => {
    const template = `
      <div class="mega-catalog">
        <header>
          <h1>Mega Catalog - {{ totalCount }} Items</h1>
          <div class="categories">
            @foreach(categories as category)
              <span class="category-chip">
                {{ category.name }} ({{ category.itemCount }})
              </span>
            @endforeach
          </div>
        </header>

        <div class="items-grid">
          @foreach(items as item)
            <div class="item-card" data-id="{{ item.id }}">
              <h3>{{ item.title }}</h3>
              <p class="description">{{ item.description }}</p>

              <div class="pricing">
                @if(item.salePrice)
                  <span class="sale-price">\${{ item.salePrice }}</span>
                  <span class="original-price">\${{ item.price }}</span>
                  <span class="discount">{{ Math.round((1 - item.salePrice / item.price) * 100) }}% OFF</span>
                @else
                  <span class="price">\${{ item.price }}</span>
                @endif
              </div>

              <div class="meta">
                <span class="category">{{ item.category }}</span>
                @if(item.featured)
                  <span class="featured-badge">Featured</span>
                @endif
                @if(item.inStock)
                  <span class="stock in-stock">In Stock</span>
                @else
                  <span class="stock out-of-stock">Out of Stock</span>
                @endif
              </div>

              <div class="rating">
                @for(let i = 1; i <= 5; i++)
                  @if(i <= item.rating)
                    <span class="star filled">★</span>
                  @else
                    <span class="star">☆</span>
                  @endif
                @endfor
                <span class="reviews">({{ item.reviewCount }})</span>
              </div>

              <div class="attributes">
                <span>Color: {{ item.attributes.color }}</span>
                <span>Size: {{ item.attributes.size }}</span>
                <span>Weight: {{ item.attributes.weight }}kg</span>
              </div>
            </div>
          @endforeach
        </div>
      </div>
    `

    const massiveDataset = generateMassiveDataset(50000)

    const memoryBefore = measureMemoryUsage()
    const startTime = performance.now()

    const dependencies = new Set<string>()
    const result = await processDirectives(template, massiveDataset, 'mega.stx', defaultOptions, dependencies)

    const endTime = performance.now()
    const memoryAfter = measureMemoryUsage()

    const processingTime = endTime - startTime
    const memoryUsed = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024 // MB

    // Should complete in under 3 seconds for 50k items
    expect(processingTime).toBeLessThan(3000)

    // Should not use more than 300MB of additional memory
    expect(memoryUsed).toBeLessThan(300)

    // Result should contain all items
    expect(result).toContain('50000 Items')
    expect(result.split('item-card').length - 1).toBe(50000)

    console.log(`50k items: ${processingTime.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB memory`)
  }, 10000) // 10 second timeout

  test('should handle deeply nested template structures', async () => {
    const template = `
      <div class="level-1">
        @foreach(level1Items as l1)
          <div class="level-1-item" data-id="{{ l1.id }}">
            <h2>{{ l1.title }}</h2>

            @if(l1.hasChildren)
              <div class="level-2">
                @foreach(l1.children as l2)
                  <div class="level-2-item" data-id="{{ l2.id }}">
                    <h3>{{ l2.title }}</h3>

                    @switch(l2.type)
                      @case('container')
                        <div class="level-3">
                          @foreach(l2.items as l3)
                            <div class="level-3-item">
                              <h4>{{ l3.title }}</h4>

                              @if(l3.hasDetails)
                                <div class="level-4">
                                  @foreach(l3.details as l4)
                                    <div class="level-4-item">
                                      <h5>{{ l4.name }}</h5>
                                      <p>{{ l4.description }}</p>

                                      @if(l4.hasSubItems)
                                        <div class="level-5">
                                          @foreach(l4.subItems as l5)
                                            <div class="level-5-item">
                                              <span>{{ l5.label }}: {{ l5.value }}</span>

                                              @if(l5.hasNested)
                                                <div class="level-6">
                                                  @foreach(l5.nested as l6)
                                                    <small>{{ l6.key }} = {{ l6.val }}</small>
                                                  @endforeach
                                                </div>
                                              @endif
                                            </div>
                                          @endforeach
                                        </div>
                                      @endif
                                    </div>
                                  @endforeach
                                </div>
                              @endif
                            </div>
                          @endforeach
                        </div>

                      @case('list')
                        <ul class="simple-list">
                          @foreach(l2.listItems as listItem)
                            <li>{{ listItem.text }}</li>
                          @endforeach
                        </ul>

                      @default
                        <p>{{ l2.content }}</p>
                    @endswitch
                  </div>
                @endforeach
              </div>
            @endif
          </div>
        @endforeach
      </div>
    `

    const deepNestedData = {
      level1Items: Array.from({ length: 50 }, (_, i) => ({
        id: i,
        title: `Level 1 Item ${i}`,
        hasChildren: i % 3 === 0,
        children: i % 3 === 0
          ? Array.from({ length: 20 }, (_, j) => ({
              id: j,
              title: `Level 2 Item ${i}-${j}`,
              type: ['container', 'list', 'simple'][j % 3],
              content: `Simple content for ${i}-${j}`,
              items: j % 3 === 0
                ? Array.from({ length: 10 }, (_, k) => ({
                    title: `Level 3 Item ${i}-${j}-${k}`,
                    hasDetails: k % 4 === 0,
                    details: k % 4 === 0
                      ? Array.from({ length: 5 }, (_, l) => ({
                          name: `Detail ${i}-${j}-${k}-${l}`,
                          description: `Description for detail ${l}`,
                          hasSubItems: l % 2 === 0,
                          subItems: l % 2 === 0
                            ? Array.from({ length: 3 }, (_, m) => ({
                                label: `Label ${m}`,
                                value: `Value ${m}`,
                                hasNested: m === 1,
                                nested: m === 1
                                  ? Array.from({ length: 2 }, (_, n) => ({
                                      key: `Key ${n}`,
                                      val: `Val ${n}`,
                                    }))
                                  : [],
                              }))
                            : [],
                        }))
                      : [],
                  }))
                : [],
              listItems: j % 3 === 1
                ? Array.from({ length: 15 }, (_, k) => ({
                    text: `List item ${i}-${j}-${k}`,
                  }))
                : [],
            }))
          : [],
      })),
    }

    const startTime = performance.now()
    const dependencies = new Set<string>()
    const result = await processDirectives(template, deepNestedData, 'deep.stx', defaultOptions, dependencies)
    const endTime = performance.now()

    const processingTime = endTime - startTime

    // Should handle deep nesting efficiently
    expect(processingTime).toBeLessThan(1000) // Under 1 second
    expect(result).toContain('level-1-item')
    expect(result).toContain('level-6')

    console.log(`Deep nesting: ${processingTime.toFixed(2)}ms`)
  })

  test('should handle massive switch statement with many cases', async () => {
    const template = `
      <div class="status-processor">
        @foreach(items as item)
          <div class="item" data-id="{{ item.id }}">
            <h3>{{ item.name }}</h3>

            @switch(item.status)
              @case('draft')
                <span class="status draft">Draft - Not published</span>
              @case('pending_review')
                <span class="status pending">Pending Review</span>
              @case('in_review')
                <span class="status reviewing">Currently being reviewed</span>
              @case('approved')
                <span class="status approved">Approved for publication</span>
              @case('published')
                <span class="status published">Published and live</span>
              @case('featured')
                <span class="status featured">Featured content</span>
              @case('archived')
                <span class="status archived">Archived</span>
              @case('deleted')
                <span class="status deleted">Deleted</span>
              @case('suspended')
                <span class="status suspended">Temporarily suspended</span>
              @case('flagged')
                <span class="status flagged">Flagged for review</span>
              @case('spam')
                <span class="status spam">Marked as spam</span>
              @case('blocked')
                <span class="status blocked">Blocked</span>
              @case('scheduled')
                <span class="status scheduled">Scheduled for {{ item.publishDate }}</span>
              @case('expired')
                <span class="status expired">Expired</span>
              @case('private')
                <span class="status private">Private content</span>
              @case('premium')
                <span class="status premium">Premium content</span>
              @case('beta')
                <span class="status beta">Beta release</span>
              @case('maintenance')
                <span class="status maintenance">Under maintenance</span>
              @case('migrating')
                <span class="status migrating">Being migrated</span>
              @case('processing')
                <span class="status processing">Processing...</span>
              @default
                <span class="status unknown">Unknown status: {{ item.status }}</span>
            @endswitch

            <div class="metadata">
              <small>Updated: {{ item.lastModified }}</small>
            </div>
          </div>
        @endforeach
      </div>
    `

    const statuses = [
      'draft',
      'pending_review',
      'in_review',
      'approved',
      'published',
      'featured',
      'archived',
      'deleted',
      'suspended',
      'flagged',
      'spam',
      'blocked',
      'scheduled',
      'expired',
      'private',
      'premium',
      'beta',
      'maintenance',
      'migrating',
      'processing',
      'unknown_status',
    ]

    const massiveSwitchData = {
      items: Array.from({ length: 50000 }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        status: statuses[i % statuses.length],
        publishDate: '2024-01-01',
        lastModified: new Date().toISOString(),
      })),
    }

    const startTime = performance.now()
    const dependencies = new Set<string>()
    const result = await processDirectives(template, massiveSwitchData, 'switch.stx', defaultOptions, dependencies)
    const endTime = performance.now()

    const processingTime = endTime - startTime

    // Should handle massive switch efficiently
    expect(processingTime).toBeLessThan(3000) // Under 3 seconds for 50k items
    expect(result.split('class="item"').length - 1).toBe(50000)

    console.log(`Massive switch (50k items): ${processingTime.toFixed(2)}ms`)
  })

  test('should handle extremely long strings without memory issues', async () => {
    const template = `
      <div class="long-content">
        <h1>{{ title }}</h1>
        <div class="content">{{ content }}</div>

        <div class="items">
          @foreach(items as item)
            <div class="item">
              <h3>{{ item.title }}</h3>
              <div class="description">{{ item.description }}</div>
              <div class="details">{{ item.details }}</div>
            </div>
          @endforeach
        </div>
      </div>
    `

    // Generate extremely long strings
    const longString = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(10000) // ~570KB
    const mediumString = 'This is a medium length description. '.repeat(1000) // ~35KB
    const shortString = 'Details here. '.repeat(100) // ~1.4KB

    const longContentData = {
      title: 'Long Content Test',
      content: longString,
      items: Array.from({ length: 1000 }, (_, i) => ({
        title: `Item ${i}`,
        description: mediumString,
        details: shortString,
      })),
    }

    const memoryBefore = measureMemoryUsage()
    const startTime = performance.now()

    const dependencies = new Set<string>()
    const result = await processDirectives(template, longContentData, 'long.stx', defaultOptions, dependencies)

    const endTime = performance.now()
    const memoryAfter = measureMemoryUsage()

    const processingTime = endTime - startTime
    const memoryUsed = (memoryAfter.heapUsed - memoryBefore.heapUsed) / 1024 / 1024

    // Should handle long strings efficiently
    expect(processingTime).toBeLessThan(2000) // Under 2 seconds
    expect(memoryUsed).toBeLessThan(200) // Under 200MB additional memory
    expect(result).toContain('Long Content Test')

    console.log(`Long strings: ${processingTime.toFixed(2)}ms, ${memoryUsed.toFixed(2)}MB`)
  })

  test('should handle concurrent processing simulation', async () => {
    const template = `
      <div class="concurrent-test">
        <h1>Request {{ requestId }}</h1>
        @foreach(data as item)
          <div class="item-{{ item.id }}">
            @if(item.process)
              <span>Processing {{ item.name }}</span>
            @else
              <span>Idle {{ item.name }}</span>
            @endif
          </div>
        @endforeach
      </div>
    `

    // Simulate multiple concurrent requests
    const concurrentRequests = Array.from({ length: 20 }, (_, i) => ({
      requestId: i,
      data: Array.from({ length: 1000 }, (_, j) => ({
        id: j,
        name: `Item ${i}-${j}`,
        process: (i + j) % 3 === 0,
      })),
    }))

    const startTime = performance.now()

    // Process all requests concurrently
    const results = await Promise.all(
      concurrentRequests.map(async (request) => {
        const dependencies = new Set<string>()
        return processDirectives(template, request, `concurrent-${request.requestId}.stx`, defaultOptions, dependencies)
      }),
    )

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Should handle concurrent processing efficiently
    expect(totalTime).toBeLessThan(3000) // Under 3 seconds for 20 concurrent requests
    expect(results).toHaveLength(20)
    expect(results.every(result => result.includes('concurrent-test'))).toBe(true)

    console.log(`Concurrent processing (20 requests): ${totalTime.toFixed(2)}ms total`)
  })

  test('should maintain performance with repeated template processing', async () => {
    const template = `
      <div class="repeated-test">
        @foreach(items as item)
          @switch(item.category)
            @case('A')
              <div class="category-a">{{ item.name }}</div>
            @case('B')
              <div class="category-b">{{ item.name }}</div>
            @case('C')
              <div class="category-c">{{ item.name }}</div>
            @default
              <div class="category-other">{{ item.name }}</div>
          @endswitch
        @endforeach
      </div>
    `

    const testData = {
      items: Array.from({ length: 5000 }, (_, i) => ({
        name: `Item ${i}`,
        category: ['A', 'B', 'C', 'D'][i % 4],
      })),
    }

    const iterations = 100
    const times: number[] = []

    // Process the same template many times to check for performance degradation
    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now()
      const dependencies = new Set<string>()
      await processDirectives(template, testData, `repeated-${i}.stx`, defaultOptions, dependencies)
      const endTime = performance.now()
      times.push(endTime - startTime)
    }

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length
    const firstTen = times.slice(0, 10).reduce((a, b) => a + b, 0) / 10
    const lastTen = times.slice(-10).reduce((a, b) => a + b, 0) / 10

    // Performance should not degrade significantly over iterations
    const degradationRatio = lastTen / firstTen
    expect(degradationRatio).toBeLessThan(2) // Less than 2x slower

    console.log(`Repeated processing: avg ${avgTime.toFixed(2)}ms, first10 ${firstTen.toFixed(2)}ms, last10 ${lastTen.toFixed(2)}ms`)
  })
})
