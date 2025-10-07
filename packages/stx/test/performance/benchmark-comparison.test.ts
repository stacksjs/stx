/* eslint-disable no-console */
import type { StxOptions } from '../../src/types'
import { describe, expect, test } from 'bun:test'
import { processDirectives } from '../../src/process'

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: 'components',
}

// Benchmark against native JavaScript template literals
function benchmarkNativeJS(data: any, iterations: number = 1000) {
  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    void `
      <div>
        <h1>${data.title}</h1>
        <p>${data.content}</p>
        <ul>
          ${data.items.map((item: any) => `<li>${item.name} - ${item.value}</li>`).join('')}
        </ul>
      </div>
    `
  }

  const endTime = performance.now()
  const totalTime = endTime - startTime
  const avgTime = totalTime / iterations
  const opsPerSecond = (iterations / totalTime) * 1000

  return { avgTime, totalTime, opsPerSecond }
}

// Benchmark stx processing
async function benchmarkstx(template: string, context: any, iterations: number = 1000) {
  const dependencies = new Set<string>()

  // Warm up
  for (let i = 0; i < 10; i++) {
    await processDirectives(template, context, 'benchmark.stx', defaultOptions, dependencies)
  }

  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    await processDirectives(template, context, 'benchmark.stx', defaultOptions, dependencies)
  }

  const endTime = performance.now()
  const totalTime = endTime - startTime
  const avgTime = totalTime / iterations
  const opsPerSecond = (iterations / totalTime) * 1000

  return { avgTime, totalTime, opsPerSecond }
}

