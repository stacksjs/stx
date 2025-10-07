import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { clearOnceStore } from '../../src/includes'
import { processDirectives } from '../../src/process'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp')

const defaultOptions: StxOptions = {
  debug: false,
  componentsDir: path.join(TEMP_DIR, 'components'),
  partialsDir: path.join(TEMP_DIR, 'partials'),
}

// Helper function to process a template
async function processTemplate(template: string, context: Record<string, any> = {}, filePath: string = 'test.stx'): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, path.join(TEMP_DIR, filePath), defaultOptions, dependencies)
}

// Helper function to validate HTML structure
function validateHTMLStructure(html: string): { isValid: boolean, errors: string[] } {
  const errors: string[] = []

  // Check for proper DOCTYPE
  if (!html.includes('<!DOCTYPE html>')) {
    errors.push('Missing DOCTYPE declaration')
  }

  // Check for balanced tags
  const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi
  const tags: string[] = []
  let match

  // eslint-disable-next-line no-cond-assign
  while ((match = tagPattern.exec(html)) !== null) {
    const tagName = match[1].toLowerCase()
    const isClosing = match[0].startsWith('</')
    const isSelfClosing = match[0].endsWith('/>') || ['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName)

    if (isClosing) {
      const lastTag = tags.pop()
      if (lastTag !== tagName) {
        errors.push(`Unmatched closing tag: ${tagName}`)
      }
    }
    else if (!isSelfClosing) {
      tags.push(tagName)
    }
  }

  if (tags.length > 0) {
    errors.push(`Unclosed tags: ${tags.join(', ')}`)
  }

  // Check for required HTML structure
  if (!html.includes('<html>') && !html.includes('<html ')) {
    errors.push('Missing <html> tag')
  }

  if (!html.includes('<head>')) {
    errors.push('Missing <head> tag')
  }

  if (!html.includes('<body>')) {
    errors.push('Missing <body> tag')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

describe('HTML Output Validation', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(path.join(TEMP_DIR, 'components'), { recursive: true })
    await fs.promises.mkdir(path.join(TEMP_DIR, 'partials'), { recursive: true })

    // Create test components and partials
    await Bun.write(path.join(TEMP_DIR, 'partials', 'header.stx'), `
      <header>
        <h1>My Site</h1>
      </header>
    `)

    await Bun.write(path.join(TEMP_DIR, 'partials', 'navigation.stx'), `
      <nav>
        <ul>
          @foreach(navItems as item)
            <li><a href="{{ item.url }}">{{ item.title }}</a></li>
          @endforeach
        </ul>
      </nav>
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

  describe('Basic HTML Structure Validation', () => {
    test('should generate valid HTML5 document structure', async () => {
      const template = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{ title }}</title>
        </head>
        <body>
          <h1>{{ heading }}</h1>
          <p>{{ content }}</p>
        </body>
        </html>
      `

      const context = {
        title: 'Test Page',
        heading: 'Welcome',
        content: 'This is a test page',
      }

      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('<title>Test Page</title>')
      expect(result).toContain('<h1>Welcome</h1>')
    })

    test('should handle nested HTML elements correctly', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Nested Elements</title>
        </head>
        <body>
          <div class="container">
            <article>
              <header>
                <h1>{{ title }}</h1>
                <p class="meta">By {{ author }}</p>
              </header>
              <section class="content">
                {!! content !!}
              </section>
              <footer>
                <p>Published on {{ date }}</p>
              </footer>
            </article>
          </div>
        </body>
        </html>
      `

      const context = {
        title: 'Article Title',
        author: 'John Doe',
        content: '<p>This is the article content with <strong>bold text</strong>.</p>',
        date: '2023-12-01',
      }

      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('<div class="container">')
      expect(result).toContain('<strong>bold text</strong>')
    })
  })

  describe('Directive Output Validation', () => {
    test('should validate HTML output from conditional directives', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Conditionals Test</title>
        </head>
        <body>
          @if(showHeader)
            <header>
              <h1>{{ title }}</h1>
            </header>
          @endif

          @if(showNavigation)
            <nav>
              <ul>
                @foreach(items as item)
                  <li>{{ item }}</li>
                @endforeach
              </ul>
            </nav>
          @else
            <p>No navigation available</p>
          @endif

          <main>
            <p>Main content</p>
          </main>
        </body>
        </html>
      `

      const context = {
        showHeader: true,
        showNavigation: false,
        title: 'Test Site',
        items: ['Home', 'About', 'Contact'],
      }

      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('<header>')
      expect(result).toContain('<h1>Test Site</h1>')
      expect(result).toContain('<p>No navigation available</p>')
      expect(result).not.toContain('<nav>')
    })

    test('should validate HTML output from switch statements', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Switch Test</title>
        </head>
        <body>
          @switch(userRole)
            @case('admin')
              <div class="admin-panel">
                <h2>Admin Dashboard</h2>
                <p>You have full access.</p>
              </div>
            @case('editor')
              <div class="editor-panel">
                <h2>Editor Dashboard</h2>
                <p>You can edit content.</p>
              </div>
            @case('user')
              <div class="user-panel">
                <h2>User Dashboard</h2>
                <p>Welcome, user!</p>
              </div>
            @default
              <div class="guest-panel">
                <h2>Guest Access</h2>
                <p>Please log in.</p>
              </div>
          @endswitch
        </body>
        </html>
      `

      const context = { userRole: 'editor' }
      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('<div class="editor-panel">')
      expect(result).toContain('<h2>Editor Dashboard</h2>')
      expect(result).not.toContain('admin-panel')
      expect(result).not.toContain('user-panel')
    })
  })

  describe('Include and Component Validation', () => {
    test('should validate HTML when using includes', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Include Test</title>
        </head>
        <body>
          @include('header')

          @include('navigation')

          <main>
            <p>Main content here</p>
          </main>
        </body>
        </html>
      `

      const context = {
        navItems: [
          { title: 'Home', url: '/' },
          { title: 'About', url: '/about' },
        ],
      }
      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('<header>')
      expect(result).toContain('<h1>My Site</h1>')
      expect(result).toContain('<nav>')
      expect(result).toContain('<a href="/">Home</a>')
    })
  })

  describe('Special Characters and Escaping', () => {
    test('should properly escape HTML in expressions', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Escaping Test</title>
        </head>
        <body>
          <p>{{ userInput }}</p>
          <div>{!! rawHtml !!}</div>
        </body>
        </html>
      `

      const context = {
        userInput: '<script>alert("xss")</script>',
        rawHtml: '<em>This should not be escaped</em>',
      }

      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
      expect(result).toContain('<em>This should not be escaped</em>')
    })

    test('should handle Unicode and special characters', async () => {
      const template = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>{{ title }}</title>
        </head>
        <body>
          <h1>{{ heading }}</h1>
          <p>{{ description }}</p>
        </body>
        </html>
      `

      const context = {
        title: 'Tëst Pågé 🎉',
        heading: 'Wélcome tö STX',
        description: 'This contains émojis: 🚀 💡 ⭐',
      }

      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('Tëst Pågé 🎉')
      expect(result).toContain('🚀 💡 ⭐')
    })
  })

  describe('Complex Real-World Examples', () => {
    test('should generate valid HTML for a complete page', async () => {
      clearOnceStore() // Clear any previous @once content

      const template = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>{{ pageTitle }}</title>

          @once
            <link rel="stylesheet" href="/css/styles.css">
          @endonce

          @if(isDevelopment)
            <script src="/js/debug.js"></script>
          @endif
        </head>
        <body>
          <header>
            <nav>
              <ul>
                @foreach(navigation as navItem)
                  <li>
                    <a href="{{ navItem.url }}"
                       @if(navItem.url === currentUrl)class="active"@endif>
                      {{ navItem.title }}
                    </a>
                  </li>
                @endforeach
              </ul>
            </nav>
          </header>

          <main>
            @switch(pageType)
              @case('home')
                <section class="hero">
                  <h1>{{ heroTitle }}</h1>
                  <p>{{ heroDescription }}</p>
                </section>
              @case('blog')
                <section class="blog">
                  <h1>Blog Posts</h1>
                  @foreach(posts as post)
                    <article>
                      <h2>{{ post.title }}</h2>
                      <p>{{ post.excerpt }}</p>
                      <time>{{ post.date }}</time>
                    </article>
                  @endforeach
                </section>
              @default
                <section>
                  <h1>{{ pageTitle }}</h1>
                  <p>{{ content }}</p>
                </section>
            @endswitch
          </main>

          <footer>
            <p>&copy; {{ currentYear }} {{ siteName }}</p>
          </footer>

          @once
            <script src="/js/app.js"></script>
          @endonce
        </body>
        </html>
      `

      const context = {
        pageTitle: 'My Awesome Site',
        pageType: 'blog',
        isDevelopment: false,
        currentUrl: '/blog',
        siteName: 'STX Demo',
        currentYear: new Date().getFullYear(),
        navigation: [
          { title: 'Home', url: '/' },
          { title: 'Blog', url: '/blog' },
          { title: 'About', url: '/about' },
        ],
        posts: [
          {
            title: 'First Post',
            excerpt: 'This is the first blog post.',
            date: '2023-12-01',
          },
          {
            title: 'Second Post',
            excerpt: 'This is another post.',
            date: '2023-12-02',
          },
        ],
      }

      const result = await processTemplate(template, context)
      const validation = validateHTMLStructure(result)

      expect(validation.isValid).toBe(true)
      expect(result).toContain('<!DOCTYPE html>')
      expect(result).toContain('<html lang="en">')
      expect(result).toContain('<title>My Awesome Site</title>')
      expect(result).toContain('<section class="blog">')
      expect(result).toContain('<article>')
      expect(result).toContain('<h2>First Post</h2>')
      expect(result).toContain('class="active"')

      // Check that @once content appears only once
      const cssLinkCount = (result.match(/css\/styles\.css/g) || []).length
      const jsAppCount = (result.match(/js\/app\.js/g) || []).length
      expect(cssLinkCount).toBe(1)
      expect(jsAppCount).toBe(1)
    })
  })
})
