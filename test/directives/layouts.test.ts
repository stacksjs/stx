import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import stxPlugin from '../../src/index'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs, TEMP_DIR } from '../utils'

describe('STX Layout Directives', () => {
  const LAYOUTS_DIR = path.join(TEMP_DIR, 'layouts')
  const PARTIALS_DIR = path.join(TEMP_DIR, 'partials')

  beforeAll(async () => {
    await setupTestDirs()
    await fs.promises.mkdir(LAYOUTS_DIR, { recursive: true })
    await fs.promises.mkdir(PARTIALS_DIR, { recursive: true })
  })

  afterAll(cleanupTestDirs)

  it('should properly handle @extends and @section directives', async () => {
    // Create a layout file
    await fs.promises.mkdir(path.join(TEMP_DIR, 'layouts'), { recursive: true })
    const layoutFile = await createTestFile('layouts/main.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>@yield('title', 'Default Title')</title>
        @yield('meta')
      </head>
      <body>
        <header>
          <h1>@yield('header', 'Default Header')</h1>
        </header>

        <main>
          @yield('content')
        </main>

        <footer>
          @yield('footer', '&copy; ' + new Date().getFullYear())
        </footer>
      </body>
      </html>
    `)

    // Create a page that extends the layout
    const testFile = await createTestFile('extends-basic.stx', `
      @extends('layouts/main.stx')

      @section('title', 'Page Title')

      @section('header')
        <h1>Custom Header</h1>
      @endsection

      @section('content')
        <div class="container">
          <p>This is the main content of the page.</p>
        </div>
      @endsection
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
      stx: {
        // Define the right paths for partials and components
        partialsDir: TEMP_DIR,
        componentsDir: TEMP_DIR,
        debug: true,
      },
    })

    const outputHtml = await getHtmlOutput(result)

    // Just check that the build completes successfully
    expect(outputHtml).toContain('<title>Page Title</title>')
    expect(true).toBe(true)
  })

  it('should properly handle @parent directive in sections', async () => {
    // Create a layout file with section defaults
    const layoutFile = path.join(LAYOUTS_DIR, 'with-sections.stx')
    await Bun.write(layoutFile, `
      <!DOCTYPE html>
      <html>
      <head>
        <title>@yield('title', 'Default Title')</title>

        @section('styles')
          <link rel="stylesheet" href="/css/main.css">
        @show
      </head>
      <body>
        <header>
          @section('header')
            <h1>Site Header</h1>
            <nav>
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </nav>
          @show
        </header>

        <main>
          @yield('content')
        </main>

        <footer>
          @section('footer')
            <p>&copy; My Website</p>
          @show
        </footer>

        @section('scripts')
          <script src="/js/main.js"></script>
        @show
      </body>
      </html>
    `)

    // Create a page that extends the layout and uses @parent
    const testFile = await createTestFile('extends-parent.stx', `
      @extends('layouts/with-sections')

      @section('title', 'Page with Parent Sections')

      @section('styles')
        @parent
        <link rel="stylesheet" href="/css/page.css">
      @endsection

      @section('header')
        @parent
        <p class="breadcrumbs">Home > Page</p>
      @endsection

      @section('content')
        <div class="container">
          <h2>Main Content</h2>
          <p>This is the page content.</p>
        </div>
      @endsection

      @section('footer')
        @parent
        <p>Additional footer content</p>
      @endsection

      @section('scripts')
        @parent
        <script src="/js/page.js"></script>
      @endsection
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Page title
    expect(outputHtml).toContain('<title>Page with Parent Sections</title>')

    // Styles section should contain both CSS files
    expect(outputHtml).toContain('<link rel="stylesheet" href="/css/main.css">')
    expect(outputHtml).toContain('<link rel="stylesheet" href="/css/page.css">')

    // Header should contain parent content and additional content
    expect(outputHtml).toContain('<h1>Site Header</h1>')
    expect(outputHtml).toContain('<nav>')
    expect(outputHtml).toContain('<a href="/">Home</a>')
    expect(outputHtml).toContain('<p class="breadcrumbs">Home > Page</p>')

    // Content section
    expect(outputHtml).toContain('<h2>Main Content</h2>')
    expect(outputHtml).toContain('<p>This is the page content.</p>')

    // Footer should contain parent and child content
    expect(outputHtml).toContain('<p>&copy; My Website</p>')
    expect(outputHtml).toContain('<p>Additional footer content</p>')

    // Scripts section should contain both script tags
    expect(outputHtml).toContain('<script src="/js/main.js"></script>')
    expect(outputHtml).toContain('<script src="/js/page.js"></script>')

    expect(true).toBe(true)
  })

  it('should properly handle @include directive', async () => {
    // Create partial files
    const headerPartial = path.join(PARTIALS_DIR, 'header.stx')
    await Bun.write(headerPartial, `
      <header>
        <h1>{{ title || 'Default Title' }}</h1>
        <nav>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </header>
    `)

    const sidebarPartial = path.join(PARTIALS_DIR, 'sidebar.stx')
    await Bun.write(sidebarPartial, `
      <aside class="sidebar">
        <h3>{{ sidebarTitle || 'Related' }}</h3>
        <ul>
          @foreach(links as link)
            <li><a href="{{ link.url }}">{{ link.text }}</a></li>
          @endforeach
        </ul>
      </aside>
    `)

    const footerPartial = path.join(PARTIALS_DIR, 'footer.stx')
    await Bun.write(footerPartial, `
      <footer>
        <p>&copy; {{ year || new Date().getFullYear() }} {{ company || 'Company Name' }}</p>
      </footer>
    `)

    // Create a page that includes the partials
    const testFile = await createTestFile('include-test.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Include Test</title>
        <script>
          module.exports = {
            title: 'My Website',
            sidebarTitle: 'Quick Links',
            links: [
              { url: '/products', text: 'Products' },
              { url: '/services', text: 'Services' },
              { url: '/support', text: 'Support' }
            ],
            company: 'ACME Inc',
            year: 2023
          };
        </script>
      </head>
      <body>
        @include('partials/header')

        <div class="content">
          <main>
            <h2>Welcome to our site</h2>
            <p>This is the main content area.</p>
          </main>

          @include('partials/sidebar')
        </div>

        @include('partials/footer')
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Header partial
    expect(outputHtml).toContain('<h1>My Website</h1>')
    expect(outputHtml).toContain('<nav>')
    expect(outputHtml).toContain('<a href="/">Home</a>')

    // Main content (not from partials)
    expect(outputHtml).toContain('<h2>Welcome to our site</h2>')

    // Sidebar partial
    expect(outputHtml).toContain('<aside class="sidebar">')
    expect(outputHtml).toContain('<h3>Quick Links</h3>')
    expect(outputHtml).toContain('<a href="/products">Products</a>')
    expect(outputHtml).toContain('<a href="/services">Services</a>')
    expect(outputHtml).toContain('<a href="/support">Support</a>')

    // Footer partial
    expect(outputHtml).toContain('<p>&copy; 2023 ACME Inc</p>')

    expect(true).toBe(true)
  })

  it('should properly handle @includeIf, @includeWhen, and @includeUnless directives', async () => {
    // Create some partial files
    const menuPartial = path.join(PARTIALS_DIR, 'admin-menu.stx')
    await Bun.write(menuPartial, `
      <div class="admin-menu">
        <h3>Admin Menu</h3>
        <ul>
          <li><a href="/admin/dashboard">Dashboard</a></li>
          <li><a href="/admin/users">Users</a></li>
          <li><a href="/admin/settings">Settings</a></li>
        </ul>
      </div>
    `)

    const userMenuPartial = path.join(PARTIALS_DIR, 'user-menu.stx')
    await Bun.write(userMenuPartial, `
      <div class="user-menu">
        <h3>User Menu</h3>
        <ul>
          <li><a href="/profile">Profile</a></li>
          <li><a href="/orders">Orders</a></li>
          <li><a href="/settings">Settings</a></li>
        </ul>
      </div>
    `)

    const guestMenuPartial = path.join(PARTIALS_DIR, 'guest-menu.stx')
    await Bun.write(guestMenuPartial, `
      <div class="guest-menu">
        <h3>Guest Menu</h3>
        <ul>
          <li><a href="/login">Login</a></li>
          <li><a href="/register">Register</a></li>
        </ul>
      </div>
    `)

    const nonExistentPartial = path.join(PARTIALS_DIR, 'non-existent.stx')
    // We deliberately don't create this file

    // Create test file for conditional includes
    const testFile = await createTestFile('conditional-includes.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Conditional Includes Test</title>
        <script>
          module.exports = {
            isAdmin: true,
            isLoggedIn: true,
            showAdminMenu: true,
            userName: 'John'
          };
        </script>
      </head>
      <body>
        <h1>Conditional Includes</h1>

        <!-- includeIf - file exists -->
        <div class="section">
          <h2>Include If (file exists)</h2>
          @includeIf('partials/admin-menu')
        </div>

        <!-- includeIf - file doesn't exist (should be empty) -->
        <div class="section">
          <h2>Include If (file doesn't exist)</h2>
          @includeIf('partials/non-existent')
        </div>

        <!-- includeWhen - condition is true -->
        <div class="section">
          <h2>Include When (true condition)</h2>
          @includeWhen(isAdmin, 'partials/admin-menu')
        </div>

        <!-- includeWhen - condition is false -->
        <div class="section">
          <h2>Include When (false condition)</h2>
          @includeWhen(!isLoggedIn, 'partials/guest-menu')
        </div>

        <!-- includeUnless - condition is false -->
        <div class="section">
          <h2>Include Unless (false condition)</h2>
          @includeUnless(!isLoggedIn, 'partials/user-menu')
        </div>

        <!-- includeUnless - condition is true -->
        <div class="section">
          <h2>Include Unless (true condition)</h2>
          @includeUnless(showAdminMenu, 'partials/guest-menu')
        </div>

        <!-- includeFirst - tries multiple files, uses first that exists -->
        <div class="section">
          <h2>Include First</h2>
          @includeFirst(['partials/non-existent', 'partials/admin-menu'])
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // includeIf with file that exists
    expect(outputHtml).toContain('<div class="admin-menu">')
    expect(outputHtml).toContain('<h3>Admin Menu</h3>')

    // includeIf with file that doesn't exist (should be empty)
    expect(outputHtml).not.toContain('non-existent')

    // includeWhen with true condition
    expect(outputHtml.indexOf('Admin Menu') !== outputHtml.lastIndexOf('Admin Menu')).toBe(true) // Should appear multiple times

    // includeWhen with false condition
    expect(outputHtml).not.toContain('<h3>Guest Menu</h3>')

    // includeUnless with false condition
    expect(outputHtml).toContain('<div class="user-menu">')
    expect(outputHtml).toContain('<h3>User Menu</h3>')

    // includeUnless with true condition
    expect(outputHtml).not.toContain('<div class="guest-menu">')

    // includeFirst (should include admin-menu since non-existent doesn't exist)
    expect(outputHtml.indexOf('Admin Menu') !== outputHtml.lastIndexOf('Admin Menu')).toBe(true) // Should appear multiple times

    expect(true).toBe(true)
  })

  it('should properly handle nested layouts', async () => {
    // Create a base layout
    const baseLayout = path.join(LAYOUTS_DIR, 'base.stx')
    await Bun.write(baseLayout, `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>@yield('title', 'Base Title')</title>
        @yield('meta')

        @section('styles')
          <link rel="stylesheet" href="/css/base.css">
        @show
      </head>
      <body>
        <div class="container">
          @yield('body')
        </div>

        @section('scripts')
          <script src="/js/base.js"></script>
        @show
      </body>
      </html>
    `)

    // Create a child layout that extends the base
    const appLayout = path.join(LAYOUTS_DIR, 'app.stx')
    await Bun.write(appLayout, `
      @extends('layouts/base')

      @section('styles')
        @parent
        <link rel="stylesheet" href="/css/app.css">
      @endsection

      @section('body')
        <header>
          <h1>App Header</h1>
          <nav>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/dashboard">Dashboard</a></li>
            </ul>
          </nav>
        </header>

        <main>
          @yield('content')
        </main>

        <footer>
          <p>&copy; 2023 App Footer</p>
        </footer>
      @endsection

      @section('scripts')
        @parent
        <script src="/js/app.js"></script>
      @endsection
    `)

    // Create a page that extends the app layout
    const testFile = await createTestFile('nested-layout.stx', `
      @extends('layouts/app')

      @section('title', 'Page Title')

      @section('meta')
        <meta name="description" content="This is a page description">
      @endsection

      @section('content')
        <div class="page-content">
          <h2>Page Heading</h2>
          <p>This is the content of the page.</p>
        </div>
      @endsection

      @section('styles')
        @parent
        <link rel="stylesheet" href="/css/page.css">
      @endsection

      @section('scripts')
        @parent
        <script src="/js/page.js"></script>
      @endsection
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin],
    })

    const outputHtml = await getHtmlOutput(result)

    // Title from page
    expect(outputHtml).toContain('<title>Page Title</title>')

    // Meta tag from page
    expect(outputHtml).toContain('<meta name="description" content="This is a page description">')

    // CSS from all levels
    expect(outputHtml).toContain('<link rel="stylesheet" href="/css/base.css">')
    expect(outputHtml).toContain('<link rel="stylesheet" href="/css/app.css">')
    expect(outputHtml).toContain('<link rel="stylesheet" href="/css/page.css">')

    // Structure from app layout
    expect(outputHtml).toContain('<header>')
    expect(outputHtml).toContain('<h1>App Header</h1>')
    expect(outputHtml).toContain('<main>')
    expect(outputHtml).toContain('<footer>')
    expect(outputHtml).toContain('<p>&copy; 2023 App Footer</p>')

    // Content from page
    expect(outputHtml).toContain('<div class="page-content">')
    expect(outputHtml).toContain('<h2>Page Heading</h2>')
    expect(outputHtml).toContain('<p>This is the content of the page.</p>')

    // Scripts from all levels
    expect(outputHtml).toContain('<script src="/js/base.js"></script>')
    expect(outputHtml).toContain('<script src="/js/app.js"></script>')
    expect(outputHtml).toContain('<script src="/js/page.js"></script>')

    expect(true).toBe(true)
  })
})
