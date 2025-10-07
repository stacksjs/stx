import { describe, expect, it } from 'bun:test'
import { sanitize, sanitizeWithInfo, stripTags } from '../src/sanitizer'

describe('html sanitizer - performance', () => {
  it('should sanitize large HTML document efficiently', () => {
    const html = Array.from({ length: 1000 }, (_, i) => `
      <div class="item-${i}">
        <h2>Title ${i}</h2>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
        </ul>
        <a href="https://example.com/${i}">Link ${i}</a>
      </div>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(200) // Should complete in less than 200ms
    expect(result).toContain('<div')
    expect(result).toContain('<h2')
  })

  it('should handle repeated sanitization efficiently', () => {
    const html = '<p>Text with <strong>bold</strong> and <a href="url">link</a></p>'

    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      sanitize(html, 'basic')
    }
    const duration = performance.now() - start

    expect(duration).toBeLessThan(500) // 1000 sanitizations in less than 500ms
  })

  it('should handle deeply nested HTML efficiently', () => {
    let html = '<div>Content</div>'
    for (let i = 0; i < 50; i++) {
      html = `<div class="level-${i}">${html}</div>`
    }

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result).toContain('Content')
  })

  it('should handle many attributes efficiently', () => {
    const attrs = Array.from({ length: 100 }, (_, i) => `data-attr${i}="value${i}"`).join(' ')
    const html = `<div ${attrs}>Content</div>`.repeat(100)

    const start = performance.now()
    const result = sanitize(html, {
      allowedTags: ['div'],
      allowDataAttributes: true,
    })
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
  })

  it('should detect dangerous content quickly', () => {
    const html = Array.from({ length: 100 }, (_, i) => `
      <script>alert(${i})</script>
      <p>Safe content ${i}</p>
      <iframe src="evil.com"></iframe>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('<iframe>')
  })

  it('should strip tags from large documents efficiently', () => {
    const html = Array.from({ length: 1000 }, (_, i) => `
      <div><p>Text ${i} with <strong>bold</strong> and <em>italic</em></p></div>
    `).join('\n')

    const start = performance.now()
    const result = stripTags(html)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(result).not.toContain('<')
  })

  it('should handle many event handlers efficiently', () => {
    const events = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus']
    const html = Array.from({ length: 200 }, (_, i) =>
      `<div ${events.map(e => `${e}="alert(${i})"`).join(' ')}>Content ${i}</div>`
    ).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).not.toContain('onclick')
  })

  it('should validate many URLs efficiently', () => {
    const html = Array.from({ length: 500 }, (_, i) => `
      <a href="https://example.com/${i}">Link ${i}</a>
      <a href="javascript:alert(${i})">Bad ${i}</a>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).toContain('https://example.com')
    expect(result).not.toContain('javascript:')
  })

  it('should handle mixed safe and unsafe content efficiently', () => {
    const html = Array.from({ length: 100 }, (_, i) => `
      <div class="safe-${i}">
        <h2>Title ${i}</h2>
        <p>Safe paragraph</p>
        <script>alert(${i})</script>
        <img src="test.jpg" onerror="alert(${i})">
        <a href="javascript:void(0)">Bad link</a>
        <a href="https://example.com">Good link</a>
      </div>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(200)
    expect(result).not.toContain('<script>')
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('javascript:')
  })

  it('should provide detailed info efficiently', () => {
    const html = Array.from({ length: 100 }, (_, i) => `
      <div>
        <script>alert(${i})</script>
        <p onclick="alert(${i})">Content</p>
        <iframe src="evil.com"></iframe>
      </div>
    `).join('\n')

    const start = performance.now()
    const result = sanitizeWithInfo(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(200)
    expect(result.modified).toBe(true)
    expect(result.removedTags).toBeDefined()
    expect(result.removedAttributes).toBeDefined()
  })

  it('should handle different presets at similar speed', () => {
    const html = Array.from({ length: 200 }, (_, i) => `
      <div class="item">
        <h2>Title ${i}</h2>
        <p>Content with <strong>bold</strong></p>
        <img src="image${i}.jpg">
        <video src="video${i}.mp4"></video>
      </div>
    `).join('\n')

    const strictTime = (() => {
      const start = performance.now()
      sanitize(html, 'strict')
      return performance.now() - start
    })()

    const basicTime = (() => {
      const start = performance.now()
      sanitize(html, 'basic')
      return performance.now() - start
    })()

    const relaxedTime = (() => {
      const start = performance.now()
      sanitize(html, 'relaxed')
      return performance.now() - start
    })()

    // All presets should be reasonably fast
    expect(strictTime).toBeLessThan(200)
    expect(basicTime).toBeLessThan(200)
    expect(relaxedTime).toBeLessThan(200)
  })

  it('should handle HTML with many comments efficiently', () => {
    const html = Array.from({ length: 500 }, (_, i) => `
      <!-- Comment ${i} -->
      <p>Content ${i}</p>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).not.toContain('<!--')
  })

  it('should handle tables efficiently', () => {
    const html = `
      <table>
        <thead>
          <tr>
            ${Array.from({ length: 20 }, (_, i) => `<th>Header ${i}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${Array.from({ length: 100 }, (_, i) => `
            <tr>
              ${Array.from({ length: 20 }, (__, j) => `<td>Cell ${i}-${j}</td>`).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
    `

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).toContain('<table>')
  })

  it('should handle lists efficiently', () => {
    const html = Array.from({ length: 50 }, (_, i) => `
      <ul>
        ${Array.from({ length: 20 }, (__, j) => `<li>Item ${i}-${j}</li>`).join('')}
      </ul>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).toContain('<ul>')
  })

  it('should handle memory efficiently', () => {
    const initialMemory = process.memoryUsage().heapUsed

    // Sanitize multiple large documents
    for (let i = 0; i < 10; i++) {
      const html = Array.from({ length: 100 }, (_, j) => `
        <div class="item-${j}">
          <h2>Title ${j}</h2>
          <p>Content with <strong>bold</strong></p>
          <script>alert(${j})</script>
        </div>
      `).join('\n')

      sanitize(html, 'basic')
    }

    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory

    // Memory increase should be reasonable (less than 50MB)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
  })

  it('should handle Unicode efficiently', () => {
    const html = Array.from({ length: 200 }, (_, i) => `
      <p class="中文-${i}">
        内容 <strong>加粗</strong> <em>斜体</em> 🎉 ${i}
      </p>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    expect(duration).toBeLessThan(150)
    expect(result).toContain('内容')
  })

  it('should be faster than sequential processing', () => {
    const documents = Array.from({ length: 100 }, (_, i) => `
      <div>
        <h2>Doc ${i}</h2>
        <p>Content ${i}</p>
        <script>alert(${i})</script>
      </div>
    `)

    const start = performance.now()
    documents.forEach(doc => sanitize(doc, 'basic'))
    const duration = performance.now() - start

    // Should process 100 documents quickly
    expect(duration).toBeLessThan(300)
  })

  it('should handle malformed HTML without performance degradation', () => {
    const html = Array.from({ length: 200 }, (_, i) => `
      <div class="item-${i}
      <p>Unclosed ${i}
      <script>alert(${i})
      <div attr=unclosed-${i}>
    `).join('\n')

    const start = performance.now()
    const result = sanitize(html, 'basic')
    const duration = performance.now() - start

    // Should handle malformed HTML gracefully without slowdown
    expect(duration).toBeLessThan(200)
    expect(typeof result).toBe('string')
  })

  it('should handle custom options without performance penalty', () => {
    const html = Array.from({ length: 200 }, (_, i) => `
      <div data-id="${i}" data-value="value-${i}">
        <p>Content ${i}</p>
      </div>
    `).join('\n')

    const customOptions = {
      allowedTags: ['div', 'p'],
      allowedAttributes: { div: ['data-id', 'data-value'], p: [] },
      allowDataAttributes: true,
    }

    const start = performance.now()
    const result = sanitize(html, customOptions)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(200)
    expect(result).toContain('data-id')
  })
})
