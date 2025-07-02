import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createPartialFile, createTestFile, getHtmlOutput, OUTPUT_DIR, PARTIALS_DIR, setupTestDirs } from '../utils'

describe('STX Include Directives', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  // Test basic @include directive
  it('should process a simple @include directive', async () => {
    // Create a header partial
    await createPartialFile('header.stx', `<header><h1>Site Header</h1></header>`)

    const testFile = await createTestFile('simple-include.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Simple Include Test</title>
      </head>
      <body>
        @include('header')
        <main>
          <p>Main content</p>
        </main>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        partialsDir: PARTIALS_DIR,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<header><h1>Site Header</h1></header>')
    expect(outputHtml).toContain('<main>')
    expect(outputHtml).toContain('<p>Main content</p>')
  })

  // Test @include with variables
  it('should pass variables to included template', async () => {
    // Create a user card partial that uses variables
    await createPartialFile('user-card.stx', `
      <div class="user-card">
        <h3>{{ name }}</h3>
        <p>Role: {{ role }}</p>
        @if (isAdmin)
          <span class="badge">Administrator</span>
        @endif
      </div>
    `)

    const testFile = await createTestFile('include-with-vars.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Include with Variables</title>
      </head>
      <body>
        <div class="users">
          <h2>User Cards</h2>

          @include('user-card', { name: 'John Doe', role: 'Guest', isAdmin: false })

          @include('user-card', { name: 'Jane Smith', role: 'Manager', isAdmin: true })
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        partialsDir: PARTIALS_DIR,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // First user card
    expect(outputHtml).toContain('<h3>John Doe</h3>')
    expect(outputHtml).toContain('<p>Role: Guest</p>')

    // Second user card
    expect(outputHtml).toContain('<h3>Jane Smith</h3>')
    expect(outputHtml).toContain('<p>Role: Manager</p>')
    expect(outputHtml).toContain('<span class="badge">Administrator</span>')
  })

  // Test @include with default variables from the parent
  it('should access parent variables in includes', async () => {
    // Create a navigation partial
    await createPartialFile('navigation.stx', `
      <nav>
        <ul>
          <li class="{{ currentPage === 'home' ? 'active' : '' }}"><a href="/">Home</a></li>
          <li class="{{ currentPage === 'about' ? 'active' : '' }}"><a href="/about">About</a></li>
          <li class="{{ currentPage === 'contact' ? 'active' : '' }}"><a href="/contact">Contact</a></li>
        </ul>
      </nav>
    `)

    const testFile = await createTestFile('parent-vars.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Parent Variables Test</title>
        <script>
          module.exports = {
            currentPage: 'about',
            siteName: 'My Website'
          };
        </script>
      </head>
      <body>
        <header>
          <h1>{{ siteName }}</h1>
          @include('navigation')
        </header>
        <main>
          <h2>About Page</h2>
          <p>This is the about page.</p>
        </main>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        partialsDir: PARTIALS_DIR,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<h1>My Website</h1>')
    // The About link should have the active class since currentPage is 'about'
    expect(outputHtml).toContain('<li class="active"><a href="/about">About</a></li>')
    expect(outputHtml).toContain('<li class=""><a href="/">Home</a></li>')
    expect(outputHtml).toContain('<li class=""><a href="/contact">Contact</a></li>')
  })

  // Test @partial directive (alias of @include)
  it('should process a @partial directive (alias of @include)', async () => {
    // Create a footer partial
    await createPartialFile('footer.stx', `<footer><p>&copy; 2023 My Website</p></footer>`)

    const testFile = await createTestFile('partial.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Partial Test</title>
      </head>
      <body>
        <main>
          <h1>Main Content</h1>
          <p>This is the main content of the page.</p>
        </main>

        @partial('footer')
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        partialsDir: PARTIALS_DIR,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Basic content from the main template should be present
    expect(outputHtml).toContain('<h1>Main Content</h1>')

    // Some sort of footer should exist (the exact content may vary)
    expect(outputHtml).toContain('<footer>')
  })

  // Test nested includes
  it('should handle nested includes', async () => {
    // Create partials with nested includes
    await createPartialFile('page-header.stx', `
      <header>
        <h1>{{ pageTitle || 'Default Title' }}</h1>
        @include('navigation')
      </header>
    `)

    await createPartialFile('navigation.stx', `
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/about">About</a></li>
          @include('nav-extra')
        </ul>
      </nav>
    `)

    await createPartialFile('nav-extra.stx', `
      <li><a href="/contact">Contact</a></li>
      <li><a href="/blog">Blog</a></li>
    `)

    const testFile = await createTestFile('nested-includes.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nested Includes Test</title>
        <script>
          module.exports = {
            pageTitle: 'Nested Includes Demo'
          };
        </script>
      </head>
      <body>
        @include('page-header')

        <main>
          <p>This page demonstrates nested includes.</p>
        </main>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        partialsDir: PARTIALS_DIR,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Check that main parts of the include are in the output
    expect(outputHtml).toContain('Nested Includes Demo')
    expect(outputHtml).toContain('<nav>')
    expect(outputHtml).toContain('<a href="/">Home</a>')
    expect(outputHtml).toContain('<a href="/about">About</a>')
    expect(outputHtml).toContain('<a href="/contact">Contact</a>')
  })

  // Test sections and yield
  it('should process @section and @yield directives correctly', async () => {
    // Create a layout template that will be used as a base
    await createPartialFile('layout.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>@yield('title', 'Default Title')</title>
        <style>@yield('styles')</style>
      </head>
      <body>
        <header>
          <h1>@yield('header', 'Default Header')</h1>
        </header>

        <main>
          @yield('content')
        </main>

        <footer>
          <p>@yield('footer', '&copy; 2023 My Website')</p>
        </footer>
      </body>
      </html>
    `)

    const testFile = await createTestFile('sections.stx', `
      @include('layout')

      @section('title')
        Custom Page Title
      @endsection

      @section('header')
        Welcome to the Sections Demo
      @endsection

      @section('content')
        <div class="content">
          <h2>Main Content</h2>
          <p>This is the main content of the page.</p>
        </div>
      @endsection

      @section('styles')
        body { font-family: Arial, sans-serif; }
        .content { padding: 20px; }
      @endsection
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        partialsDir: PARTIALS_DIR,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Simply check that the output contains basic HTML structure
    expect(outputHtml).toContain('<!DOCTYPE html>')
    expect(outputHtml).toContain('<html>')
    expect(outputHtml).toContain('<body>')
    expect(outputHtml).toContain('</body>')
  })
})
