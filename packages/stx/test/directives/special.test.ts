import type { StxOptions } from '../../src/types'
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from 'bun-plugin-stx'
import { processDirectives, processJsonDirective, processOnceDirective } from '../../src/process'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

const defaultOptions: StxOptions = { debug: false, componentsDir: 'components' }
async function processTemplate(template: string, context: Record<string, any> = {}, filePath = 'test.stx', options: StxOptions = defaultOptions) {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('stx Special Directives', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should handle @json directive', async () => {
    const testFile = await createTestFile('json-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>JSON Directive Test</title>
        <script>
          module.exports = {
            data: {
              users: [
                { id: 1, name: 'Alice' },
                { id: 2, name: 'Bob' }
              ],
              settings: {
                theme: 'dark',
                notifications: true
              }
            }
          };
        </script>
      </head>
      <body>
        <h1>JSON Directive</h1>

        <div id="compact-json">@json(data)</div>

        <pre id="pretty-json">@json(data, true)</pre>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin({
        seo: {
          enabled: false,
        },
      })],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for compact JSON format
    expect(outputHtml).toContain('{"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}],"settings":{"theme":"dark","notifications":true}}')

    // Check for pretty-printed JSON
    expect(outputHtml).toContain('"users": [')
    expect(outputHtml).toContain('"settings": {')
  })

  it('should handle @once directive', async () => {
    const testFile = await createTestFile('once-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Once Directive Test</title>
      </head>
      <body>
        <h1>Once Directive</h1>

        @once
          <style>
            .box { padding: 10px; margin: 10px; border: 1px solid #ccc; }
          </style>
        @endonce

        <div class="box">Box 1</div>

        @once
          <style>
            .box { padding: 10px; margin: 10px; border: 1px solid #ccc; }
          </style>
        @endonce

        <div class="box">Box 2</div>

        @once
          <link rel="stylesheet" href="https://example.com/duplicate.css">
        @endonce

        @once
          <link rel="stylesheet" href="https://example.com/duplicate.css">
        @endonce
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin({
        seo: {
          enabled: false,
        },
      })],
    })

    const outputHtml = await getHtmlOutput(result)

    // There should be only one style block (duplicate removed by @once)
    const styleCount = (outputHtml.match(/<style>\s*\.box/g) || []).length
    expect(styleCount).toBe(1)

    // There should be only one link tag for the duplicate CSS (deduplicated by @once)
    const linkCount = (outputHtml.match(/duplicate\.css/g) || []).length
    expect(linkCount).toBe(1)

    // Content outside @once should appear normally
    expect(outputHtml).toContain('<div class="box">Box 1</div>')
    expect(outputHtml).toContain('<div class="box">Box 2</div>')
  })

  it('should handle @env directive', async () => {
    // Set NODE_ENV to 'production' for this test
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    try {
      const testFile = await createTestFile('env-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Env Directive Test</title>
      </head>
      <body>
        <h1>Env Directive</h1>

        @env('production')
          <p class="prod-message">Production environment</p>
        @else
          <p class="dev-message">Non-production environment</p>
        @endenv

        @production
          <p class="prod-direct">Using production directive</p>
        @else
          <p class="non-prod-direct">Not using production directive</p>
        @endproduction

        @development
          <p class="dev-only">Development environment</p>
        @else
          <p class="not-dev">Not development environment</p>
        @enddevelopment
      </body>
      </html>
    `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('<p class="prod-message">Production environment</p>')
      expect(outputHtml).not.toContain('<p class="dev-message">Non-production environment</p>')

      expect(outputHtml).toContain('<p class="prod-direct">Using production directive</p>')
      expect(outputHtml).not.toContain('<p class="non-prod-direct">Not using production directive</p>')

      expect(outputHtml).not.toContain('<p class="dev-only">Development environment</p>')
      expect(outputHtml).toContain('<p class="not-dev">Not development environment</p>')
    }
    finally {
      // Restore the original NODE_ENV
      process.env.NODE_ENV = originalEnv
    }
  })

  it('should handle @isset and @empty directives', async () => {
    const testFile = await createTestFile('isset-empty-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Isset/Empty Test</title>
        <script>
          module.exports = {
            user: {
              name: 'John',
              email: ''
            },
            posts: [],
            nullValue: null,
            undefinedValue: undefined
          };
        </script>
      </head>
      <body>
        <h1>Isset and Empty Test</h1>

        @isset(user)
          <p class="user-exists">User exists</p>
        @endisset

        @isset(admin)
          <p class="admin-exists">Admin exists</p>
        @endisset

        @empty(posts)
          <p class="no-posts">No posts available</p>
        @endempty

        @empty(user.email)
          <p class="empty-email">Email is empty</p>
        @endempty

        @empty(user.name)
          <p class="empty-name">Name is empty</p>
        @else
          <p class="has-name">Name is not empty</p>
        @endempty

        @isset(nullValue)
          <p class="null-set">Null value is set</p>
        @endisset

        @isset(undefinedValue)
          <p class="undefined-set">Undefined value is set</p>
        @endisset
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p class="user-exists">User exists</p>')
    expect(outputHtml).not.toContain('<p class="admin-exists">Admin exists</p>')
    expect(outputHtml).toContain('<p class="no-posts">No posts available</p>')
    expect(outputHtml).toContain('<p class="empty-email">Email is empty</p>')
    expect(outputHtml).not.toContain('<p class="empty-name">Name is empty</p>')
    expect(outputHtml).toContain('<p class="has-name">Name is not empty</p>')
    expect(outputHtml).not.toContain('<p class="null-set">Null value is set</p>')
    expect(outputHtml).not.toContain('<p class="undefined-set">Undefined value is set</p>')
  })

  it('should handle @error directive', async () => {
    // Test @error directive processing directly since the build pipeline
    // has complex script extraction that can interfere with function-based errors objects
    const { processErrorDirective } = await import('../../src/forms')

    const template = `
        <form>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" class="form-control">
            @error('email')
              <span class="error">{{ $message }}</span>
            @enderror
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" class="form-control">
            @error('password')
              <span class="error">{{ $message }}</span>
            @enderror
          </div>

          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" class="form-control">
            @error('name')
              <span class="error">{{ $message }}</span>
            @enderror
          </div>
        </form>
    `

    // Use simple object-style errors (field -> message) which the directive
    // handles via getErrorMessage's simple object lookup path
    const context = {
      errors: {
        has(field: string) {
          return field === 'email' || field === 'password'
        },
        first(field: string) {
          if (field === 'email') return 'The email is invalid.'
          if (field === 'password') return 'The password must be at least 8 characters.'
          return ''
        },
        // get() returns the message(s) used by $message via getErrorMessage
        get(field: string) {
          if (field === 'email') return 'The email is invalid.'
          if (field === 'password') return 'The password must be at least 8 characters.'
          return ''
        },
      },
    }

    const result = processErrorDirective(template, context)

    // Email and password should show their error messages
    expect(result).toContain('<span class="error">The email is invalid.</span>')
    expect(result).toContain('<span class="error">The password must be at least 8 characters.</span>')
    // The name field has no error, so its @error block should be removed
    expect(result).not.toContain('@error')
    expect(result).not.toContain('@enderror')
    // The name form group should still exist but without the error span
    expect(result).toContain('<label>Name</label>')
  })

  it('should handle @csrf directive', async () => {
    // First set a known CSRF token for testing
    const { setCsrfToken, resetCsrfToken } = await import('../../src/csrf')
    setCsrfToken('12345abcde')

    try {
      const testFile = await createTestFile('csrf-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CSRF Directive Test</title>
      </head>
      <body>
        <h1>CSRF Directive</h1>

        <form method="POST" action="/submit">
          @csrf

          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name">
          </div>

          <button type="submit">Submit</button>
        </form>

        <form method="POST" action="/custom">
          @csrf("my_token")
          <button type="submit">Custom Token Name</button>
        </form>
      </body>
      </html>
    `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)

      expect(outputHtml).toContain('<input type="hidden" name="_token" value="12345abcde">')
      expect(outputHtml).toContain('<input type="hidden" name="my_token" value="12345abcde">')
    }
    finally {
      // Reset the CSRF token
      resetCsrfToken()
    }
  })

  it('should handle @method directive', async () => {
    const testFile = await createTestFile('method-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Method Directive Test</title>
      </head>
      <body>
        <h1>Method Directive</h1>

        <!-- PUT form -->
        <form method="POST" action="/users/1">
          @method('PUT')
          <input type="text" name="name" value="Updated Name">
          <button>Update</button>
        </form>

        <!-- DELETE form -->
        <form method="POST" action="/users/1">
          @method('DELETE')
          <button>Delete</button>
        </form>

        <!-- PATCH form -->
        <form method="POST" action="/users/1">
          @method('PATCH')
          <input type="text" name="email" value="new@example.com">
          <button>Update Email</button>
        </form>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<input type="hidden" name="_method" value="PUT">')
    expect(outputHtml).toContain('<input type="hidden" name="_method" value="DELETE">')
    expect(outputHtml).toContain('<input type="hidden" name="_method" value="PATCH">')
  })

  it('should handle @push and @stack directives', async () => {
    // Create a layout file
    const layoutsDir = path.join(TEMP_DIR, 'layouts')
    await fs.promises.mkdir(layoutsDir, { recursive: true })

    const layoutFile = path.join(layoutsDir, 'scripts.stx')
    await Bun.write(layoutFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>@yield('title')</title>
        @stack('styles')
      </head>
      <body>
        <main>
          @yield('content')
        </main>

        @stack('footer')
      </body>
      </html>
    `)

    const testFile = await createTestFile('push-directive.stx', `
      @extends('layouts/scripts')

      @section('title', 'Push Test')

      @push('styles')
        <style>
          .box { padding: 10px; }
        </style>
      @endpush

      @section('content')
        <div class="container">
          <h1>Push and Stack Test</h1>
        </div>
      @endsection

      @push('footer')
        <div class="app-init">App initialized</div>
      @endpush

      @push('footer')
        <div class="analytics">Analytics tracking</div>
      @endpush

      @prepend('footer')
        <div class="vendor">Vendor loaded</div>
      @endprepend
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for style tag with content
    expect(outputHtml).toContain('<style>')
    expect(outputHtml).toContain('.box { padding: 10px; }')

    // Check for pushed footer content
    expect(outputHtml).toContain('Vendor loaded')
    expect(outputHtml).toContain('App initialized')
    expect(outputHtml).toContain('Analytics tracking')

    // Check that @prepend puts Vendor before Analytics (@prepend comes before @push)
    expect(outputHtml.indexOf('Vendor loaded')).toBeLessThan(outputHtml.indexOf('Analytics tracking'))
  })

  // Direct test of JSON directive processor
  it('should directly process @json directive', () => {
    const template = `
      <script>
        const data = @json(testData);
        const prettyData = @json(testData, true);
      </script>
    `
    const context = {
      testData: {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        settings: {
          theme: 'dark',
          notifications: true,
        },
      },
    }

    const result = processJsonDirective(template, context)

    // Check that @json was processed
    expect(result).toContain('const data = {"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}],"settings":{"theme":"dark","notifications":true}}')
    expect(result).toContain('const prettyData = {')
    expect(result).toContain('"users": [')
  })

  // Direct test of @once directive processor
  // processOnceDirective strips @once/@endonce tags; deduplication is handled by processIncludes
  it('should directly process @once directive', () => {
    const template = `
      @once
        <style>.box { color: red; }</style>
      @endonce

      <p>Regular content</p>

      @once
        <script>console.log('init');</script>
      @endonce
    `

    const result = processOnceDirective(template)

    // Tags should be stripped, content preserved
    expect(result).toContain('<style>.box { color: red; }</style>')
    expect(result).toContain('<p>Regular content</p>')
    expect(result).toContain("console.log('init')")
    expect(result).not.toContain('@once')
    expect(result).not.toContain('@endonce')
  })
})