describe('stx vs Native Performance Comparison', () => {
  test('should compete well with native template literals for simple cases', async () => {
    const data = {
      title: 'Performance Test',
      content: 'This is a performance comparison test',
      items: Array.from({ length: 100 }, (_, i) => ({ name: `Item ${i}`, value: i * 2 })),
    }

    const stxTemplate = `
      <div>
        <h1>{{ title }}</h1>
        <p>{{ content }}</p>
        <ul>
          @foreach(items as item)
            <li>{{ item.name }} - {{ item.value }}</li>
          @endforeach
        </ul>
      </div>
    `

    const nativeResult = benchmarkNativeJS(data, 5000)
    const stxResult = await benchmarkstx(stxTemplate, data, 5000)

    // stx should be within reasonable performance range of native JS
    // Native JS will always be faster, but stx should be within 200x for complex features
    const performanceRatio = stxResult.avgTime / nativeResult.avgTime

    expect(performanceRatio).toBeLessThan(200) // stx should be less than 200x slower than native (due to rich features)
    expect(stxResult.opsPerSecond).toBeGreaterThan(1000) // Should still be very fast

    console.log(`Native JS: ${nativeResult.opsPerSecond.toFixed(0)} ops/sec, ${nativeResult.avgTime.toFixed(4)}ms avg`)
    console.log(`stx: ${stxResult.opsPerSecond.toFixed(0)} ops/sec, ${stxResult.avgTime.toFixed(4)}ms avg`)
    console.log(`Performance ratio: ${performanceRatio.toFixed(2)}x slower than native`)
  })

  test('should show stx advantages with complex logic', async () => {
    // This test shows where stx shines - complex templating logic
    const data = {
      users: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        role: ['admin', 'editor', 'user'][i % 3],
        active: i % 4 !== 0,
        posts: Array.from({ length: Math.floor(Math.random() * 10) }, (_, j) => ({
          title: `Post ${j} by User ${i}`,
          published: j % 2 === 0,
        })),
      })),
    }

    const stxTemplate = `
      <div class="users-dashboard">
        @foreach(users as user)
          <div class="user-card user-{{ user.role }}" data-id="{{ user.id }}">
            <h3>{{ user.name }}</h3>

            @switch(user.role)
              @case('admin')
                <span class="badge admin">Administrator</span>
                <div class="admin-controls">
                  <button>Manage Users</button>
                  <button>System Settings</button>
                </div>
              @case('editor')
                <span class="badge editor">Editor</span>
                <div class="editor-controls">
                  <button>Create Post</button>
                  <button>Moderate</button>
                </div>
              @default
                <span class="badge user">User</span>
            @endswitch

            @if(user.active)
              <div class="status active">Active</div>

              @if(user.posts && user.posts.length > 0)
                <div class="posts-summary">
                  <h4>Recent Posts ({{ user.posts.length }})</h4>
                  <ul>
                    @foreach(user.posts as post)
                      @if(post.published)
                        <li class="published">{{ post.title }}</li>
                      @else
                        <li class="draft">{{ post.title }} (Draft)</li>
                      @endif
                    @endforeach
                  </ul>
                </div>
              @else
                <p class="no-posts">No posts yet</p>
              @endif
            @else
              <div class="status inactive">Inactive</div>
            @endif
          </div>
        @endforeach
      </div>
    `

    // Native JS equivalent would be very complex and hard to maintain
    const nativeEquivalent = (data: any) => {
      let html = '<div class="users-dashboard">'

      for (const user of data.users) {
        html += `<div class="user-card user-${user.role}" data-id="${user.id}">
          <h3>${user.name}</h3>`

        if (user.role === 'admin') {
          html += `<span class="badge admin">Administrator</span>
            <div class="admin-controls">
              <button>Manage Users</button>
              <button>System Settings</button>
            </div>`
        }
        else if (user.role === 'editor') {
          html += `<span class="badge editor">Editor</span>
            <div class="editor-controls">
              <button>Create Post</button>
              <button>Moderate</button>
            </div>`
        }
        else {
          html += `<span class="badge user">User</span>`
        }

        if (user.active) {
          html += `<div class="status active">Active</div>`

          if (user.posts && user.posts.length > 0) {
            html += `<div class="posts-summary">
              <h4>Recent Posts (${user.posts.length})</h4>
              <ul>`

            for (const post of user.posts) {
              if (post.published) {
                html += `<li class="published">${post.title}</li>`
              }
              else {
                html += `<li class="draft">${post.title} (Draft)</li>`
              }
            }

            html += `</ul></div>`
          }
          else {
            html += `<p class="no-posts">No posts yet</p>`
          }
        }
        else {
          html += `<div class="status inactive">Inactive</div>`
        }

        html += `</div>`
      }

      html += '</div>'
      return html
    }

    // Benchmark native JS
    const nativeStart = performance.now()
    for (let i = 0; i < 100; i++) {
      nativeEquivalent(data)
    }
    const nativeEnd = performance.now()
    const nativeTime = (nativeEnd - nativeStart) / 100

    // Benchmark stx
    const stxResult = await benchmarkstx(stxTemplate, data, 100)

    console.log(`Complex template - Native JS: ${(1000 / nativeTime).toFixed(0)} ops/sec, ${nativeTime.toFixed(4)}ms avg`)
    console.log(`Complex template - stx: ${stxResult.opsPerSecond.toFixed(0)} ops/sec, ${stxResult.avgTime.toFixed(4)}ms avg`)

    // For complex templates, stx should be competitive and much more maintainable
    expect(stxResult.avgTime).toBeLessThan(50) // Should complete in under 50ms
    expect(stxResult.opsPerSecond).toBeGreaterThan(20) // At least 20 ops/sec for complex templates
  })

  test('should scale linearly with data size', async () => {
    const baseTemplate = `
      <div>
        @foreach(items as item)
          <div class="item">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            @if(item.featured)
              <span class="featured">Featured</span>
            @endif
          </div>
        @endforeach
      </div>
    `

    const sizes = [100, 500, 1000, 2000]
    const results: Array<{ size: number, avgTime: number, opsPerSecond: number }> = []

    for (const size of sizes) {
      const context = {
        items: Array.from({ length: size }, (_, i) => ({
          title: `Item ${i}`,
          description: `Description for item ${i}`,
          featured: i % 10 === 0,
        })),
      }

      const result = await benchmarkstx(baseTemplate, context, 50)
      results.push({ size, avgTime: result.avgTime, opsPerSecond: result.opsPerSecond })

      console.log(`Size ${size}: ${result.opsPerSecond.toFixed(0)} ops/sec, ${result.avgTime.toFixed(3)}ms avg`)
    }

    // Verify roughly linear scaling
    for (let i = 1; i < results.length; i++) {
      const prev = results[i - 1]
      const curr = results[i]
      const sizeRatio = curr.size / prev.size
      const timeRatio = curr.avgTime / prev.avgTime

      // Time should scale roughly linearly with data size (within 50% variance)
      expect(timeRatio).toBeLessThan(sizeRatio * 1.5)
      expect(timeRatio).toBeGreaterThan(sizeRatio * 0.5)
    }
  })

  test('should maintain performance with many small templates', async () => {
    const smallTemplate = `
      <div class="card">
        <h3>{{ title }}</h3>
        <p>{{ content }}</p>
        @if(showButton)
          <button>{{ buttonText }}</button>
        @endif
      </div>
    `

    const contexts = Array.from({ length: 1000 }, (_, i) => ({
      title: `Card ${i}`,
      content: `Content for card ${i}`,
      showButton: i % 2 === 0,
      buttonText: 'Click me',
    }))

    const startTime = performance.now()

    // Process many small templates
    for (const context of contexts) {
      const dependencies = new Set<string>()
      await processDirectives(smallTemplate, context, 'small.stx', defaultOptions, dependencies)
    }

    const endTime = performance.now()
    const totalTime = endTime - startTime
    const avgTime = totalTime / contexts.length
    const opsPerSecond = (contexts.length / totalTime) * 1000

    expect(avgTime).toBeLessThan(1) // Less than 1ms per small template
    expect(opsPerSecond).toBeGreaterThan(1000) // More than 1k ops/sec

    console.log(`Many small templates: ${opsPerSecond.toFixed(0)} ops/sec, ${avgTime.toFixed(4)}ms avg`)
  })
})
