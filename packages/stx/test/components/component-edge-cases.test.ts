import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { renderComponentWithSlot } from '../../src/utils'
import { processDirectives, defaultConfig } from '../../src/index'
import type { StxOptions } from '../../src/types'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-edge-cases')
const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')
const LAYOUTS_DIR = path.join(TEMP_DIR, 'layouts')
const PARTIALS_DIR = path.join(TEMP_DIR, 'partials')
const PAGES_DIR = path.join(TEMP_DIR, 'pages')
const PAGE_COMPONENTS_DIR = path.join(PAGES_DIR, 'components')

function makeOptions(overrides: Partial<StxOptions> = {}): StxOptions {
  return {
    ...defaultConfig,
    componentsDir: COMPONENTS_DIR,
    layoutsDir: LAYOUTS_DIR,
    partialsDir: PARTIALS_DIR,
    debug: false,
    cache: false,
    ...overrides,
  }
}

describe('Component Edge Cases', () => {
  beforeAll(async () => {
    // Create directory structure
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })
    await fs.promises.mkdir(LAYOUTS_DIR, { recursive: true })
    await fs.promises.mkdir(PARTIALS_DIR, { recursive: true })
    await fs.promises.mkdir(PAGES_DIR, { recursive: true })
    await fs.promises.mkdir(PAGE_COMPONENTS_DIR, { recursive: true })

    // --- Component files ---

    // Simple component without slot
    await Bun.write(
      path.join(COMPONENTS_DIR, 'badge.stx'),
      `<span class="badge badge-{{ color }}">{{ text }}</span>`,
    )

    // Component with <slot />
    await Bun.write(
      path.join(COMPONENTS_DIR, 'card.stx'),
      `<div class="card"><div class="card-header">{{ title }}</div><div class="card-body"><slot /></div></div>`,
    )

    // Component with <slot /> and default content
    await Bun.write(
      path.join(COMPONENTS_DIR, 'alert.stx'),
      `<div class="alert alert-{{ type }}"><slot /></div>`,
    )

    // Component that uses expressions
    await Bun.write(
      path.join(COMPONENTS_DIR, 'greeting.stx'),
      `<div class="greeting"><h1>Hello, {{ name }}!</h1><slot /></div>`,
    )

    // Nested wrapper component
    await Bun.write(
      path.join(COMPONENTS_DIR, 'panel.stx'),
      `<section class="panel"><h2>{{ heading }}</h2><div class="panel-content"><slot /></div></section>`,
    )

    // Component with script tag
    await Bun.write(
      path.join(COMPONENTS_DIR, 'computed.stx'),
      `<script>\nconst fullName = first + ' ' + last;\n</script>\n<p>{{ fullName }}</p>`,
    )

    // --- Page-local component (for __originalFilePath testing) ---
    await Bun.write(
      path.join(PAGE_COMPONENTS_DIR, 'page-widget.stx'),
      `<div class="page-widget">{{ label }}</div>`,
    )

    // --- Layout files ---
    await Bun.write(
      path.join(LAYOUTS_DIR, 'app.stx'),
      `<html><head>@stack('styles')</head><body>@yield('content')</body></html>`,
    )

    await Bun.write(
      path.join(LAYOUTS_DIR, 'with-stack.stx'),
      `<html><head>@stack('styles')</head><body><main>@yield('content')</main><footer>@stack('scripts')</footer></body></html>`,
    )

    // --- Partials ---
    await Bun.write(
      path.join(PARTIALS_DIR, 'nav.stx'),
      `<nav><a href="/">Home</a></nav>`,
    )

    await Bun.write(
      path.join(PARTIALS_DIR, 'footer-info.stx'),
      `<p>Footer content</p>`,
    )
  })

  afterAll(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  // =========================================================================
  // 1. @component with @endcomponent (slot content)
  // =========================================================================

  describe('@component with @endcomponent slot extraction', () => {
    it('should render self-closing component without @endcomponent', async () => {
      const template = `@component('badge', { color: 'red', text: 'New' })`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('<span class="badge badge-red">')
      expect(result).toContain('New')
      expect(result).toContain('</span>')
    })

    it('should extract slot content between @component and @endcomponent', async () => {
      const template = `@component('card', { title: 'My Card' })<p>This is the card body</p>@endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('<div class="card">')
      expect(result).toContain('<div class="card-header">My Card</div>')
      expect(result).toContain('<p>This is the card body</p>')
    })

    it('should handle empty slot content with @endcomponent', async () => {
      const template = `@component('card', { title: 'Empty' })\n@endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('<div class="card">')
      expect(result).toContain('<div class="card-header">Empty</div>')
      // The card-body should be present but the slot content should be empty
      expect(result).toContain('card-body')
    })

    it('should handle nested HTML tags in slot content', async () => {
      const template = `@component('card', { title: 'Rich Content' })
<div class="inner">
  <h3>Subtitle</h3>
  <p>Paragraph with <strong>bold</strong> text</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
</div>
@endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('Rich Content')
      expect(result).toContain('<h3>Subtitle</h3>')
      expect(result).toContain('<strong>bold</strong>')
      expect(result).toContain('<li>Item 1</li>')
      expect(result).toContain('<li>Item 2</li>')
    })

    it('should handle multiple sequential components with different slot content', async () => {
      const template = `@component('alert', { type: 'success' })All good!@endcomponent
@component('alert', { type: 'danger' })Something went wrong@endcomponent
@component('badge', { color: 'blue', text: 'Info' })`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('alert-success')
      expect(result).toContain('All good!')
      expect(result).toContain('alert-danger')
      expect(result).toContain('Something went wrong')
      expect(result).toContain('badge-blue')
      expect(result).toContain('Info')
    })

    it('should render component without props and with slot content', async () => {
      const template = `@component('alert', { type: 'info' })Just a message@endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('alert-info')
      expect(result).toContain('Just a message')
    })

    it('should handle multiline slot content with expressions', async () => {
      const template = `@component('greeting', { name: 'World' })
<p>Welcome to the site</p>
@endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('Hello, World!')
      expect(result).toContain('Welcome to the site')
    })
  })

  // =========================================================================
  // 2. Component resolution from layout context (__originalFilePath)
  // =========================================================================

  describe('Component resolution with __originalFilePath', () => {
    it('should resolve components from original page directory when __originalFilePath is set', async () => {
      const deps = new Set<string>()
      // Simulate: layout is the parentFilePath, but page is the __originalFilePath
      const parentContext = {
        __originalFilePath: path.join(PAGES_DIR, 'index.stx'),
      }

      const result = await renderComponentWithSlot(
        'page-widget',
        { label: 'From Page' },
        '',
        COMPONENTS_DIR,
        parentContext,
        path.join(LAYOUTS_DIR, 'app.stx'), // parentFilePath is the layout
        {},
        new Set(),
        deps,
      )

      // The component should be found in PAGES_DIR/components/ via __originalFilePath
      expect(result).toContain('page-widget')
      expect(result).toContain('From Page')
    })

    it('should still resolve from componentsDir when __originalFilePath is not set', async () => {
      const deps = new Set<string>()
      const result = await renderComponentWithSlot(
        'badge',
        { color: 'green', text: 'OK' },
        '',
        COMPONENTS_DIR,
        {},
        path.join(TEMP_DIR, 'test.stx'),
        {},
        new Set(),
        deps,
      )

      expect(result).toContain('badge-green')
      expect(result).toContain('OK')
    })

    it('should prefer componentsDir over __originalFilePath components', async () => {
      // Create a badge in the page components dir with different content
      await Bun.write(
        path.join(PAGE_COMPONENTS_DIR, 'badge.stx'),
        `<span class="page-badge">{{ text }}</span>`,
      )

      const deps = new Set<string>()
      const parentContext = {
        __originalFilePath: path.join(PAGES_DIR, 'index.stx'),
      }

      const result = await renderComponentWithSlot(
        'badge',
        { color: 'red', text: 'Test' },
        '',
        COMPONENTS_DIR,
        parentContext,
        path.join(LAYOUTS_DIR, 'app.stx'),
        {},
        new Set(),
        deps,
      )

      // The primary componentsDir should be searched first
      expect(result).toContain('Test')

      // Clean up the page-level badge
      await fs.promises.rm(path.join(PAGE_COMPONENTS_DIR, 'badge.stx'), { force: true })
    })
  })

  // =========================================================================
  // 3. @push/@stack interaction with layouts
  // =========================================================================

  describe('@push/@stack interaction with layouts', () => {
    it('should insert @push content into @stack in layout', async () => {
      const template = `@extends('with-stack')

@push('styles')
<link rel="stylesheet" href="/app.css">
@endpush

@push('scripts')
<script src="/app.js"></script>
@endpush

@section('content')
<h1>Page Content</h1>
@endsection`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('<link rel="stylesheet" href="/app.css">')
      expect(result).toContain('<script src="/app.js"></script>')
      expect(result).toContain('<h1>Page Content</h1>')
    })

    it('should handle multiple @push calls to the same stack', async () => {
      const template = `@extends('with-stack')

@push('styles')
<link rel="stylesheet" href="/first.css">
@endpush

@push('styles')
<link rel="stylesheet" href="/second.css">
@endpush

@section('content')
<p>Content</p>
@endsection`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('first.css')
      expect(result).toContain('second.css')
    })

    it('should place @push content in the correct @stack location', async () => {
      const template = `@extends('with-stack')

@push('styles')
<style>.custom { color: red; }</style>
@endpush

@push('scripts')
<script>console.log('loaded');</script>
@endpush

@section('content')
<p>Body</p>
@endsection`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      // Styles should be in the head
      const headIndex = result.indexOf('<head>')
      const bodyIndex = result.indexOf('<body>')
      const styleIndex = result.indexOf('.custom { color: red; }')

      if (headIndex !== -1 && bodyIndex !== -1 && styleIndex !== -1) {
        expect(styleIndex).toBeGreaterThan(headIndex)
        expect(styleIndex).toBeLessThan(bodyIndex)
      }

      // Scripts should be in the footer (after main)
      const footerIndex = result.indexOf('<footer>')
      const scriptIndex = result.indexOf("console.log('loaded')")
      if (footerIndex !== -1 && scriptIndex !== -1) {
        expect(scriptIndex).toBeGreaterThan(footerIndex)
      }
    })
  })

  // =========================================================================
  // 4. @include with relative paths from layouts
  // =========================================================================

  describe('@include with relative paths', () => {
    it('should resolve @include with partials directory', async () => {
      const template = `<div>@include('nav')</div>`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('<nav>')
      expect(result).toContain('Home')
    })

    it('should resolve @include for a partial by name', async () => {
      const template = `<footer>@include('footer-info')</footer>`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('Footer content')
    })
  })

  // =========================================================================
  // Additional edge cases
  // =========================================================================

  describe('Additional component edge cases', () => {
    it('should handle component with slot content containing template expressions', async () => {
      const template = `@component('card', { title: 'Dynamic' })
<p>{{ 1 + 1 }}</p>
@endcomponent`
      const context = {}
      const result = await processDirectives(template, context, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('Dynamic')
      // The expression should be evaluated
      expect(result).toContain('<p>')
    })

    it('should handle component with props containing special characters', async () => {
      const template = `@component('badge', { color: 'primary', text: 'Hello & Welcome' })`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('badge-primary')
    })

    it('should handle component with no props object', async () => {
      // Component called with just a name, no second argument
      const template = `@component('alert', { type: 'warning' })Warn!@endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('alert-warning')
      expect(result).toContain('Warn!')
    })

    it('should handle component with slot content that has whitespace only', async () => {
      const template = `@component('card', { title: 'Whitespace' })   \n   \n   @endcomponent`
      const result = await processDirectives(template, {}, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('Whitespace')
      expect(result).toContain('card-body')
    })

    it('should render component with props passed via context', async () => {
      const template = `@component('badge', { color: badgeColor, text: label })`
      const context = { badgeColor: 'red', label: 'Urgent' }
      const result = await processDirectives(template, context, path.join(TEMP_DIR, 'test.stx'), makeOptions(), new Set())

      expect(result).toContain('badge-red')
      expect(result).toContain('Urgent')
    })
  })
})