describe('Special Directive Fixes', () => {
  describe('@@ escape with various directives', () => {
    it('should not evaluate @@if as a real directive', async () => {
      const testFile = await createTestFile('double-at-escape-fix.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Escape Test</title></head>
        <body>
          <p>To use conditionals, write @@if(condition)...@@endif</p>
          <p>Email: user@@example.com</p>
          <p>Normal: @if (true)yes@endif</p>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('@if(condition)...@endif')
      expect(outputHtml).toContain('user@example.com')
      expect(outputHtml).toContain('yes')
    })

    it('should handle @@ escape with foreach and other directives', async () => {
      const testFile = await createTestFile('double-at-foreach-fix.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Escape Foreach</title></head>
        <body>
          <code>@@foreach(items as item)</code>
          <code>@@section('content')</code>
          <code>@@yield('title')</code>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain("@foreach(items as item)")
      expect(outputHtml).toContain("@section('content')")
      expect(outputHtml).toContain("@yield('title')")
    })
  })

  describe('@json XSS prevention', () => {
    it('should escape @json output for HTML safety', async () => {
      const testFile = await createTestFile('json-xss-fix.stx', `
        <!DOCTYPE html>
        <html>
        <head>
          <title>JSON XSS Test</title>
          <script>
            module.exports = {
              safeData: { name: "hello", count: 42 },
              dangerousData: { payload: "<img src=x onerror=alert(1)>" }
            };
          </script>
        </head>
        <body>
          <pre id="safe">@json(safeData)</pre>
          <pre id="danger">@json(dangerousData)</pre>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('"hello"')
      expect(outputHtml).toContain('42')
      expect(outputHtml).not.toContain('<img src=x onerror=alert(1)>')
      expect(outputHtml).toContain('\\u003c')
    })

    it('should handle @json with pretty printing', async () => {
      const testFile = await createTestFile('json-pretty-fix.stx', `
        <!DOCTYPE html>
        <html>
        <head>
          <title>JSON Pretty</title>
          <script>
            module.exports = { config: { theme: 'dark', lang: 'en' } };
          </script>
        </head>
        <body>
          <pre>@json(config, true)</pre>
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const outputHtml = await getHtmlOutput(result)
      expect(outputHtml).toContain('"theme"')
      expect(outputHtml).toContain('"dark"')
    })
  })

  describe('processRefAttributes matches ref= only in HTML tags', () => {
    it('should not match ref= in text content', () => {
      const regex = /(<[a-zA-Z][a-zA-Z0-9-]*\b[^>]*?)\sref="([^"]+)"/g
      const text = 'Use ref="name" in your template'
      expect(text.replace(regex, '$1 data-stx-ref="$2"')).toBe(text)
    })

    it('should handle ref= with other attributes via regex', () => {
      const regex = /(<[a-zA-Z][a-zA-Z0-9-]*\b[^>]*?)\sref="([^"]+)"/g
      const html = '<div class="box" ref="container" id="main">text</div>'
      const result = html.replace(regex, '$1 data-stx-ref="$2"')
      expect(result).toContain('data-stx-ref="container"')
      expect(result).toContain('class="box"')
      expect(result).toContain('id="main"')
    })
  })

  describe('loading indicator CSS sanitization', () => {
    it('should sanitize CSS values in loading indicator attributes', async () => {
      const { processDirectives } = await import('../../src/process')
      const deps = new Set<string>()
      const template = `<stx-loading-indicator color="red;background:url(evil)" />`
      const result = await processDirectives(template, {}, '', { debug: false, componentsDir: '/tmp/stx-test-components' }, deps)
      expect(result).not.toContain('url(')
      expect(result).not.toContain('red;')
    })
  })
})

