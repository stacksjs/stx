import type { StxOptions } from '../../src/types'
/**
 * Full Build Pipeline Integration Tests
 *
 * These tests verify the complete build pipeline from template input to HTML output,
 * testing the integration of all processing stages together.
 *
 * These tests use processDirectives directly to test the core template processing,
 * as the Bun.build integration uses 'file' loader which doesn't generate .html outputs.
 */
import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { extractVariables, processDirectives } from '../../src'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-build-pipeline')
const COMPONENTS_DIR = path.join(TEMP_DIR, 'components')
const LAYOUTS_DIR = path.join(TEMP_DIR, 'layouts')
const PARTIALS_DIR = path.join(TEMP_DIR, 'partials')

/**
 * Helper to process a template string with script extraction and directive processing
 */
async function processTemplate(
  content: string,
  filePath: string,
  options: Partial<StxOptions> = {},
): Promise<string> {
  // Extract script content (only non-module scripts for server-side)
  const scriptMatch = content.match(/<script(?![^>]*\stype\s*=\s*["']?module["'])[^>]*>([\s\S]*?)<\/script>/i)
  const scriptContent = scriptMatch ? scriptMatch[1] : ''
  // Remove only non-module scripts from template
  const templateContent = content.replace(/<script(?![^>]*\stype\s*=\s*["']?module["'])[^>]*>[\s\S]*?<\/script>/gi, '')

  // Create context and extract variables
  const context: Record<string, any> = {
    __filename: filePath,
    __dirname: path.dirname(filePath),
  }

  if (scriptContent.trim()) {
    await extractVariables(scriptContent, context, filePath)
  }

  // Process directives
  const fullOptions: StxOptions = {
    componentsDir: options.componentsDir || COMPONENTS_DIR,
    partialsDir: options.partialsDir || PARTIALS_DIR,
    debug: options.debug ?? false,
    cache: false,
    ...options,
  }

  const dependencies = new Set<string>()
  return await processDirectives(templateContent, context, filePath, fullOptions, dependencies)
}

describe('Full Build Pipeline Integration', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(COMPONENTS_DIR, { recursive: true })
    await fs.promises.mkdir(LAYOUTS_DIR, { recursive: true })
    await fs.promises.mkdir(PARTIALS_DIR, { recursive: true })
  })

  afterAll(async () => {
    await Bun.$`rm -rf ${TEMP_DIR}`.quiet()
  })

  describe('Simple Template to HTML', () => {
    it('should process a minimal template', async () => {
      const template = `<!DOCTYPE html>
<html>
<head><title>Minimal</title></head>
<body><p>Hello World</p></body>
</html>`

      const html = await processTemplate(template, '/test/minimal.stx')
      expect(html).toContain('Hello World')
    })

    it('should process template with script variables', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <title>Variables Test</title>
  <script>
    const title = "Dynamic Title"
    const count = 42
    const items = ['apple', 'banana', 'cherry']
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  <p>Count: {{ count }}</p>
  <p>First item: {{ items[0] }}</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/vars.stx')
      expect(html).toContain('Dynamic Title')
      expect(html).toContain('Count: 42')
      expect(html).toContain('First item: apple')
    })

    it('should handle exported and non-exported variables equally', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    export const exported = "I am exported"
    const notExported = "I am not exported"
    let mutableVar = "I can change"
    var oldStyle = "Old school var"

    function greet(name) {
      return "Hello, " + name
    }
  </script>
</head>
<body>
  <p>{{ exported }}</p>
  <p>{{ notExported }}</p>
  <p>{{ mutableVar }}</p>
  <p>{{ oldStyle }}</p>
  <p>{{ greet('World') }}</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/exports.stx')
      expect(html).toContain('I am exported')
      expect(html).toContain('I am not exported')
      expect(html).toContain('I can change')
      expect(html).toContain('Old school var')
      expect(html).toContain('Hello, World')
    })
  })

  describe('Directive Processing Order', () => {
    it('should process loops before conditionals', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const items = [
      { name: 'Item 1', visible: true },
      { name: 'Item 2', visible: false },
      { name: 'Item 3', visible: true }
    ]
  </script>
</head>
<body>
  @foreach (items as item)
    @if (item.visible)
      <div class="visible">{{ item.name }}</div>
    @else
      <div class="hidden">{{ item.name }} (hidden)</div>
    @endif
  @endforeach
</body>
</html>`

      const html = await processTemplate(template, '/test/order.stx')
      expect(html).toContain('<div class="visible">Item 1</div>')
      expect(html).toContain('<div class="hidden">Item 2 (hidden)</div>')
      expect(html).toContain('<div class="visible">Item 3</div>')
    })

    it('should process @js before other directives', async () => {
      const template = `<!DOCTYPE html>
<html>
<head></head>
<body>
  @js
    const dynamicValue = "Set by @js directive"
    const showSection = true
  @endjs

  <p>{{ dynamicValue }}</p>

  @if (showSection)
    <section>This section is controlled by @js variable</section>
  @endif
</body>
</html>`

      const html = await processTemplate(template, '/test/js-order.stx')
      expect(html).toContain('Set by @js directive')
      expect(html).toContain('This section is controlled by @js variable')
    })

    it('should process expressions after all directives', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const baseValue = 10
    const items = [1, 2, 3]
  </script>
</head>
<body>
  <p>Base: {{ baseValue }}</p>
  @foreach (items as item)
    <p>{{ baseValue + item }}</p>
  @endforeach
</body>
</html>`

      const html = await processTemplate(template, '/test/expr-last.stx')
      expect(html).toContain('Base: 10')
      expect(html).toContain('<p>11</p>')
      expect(html).toContain('<p>12</p>')
      expect(html).toContain('<p>13</p>')
    })
  })

  describe('Layout and Component Integration', () => {
    it('should process @yield with default values', async () => {
      // Test @yield directive directly without @extends
      const template = `<!DOCTYPE html>
<html>
<head>
  <title>@yield('title', 'Default Title')</title>
</head>
<body>
  @yield('content', 'No content provided')
</body>
</html>`

      const html = await processTemplate(template, '/test/yield.stx')
      expect(html).toContain('Default Title')
      expect(html).toContain('No content provided')
    })

    it('should process @component directive', async () => {
      // Create component file
      const componentContent = `<button class="btn btn-{{ type || 'default' }}">
  {{ label }}
</button>`
      await Bun.write(path.join(COMPONENTS_DIR, 'btn.stx'), componentContent)

      const template = `<!DOCTYPE html>
<html>
<head><title>Components</title></head>
<body>
  @component('btn', { label: 'Click Me', type: 'primary' })
</body>
</html>`

      const html = await processTemplate(template, path.join(TEMP_DIR, 'components.stx'))
      expect(html).toContain('btn-primary')
      expect(html).toContain('Click Me')
    })
  })

  describe('Include and Partial Processing', () => {
    it('should process @include with static context', async () => {
      // Create partial file
      const partialContent = `<div class="user-card">
  <h3>{{ name }}</h3>
  <p>{{ email }}</p>
</div>`
      await Bun.write(path.join(PARTIALS_DIR, 'simple-card.stx'), partialContent)

      const template = `<!DOCTYPE html>
<html>
<body>
  @include('simple-card', { name: 'Alice', email: 'alice@example.com' })
</body>
</html>`

      const html = await processTemplate(template, path.join(TEMP_DIR, 'includes.stx'))
      expect(html).toContain('Alice')
      expect(html).toContain('alice@example.com')
    })

    it('should handle @includeIf for optional includes', async () => {
      const template = `<!DOCTYPE html>
<html>
<body>
  <p>Before include</p>
  @includeIf('non-existent-partial')
  <p>After include - should still render</p>
</body>
</html>`

      const html = await processTemplate(template, path.join(TEMP_DIR, 'includeif.stx'))
      expect(html).toContain('Before include')
      expect(html).toContain('After include - should still render')
    })
  })

  describe('Expression Filters', () => {
    it('should apply built-in filters', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const text = "hello world"
    const number = 1234.5678
    const items = ['a', 'b', 'c']
  </script>
</head>
<body>
  <p>{{ text | uppercase }}</p>
  <p>{{ text | capitalize }}</p>
  <p>{{ number | number(2) }}</p>
  <p>{{ items | join(',') }}</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/filters.stx')
      expect(html).toContain('HELLO WORLD')
      expect(html).toContain('Hello world')
      // number filter returns fixed decimal, toLocaleString may vary by locale
      expect(html).toContain('1234.57')
      expect(html).toContain('a,b,c')
    })
  })

  describe('Conditional Directives', () => {
    it('should handle @switch/@case directives', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const status = 'active'
  </script>
</head>
<body>
  @switch (status)
    @case ('pending')
      <span class="badge badge-warning">Pending</span>
    @break
    @case ('active')
      <span class="badge badge-success">Active</span>
    @break
    @case ('inactive')
      <span class="badge badge-danger">Inactive</span>
    @break
    @default
      <span class="badge badge-secondary">Unknown</span>
  @endswitch
</body>
</html>`

      const html = await processTemplate(template, '/test/switch.stx')
      expect(html).toContain('badge-success')
      expect(html).toContain('Active')
      expect(html).not.toContain('Pending')
      expect(html).not.toContain('Inactive')
    })

    it('should handle @unless directive', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const isLoggedIn = false
  </script>
</head>
<body>
  @unless (isLoggedIn)
    <p>Please log in to continue</p>
  @endunless
</body>
</html>`

      const html = await processTemplate(template, '/test/unless.stx')
      expect(html).toContain('Please log in to continue')
    })

    it('should handle @isset and @empty directives', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const user = { name: 'John' }
    const items = []
  </script>
</head>
<body>
  @isset (user.name)
    <p>User name is set: {{ user.name }}</p>
  @endisset

  @empty (items)
    <p>No items found</p>
  @endempty
</body>
</html>`

      const html = await processTemplate(template, '/test/isset-empty.stx')
      expect(html).toContain('User name is set: John')
      expect(html).toContain('No items found')
    })
  })

  describe('Loop Directives', () => {
    it('should provide loop variable in @foreach', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const items = ['A', 'B', 'C', 'D', 'E']
  </script>
</head>
<body>
  @foreach (items as item)
    <div>
      <span>Index: {{ loop.index }}</span>
      <span>Item: {{ item }}</span>
      @if (loop.first)
        <span class="first">First!</span>
      @endif
      @if (loop.last)
        <span class="last">Last!</span>
      @endif
    </div>
  @endforeach
</body>
</html>`

      const html = await processTemplate(template, '/test/loop-var.stx')
      expect(html).toContain('Index: 0')
      expect(html).toContain('Index: 4')
      expect(html).toContain('First!')
      expect(html).toContain('Last!')
    })

    it('should handle @forelse for empty arrays', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const items = []
  </script>
</head>
<body>
  @forelse (items as item)
    <p>{{ item }}</p>
  @empty
    <p class="empty">No items available</p>
  @endforelse
</body>
</html>`

      const html = await processTemplate(template, '/test/forelse.stx')
      expect(html).toContain('No items available')
    })

    it('should handle @for loop', async () => {
      const template = `<!DOCTYPE html>
<html>
<body>
  @for (let i = 1; i <= 5; i++)
    <p>Number {{ i }}</p>
  @endfor
</body>
</html>`

      const html = await processTemplate(template, '/test/for-loop.stx')
      expect(html).toContain('Number 1')
      expect(html).toContain('Number 2')
      expect(html).toContain('Number 5')
    })
  })

  describe('Form Directives', () => {
    it('should process @csrf directive', async () => {
      const template = `<!DOCTYPE html>
<html>
<body>
  <form method="POST" action="/submit">
    @csrf
    <input type="text" name="name">
    <button type="submit">Submit</button>
  </form>
</body>
</html>`

      const html = await processTemplate(template, '/test/csrf.stx')
      expect(html).toContain('type="hidden"')
      expect(html).toContain('name="_token"')
    })

    it('should process @method directive for PUT/DELETE', async () => {
      const template = `<!DOCTYPE html>
<html>
<body>
  <form method="POST" action="/resource/1">
    @method('PUT')
    <input type="text" name="name">
    <button type="submit">Update</button>
  </form>
</body>
</html>`

      const html = await processTemplate(template, '/test/method.stx')
      expect(html).toContain('name="_method"')
      expect(html).toContain('value="PUT"')
    })
  })

  describe('Client-Side Scripts Preservation', () => {
    it('should preserve client-side scripts', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const serverVar = "I run on server"
  </script>
  <script type="module">
    console.log("Hello from client")
    document.addEventListener('DOMContentLoaded', () => {
      console.log('DOM ready')
    })
  </script>
</head>
<body>
  <p>{{ serverVar }}</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/client-scripts.stx')
      expect(html).toContain('I run on server')
      expect(html).toContain('Hello from client')
      expect(html).toContain('DOMContentLoaded')
    })
  })

  describe('Error Recovery', () => {
    it('should handle undefined variables gracefully', async () => {
      const template = `<!DOCTYPE html>
<html>
<body>
  <p>Before: OK</p>
  <p>{{ undefinedVariable }}</p>
  <p>After: OK</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/undefined.stx', { debug: false })
      expect(html).toContain('Before: OK')
      expect(html).toContain('After: OK')
    })
  })

  describe('Special Characters and Escaping', () => {
    it('should handle HTML escaping in expressions', async () => {
      // Note: Script content with nested script tags causes parsing issues
      // Using simpler HTML escaping test
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const userInput = "<div onclick=alert(1)>xss</div>"
    const safeHtml = "<strong>Bold</strong>"
  </script>
</head>
<body>
  <p>Escaped: {{ userInput }}</p>
  <p>Raw: {!! safeHtml !!}</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/escaping.stx')
      // Escaped content should have HTML entities
      expect(html).toContain('&lt;div')
      // Raw content should be unescaped
      expect(html).toContain('<strong>Bold</strong>')
    })

    it('should handle escaped @ directive syntax', async () => {
      const template = `<!DOCTYPE html>
<html>
<body>
  <p>Show literal: @@if (condition)</p>
</body>
</html>`

      const html = await processTemplate(template, '/test/escaped-syntax.stx')
      expect(html).toContain('@if (condition)')
    })
  })

  describe('Complex Real-World Scenarios', () => {
    it('should handle deeply nested structures', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const departments = [
      {
        name: "Engineering",
        teams: [
          { name: "Frontend", members: [{ name: "Alice", active: true }, { name: "Bob", active: false }] },
          { name: "Backend", members: [{ name: "Charlie", active: true }] }
        ]
      },
      {
        name: "Design",
        teams: [
          { name: "UX", members: [{ name: "Diana", active: true }] }
        ]
      }
    ]
  </script>
</head>
<body>
  @foreach (departments as department)
    <div class="department">
      <h2>{{ department.name }}</h2>
      @if (department.teams && department.teams.length > 0)
        @foreach (department.teams as team)
          <div class="team">
            <h3>{{ team.name }}</h3>
            @if (team.members && team.members.length > 0)
              <ul class="members">
                @foreach (team.members as member)
                  @if (member.active)
                    <li class="active">{{ member.name }} (Active)</li>
                  @else
                    <li class="inactive">{{ member.name }} (Inactive)</li>
                  @endif
                @endforeach
              </ul>
            @endif
          </div>
        @endforeach
      @endif
    </div>
  @endforeach
</body>
</html>`

      const html = await processTemplate(template, '/test/nested.stx')
      expect(html).toContain('Engineering')
      expect(html).toContain('Frontend')
      expect(html).toContain('Alice (Active)')
      expect(html).toContain('Bob (Inactive)')
      expect(html).toContain('Design')
      expect(html).toContain('Diana (Active)')
    })

    it('should handle large datasets efficiently', async () => {
      // Generate items array inline using module.exports pattern
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const items = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: "Item " + (i + 1),
      active: (i + 1) % 2 === 0
    }))
  </script>
</head>
<body>
  <h1>{{ items.length }} Items</h1>
  @foreach (items as item)
    @if (item.active)
      <div class="item active">{{ item.name }}</div>
    @else
      <div class="item inactive">{{ item.name }}</div>
    @endif
  @endforeach
</body>
</html>`

      const startTime = performance.now()
      const html = await processTemplate(template, '/test/large.stx')
      const endTime = performance.now()

      expect(html).toContain('100 Items')
      expect(html).toContain('Item 1')
      expect(html).toContain('Item 100')
      expect(endTime - startTime).toBeLessThan(1000) // Should be fast
    })

    it('should handle complex conditional logic', async () => {
      const template = `<!DOCTYPE html>
<html>
<head>
  <script>
    const user = {
      name: "John",
      role: "admin",
      permissions: ["read", "write", "delete"],
      preferences: {
        theme: "dark",
        notifications: true
      }
    }
  </script>
</head>
<body>
  <h1>Welcome {{ user.name }}</h1>

  @if (user.role === 'admin')
    <nav class="admin-nav">
      <a href="/admin">Admin Dashboard</a>
      @if (user.permissions.includes('delete'))
        <a href="/admin/danger">Danger Zone</a>
      @endif
    </nav>
  @elseif (user.role === 'moderator')
    <nav class="mod-nav">Moderator Tools</nav>
  @else
    <nav class="user-nav">User Menu</nav>
  @endif

  @if (user.preferences.theme === 'dark')
    <style>body { background: #1a1a1a; color: white; }</style>
  @endif

  @if (user.preferences.notifications)
    <div class="notifications-enabled">Notifications are ON</div>
  @endif
</body>
</html>`

      const html = await processTemplate(template, '/test/complex-cond.stx')
      expect(html).toContain('Welcome John')
      expect(html).toContain('Admin Dashboard')
      expect(html).toContain('Danger Zone')
      expect(html).toContain('background: #1a1a1a')
      expect(html).toContain('Notifications are ON')
      expect(html).not.toContain('Moderator Tools')
      expect(html).not.toContain('User Menu')
    })
  })
})
