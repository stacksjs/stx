import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from '../../packages/stx/src/index'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('STX Special Directives', () => {
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

        <script>
          // Regular JSON output
          const data = @json(data);

          // Pretty printed JSON
          const prettyData = @json(data, true);
        </script>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for compact JSON format
    expect(outputHtml).toContain('const data = {"users":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}],"settings":{"theme":"dark","notifications":true}};')

    // Check for pretty-printed JSON
    expect(outputHtml).toContain('const prettyData =')
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
          <script>
            function setupBoxes() {
              console.log('This duplicate should not appear');
            }
          </script>
        @endonce

        @once
          <script>
            function setupBoxes() {
              console.log('Boxes initialized');
            }
          </script>
        @endonce
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // There should be only one style block
    const styleCount = (outputHtml.match(/<style>/g) || []).length
    expect(styleCount).toBe(1)

    // There should be only one script block
    const scriptCount = (outputHtml.match(/<script>\s*function setupBoxes/g) || []).length
    expect(scriptCount).toBe(1)

    // Content outside @once should appear normally
    expect(outputHtml).toContain('<div class="box">Box 1</div>')
    expect(outputHtml).toContain('<div class="box">Box 2</div>')

    // Either version of the setupBoxes content should be present (but not both)
    const hasScript = outputHtml.includes('console.log(\'Boxes initialized\');')
      || outputHtml.includes('console.log(\'This duplicate should not appear\');')
    expect(hasScript).toBe(true)
  })

  it('should handle @env directive', async () => {
    const testFile = await createTestFile('env-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Env Directive Test</title>
        <script>
          module.exports = {
            NODE_ENV: 'production'
          };
        </script>
      </head>
      <body>
        <h1>Env Directive</h1>

        @env('production')
          <p class="prod-message">Production environment</p>
        @else
          <p class="dev-message">Non-production environment</p>
        @endenv

        @env('development')
          <p class="dev-only">Development environment</p>
        @elseenv('staging')
          <p class="staging-only">Staging environment</p>
        @else
          <p class="other-env">Neither development nor staging</p>
        @endenv

        @env(['local', 'development'])
          <p class="local-dev">Local or Development environment</p>
        @else
          <p class="prod-like">Production-like environment</p>
        @endenv
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<p class="prod-message">Production environment</p>')
    expect(outputHtml).not.toContain('<p class="dev-message">Non-production environment</p>')

    expect(outputHtml).not.toContain('<p class="dev-only">Development environment</p>')
    expect(outputHtml).not.toContain('<p class="staging-only">Staging environment</p>')
    expect(outputHtml).toContain('<p class="other-env">Neither development nor staging</p>')

    expect(outputHtml).not.toContain('<p class="local-dev">Local or Development environment</p>')
    expect(outputHtml).toContain('<p class="prod-like">Production-like environment</p>')
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
      plugins: [stxPlugin],
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
    const testFile = await createTestFile('error-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error Directive Test</title>
        <script>
          module.exports = {
            errors: {
              has: function(field) {
                return field === 'email' || field === 'password';
              },
              first: function(field) {
                if (field === 'email') {
                  return 'The email is invalid.';
                }
                if (field === 'password') {
                  return 'The password must be at least 8 characters.';
                }
                return '';
              },
              get: function(field) {
                if (field === 'email') {
                  return ['The email is invalid.', 'The email is already taken.'];
                }
                return [];
              }
            }
          };
        </script>
      </head>
      <body>
        <h1>Error Directive</h1>

        <form>
          <div class="form-group">
            <label>Email</label>
            <input type="email" name="email" class="form-control">
            @error('email')
              <span class="error">{{ errors.first('email') }}</span>
            @enderror
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" name="password" class="form-control">
            @error('password')
              <span class="error">{{ errors.first('password') }}</span>
            @enderror
          </div>

          <div class="form-group">
            <label>Name</label>
            <input type="text" name="name" class="form-control">
            @error('name')
              <span class="error">{{ errors.first('name') }}</span>
            @enderror
          </div>
        </form>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<span class="error">The email is invalid.</span>')
    expect(outputHtml).toContain('<span class="error">The password must be at least 8 characters.</span>')
    expect(outputHtml).not.toContain('errors.first(\'name\')')
  })

  it('should handle @csrf directive', async () => {
    const testFile = await createTestFile('csrf-directive.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>CSRF Directive Test</title>
        <script>
          module.exports = {
            csrf: {
              token: '12345abcde',
              field: '<input type="hidden" name="_token" value="12345abcde">'
            }
          };
        </script>
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
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<input type="hidden" name="_token" value="12345abcde">')
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
      plugins: [stxPlugin],
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

        @stack('scripts')
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

      @push('scripts')
        <script>
          console.log('App initialized');
        </script>
      @endpush

      @push('scripts')
        <script>
          console.log('Analytics tracking');
        </script>
      @endpush

      @prepend('scripts')
        <script>
          console.log('Vendor loaded');
        </script>
      @endprepend
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Check for style tag with content
    expect(outputHtml).toContain('<style>')
    expect(outputHtml).toContain('.box { padding: 10px; }')

    // Check for script with content
    expect(outputHtml).toContain('console.log(\'Vendor loaded\');')

    // Check for additional scripts
    expect(outputHtml.indexOf('Vendor loaded')).toBeLessThan(outputHtml.indexOf('Analytics tracking'))
  })
})