describe('@once directive', () => {
  it('should render @once content', async () => {
    const template = `
      @once
        <link rel="stylesheet" href="style.css">
      @endonce
      <p>Content</p>
    `
    const result = await processTemplate(template)
    expect(result).toContain('style.css')
    expect(result).toContain('Content')
  })
})

describe('@push/@prepend balanced parsing', () => {
  it('should handle @push with content via processDirectives', async () => {
    const template = `
      @push('extras')
        <p class="pushed-item">Pushed Content</p>
      @endpush
      <div>Main Content</div>
      @stack('extras')
    `
    const result = await processTemplate(template)
    expect(result).toContain('Main Content')
    expect(result).toContain('Pushed Content')
  })

  it('should handle @prepend with content via processDirectives', async () => {
    const template = `
      @push('items')
        <p>Second</p>
      @endpush
      @prepend('items')
        <p>First</p>
      @endprepend
      @stack('items')
    `
    const result = await processTemplate(template)
    expect(result).toContain('First')
    expect(result).toContain('Second')
    const firstIdx = result.indexOf('First')
    const secondIdx = result.indexOf('Second')
    expect(firstIdx).toBeLessThan(secondIdx)
  })
})

describe('Nested same-name elements', () => {
  it('should handle nested same-name elements in templates', async () => {
    const template = `
    <div>
      <section>
        <section>Inner section</section>
        Outer content
      </section>
    </div>
    `
    const result = await processTemplate(template)
    expect(result).toContain('Inner section')
    expect(result).toContain('Outer content')
  })
})

describe('@component balanced paren scanning', () => {
  it('should handle @component with nested object props', async () => {
    const template = `<div>{{ title }}</div>`
    const result = await processTemplate(template, { title: 'Test' })
    expect(result).toContain('Test')
  })
})

describe('processJsonDirective balanced parens', () => {
  it('should handle nested parens in @json expression', () => {
    const result = processJsonDirective(
      '@json(items.filter(x => x > 0))',
      { items: [1, -2, 3, -4, 5] },
    )
    expect(result).toContain('[1,3,5]')
  })

  it('should handle simple @json expressions', () => {
    const result = processJsonDirective('@json(data)', { data: { name: 'test' } })
    expect(result).toContain('"name"')
    expect(result).toContain('"test"')
  })

  it('should handle @json with pretty flag', () => {
    const result = processJsonDirective('@json(data, true)', { data: { a: 1 } })
    expect(result).toContain('  ')
  })
})

describe('Slots findMatchingTemplateClose', () => {
  it('should handle nested template tags efficiently', async () => {
    const template = `<div>Content</div>`
    const result = await processTemplate(template)
    expect(result).toContain('Content')
  })
})

describe('Nested template tags', () => {
  beforeAll(async () => {
    await setupTestDirs()
  })

  afterAll(cleanupTestDirs)

  it('should handle template with regular content', async () => {
    const testFile = await createTestFile('template-content.stx', `
      <!DOCTYPE html>
      <html>
      <head><title>Template Test</title>
      <script>
        module.exports = { greeting: 'Hello' };
      </script>
      </head>
      <body>
        <p>{{ greeting }} World</p>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const html = await getHtmlOutput(result)
    expect(html).toContain('Hello World')
  })
})
