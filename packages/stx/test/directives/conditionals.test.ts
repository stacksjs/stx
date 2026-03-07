import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'
import type { StxOptions } from '../../src/types'
import { processDirectives } from '../../src/process'
import { processIssetEmptyDirectives, processEnvDirective, processSwitchStatements } from '../../src/conditionals'

const defaultTestOptions: StxOptions = { debug: false, componentsDir: 'components' }

async function processTemplate(
  template: string,
  context: Record<string, any> = {},
  filePath: string = 'test.stx',
  options: StxOptions = defaultTestOptions,
): Promise<string> {
  const dependencies = new Set<string>()
  return processDirectives(template, context, filePath, options, dependencies)
}

describe('stx Conditional Directives', () => {
  beforeAll(setupTestDirs)
  afterAll(cleanupTestDirs)

  // Test conditional rendering with @if
  it('should process simple @if directives', async () => {
    const testFile = await createTestFile('if.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>If Test</title>
        <script>
          module.exports = {
            showContent: true,
            hideContent: false
          };
        </script>
      </head>
      <body>
        @if (showContent)
          <div id="visible">This should be visible</div>
        @endif

        @if (hideContent)
          <div id="hidden">This should not be visible</div>
        @endif

        @if (1 + 1 === 2)
          <div id="math-works">Math still works</div>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('<div id="visible">This should be visible</div>')
    expect(outputHtml).not.toContain('<div id="hidden">This should not be visible</div>')
    expect(outputHtml).toContain('<div id="math-works">Math still works</div>')
  })

  // Test if-else directives
  it('should handle @if-@else directives correctly', async () => {
    const testFile = await createTestFile('if-else.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>If-Else Test</title>
        <script>
          module.exports = {
            isAuthenticated: false,
            role: "guest"
          };
        </script>
      </head>
      <body>
        <div>
          @if (isAuthenticated)
            <p class="welcome">Welcome back, user!</p>
          @else
            <p class="login-prompt">Please log in</p>
          @endif

          @if (true === false)
            <p>Impossible condition met</p>
          @else
            <p class="logical">Logical condition works</p>
          @endif
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).not.toContain('<p class="welcome">Welcome back, user!</p>')
    expect(outputHtml).toContain('<p class="login-prompt">Please log in</p>')
    expect(outputHtml).toContain('<p class="logical">Logical condition works</p>')
    expect(outputHtml).not.toContain('Impossible condition met')
  })

  // Test if-elseif-else directives
  it('should handle @if-@elseif-@else directives correctly', async () => {
    const testFile = await createTestFile('if-elseif-else.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>If-ElseIf-Else Test</title>
        <script>
          module.exports = {
            role: "editor",
            hasWrite: true,
            hasRead: true,
            hasDelete: false
          };
        </script>
      </head>
      <body>
        <div class="permission-info">
          @if (role === "admin")
            <p class="role">You have admin privileges</p>
          @elseif (role === "editor")
            <p class="role">You have editor privileges</p>
          @else
            <p class="role">You have basic privileges</p>
          @endif

          @if (hasDelete === true)
            <p>You can delete content</p>
          @elseif (hasWrite === true)
            <p class="permission">You can write content</p>
          @elseif (hasRead === true)
            <p>You can only read content</p>
          @else
            <p>You have no permissions</p>
          @endif
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // Since we're using the "editor" role, we expect to see editor privileges
    expect(outputHtml).toContain('You have editor privileges')
    expect(outputHtml).not.toContain('You have admin privileges')
    expect(outputHtml).not.toContain('You have basic privileges')

    // First matching elseif should be used
    expect(outputHtml).toContain('<p class="permission">You can write content</p>')
    expect(outputHtml).not.toContain('You can delete content')
    expect(outputHtml).not.toContain('You can only read content')
    expect(outputHtml).not.toContain('You have no permissions')
  })

  // Test nested if directives
  it('should handle nested @if directives correctly', async () => {
    const testFile = await createTestFile('nested-ifs.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nested If Test</title>
        <script>
          module.exports = {
            isLoggedIn: true,
            isPremium: true,
            hasAccess: false
          };
        </script>
      </head>
      <body>
        <div class="content">
          @if (isLoggedIn === true)
            <p>Welcome to the application</p>
          @else
            <p>Please log in to access content</p>
          @endif

          <!-- Premium content section -->
          <div class="premium-content">
            <h3>Premium Content</h3>
            <p>Your access status: {{ hasAccess ? 'Granted' : 'Awaiting access' }}</p>
          </div>
        </div>
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // First if block (login check)
    expect(outputHtml).toContain('Welcome to the application')
    expect(outputHtml).not.toContain('Please log in to access content')

    // Premium content section
    expect(outputHtml).toContain('Premium Content')
    expect(outputHtml).toContain('Your access status: Awaiting access')
  })

  // Test deeply nested @if/@else/@endif inside @if
  it('should handle @if/@else/@endif nested inside @if', async () => {
    const testFile = await createTestFile('deeply-nested-ifs.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Deeply Nested If Test</title>
        <script>
          module.exports = {
            showSection: true,
            count: 5,
            items: ['a', 'b', 'c']
          };
        </script>
      </head>
      <body>
        @if (showSection)
          <div class="section">
            @if (count === 1)
              <p>One item</p>
            @else
              <p>Multiple items: {{ count }}</p>
            @endif
            <ul>
              @foreach (items as item)
                <li>{{ item }}</li>
              @endforeach
            </ul>
          </div>
        @else
          <p>Section hidden</p>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('Multiple items: 5')
    expect(outputHtml).not.toContain('One item')
    expect(outputHtml).not.toContain('Section hidden')
    expect(outputHtml).toContain('<li>a</li>')
    expect(outputHtml).toContain('<li>b</li>')
    expect(outputHtml).toContain('<li>c</li>')
  })

  // Test with logical operators in conditions
  it('should handle logical operators in conditions', async () => {
    const testFile = await createTestFile('logical-operators.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Logical Operators Test</title>
        <script>
          module.exports = {
            hasAccount: true,
            isVerified: false,
            score: 75,
            minScore: 70
          };
        </script>
      </head>
      <body>
        <!-- AND operator -->
        @if (hasAccount && isVerified)
          <p class="full-access">Full access granted</p>
        @else
          <p class="limited-access">Limited access only</p>
        @endif

        <!-- OR operator -->
        @if (hasAccount || isVerified)
          <p class="some-access">Some form of access available</p>
        @endif

        <!-- NOT operator -->
        @if (!isVerified)
          <p class="verification-needed">Please verify your account</p>
        @endif

        <!-- Complex condition -->
        @if (hasAccount && score >= minScore)
          <p class="pass">You pass the requirements</p>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    // AND operator - both conditions need to be true
    expect(outputHtml).not.toContain('<p class="full-access">Full access granted</p>')
    expect(outputHtml).toContain('<p class="limited-access">Limited access only</p>')

    // OR operator - at least one condition needs to be true
    expect(outputHtml).toContain('<p class="some-access">Some form of access available</p>')

    // NOT operator
    expect(outputHtml).toContain('<p class="verification-needed">Please verify your account</p>')

    // Complex condition
    expect(outputHtml).toContain('<p class="pass">You pass the requirements</p>')
  })

  // Test @if/@else/@endif nested inside @if with @foreach
  it('should handle @if/@else nested inside @if with @foreach sibling', async () => {
    const testFile = await createTestFile('nested-if-else-foreach.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nested Test</title>
        <script>
          module.exports = {
            hasResults: true,
            count: 3,
            items: [{name: 'alpha'}, {name: 'beta'}, {name: 'gamma'}]
          };
        </script>
      </head>
      <body>
        @if (hasResults)
          @if (count === 1)
            <p>Found 1 item</p>
          @else
            <p>Found {{ count }} items</p>
          @endif
          <ul>
            @foreach (items as item)
              <li>{{ item.name }}</li>
            @endforeach
          </ul>
        @else
          <p>No results</p>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('Found 3 items')
    expect(outputHtml).not.toContain('Found 1 item')
    expect(outputHtml).not.toContain('No results')
    expect(outputHtml).toContain('<li>alpha</li>')
    expect(outputHtml).toContain('<li>beta</li>')
    expect(outputHtml).toContain('<li>gamma</li>')
  })

  // Test false outer @if with nested @if/@else
  it('should skip nested @if/@else when outer @if is false', async () => {
    const testFile = await createTestFile('nested-false-outer.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>False Outer Test</title>
        <script>
          module.exports = {
            showSection: false,
            count: 5
          };
        </script>
      </head>
      <body>
        @if (showSection)
          <div class="section">
            @if (count > 3)
              <p>Many items</p>
            @else
              <p>Few items</p>
            @endif
          </div>
        @else
          <p>Section hidden</p>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('Section hidden')
    expect(outputHtml).not.toContain('Many items')
    expect(outputHtml).not.toContain('Few items')
    expect(outputHtml).not.toContain('class="section"')
  })

  // Test triple nesting: @if inside @if inside @if
  it('should handle triple-nested @if blocks', async () => {
    const testFile = await createTestFile('triple-nested-ifs.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Triple Nested Test</title>
        <script>
          module.exports = {
            a: true,
            b: true,
            c: false
          };
        </script>
      </head>
      <body>
        @if (a)
          <p>Level 1</p>
          @if (b)
            <p>Level 2</p>
            @if (c)
              <p>Level 3 true</p>
            @else
              <p>Level 3 false</p>
            @endif
          @endif
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('Level 1')
    expect(outputHtml).toContain('Level 2')
    expect(outputHtml).toContain('Level 3 false')
    expect(outputHtml).not.toContain('Level 3 true')
  })

  // Test @if with @elseif nested inside another @if
  it('should handle @elseif nested inside @if', async () => {
    const testFile = await createTestFile('nested-elseif.stx', `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Nested Elseif Test</title>
        <script>
          module.exports = {
            showPanel: true,
            status: 'warning'
          };
        </script>
      </head>
      <body>
        @if (showPanel)
          @if (status === 'error')
            <p class="error">Error!</p>
          @elseif (status === 'warning')
            <p class="warning">Warning!</p>
          @else
            <p class="ok">All clear</p>
          @endif
        @else
          <p>Panel hidden</p>
        @endif
      </body>
      </html>
    `)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [stxPlugin()],
    })

    const outputHtml = await getHtmlOutput(result)

    expect(outputHtml).toContain('class="warning">Warning!</p>')
    expect(outputHtml).not.toContain('Error!')
    expect(outputHtml).not.toContain('All clear')
    expect(outputHtml).not.toContain('Panel hidden')
  })

  describe('@unless directive (unit)', () => {
    it('should process basic @unless correctly', async () => {
      const template = '@unless(hidden)<p>Visible</p>@endunless'
      const result = await processTemplate(template, { hidden: false })
      expect(result).toContain('<p>Visible</p>')
    })

    it('should hide content when condition is true', async () => {
      const template = '@unless(hidden)<p>Content</p>@endunless'
      const result = await processTemplate(template, { hidden: true })
      expect(result).not.toContain('<p>Content</p>')
    })

    it('should handle @unless with @else', async () => {
      const template = '@unless(admin)<p>Regular user</p>@else<p>Admin</p>@endunless'
      const result = await processTemplate(template, { admin: true })
      expect(result).toContain('<p>Admin</p>')
      expect(result).not.toContain('<p>Regular user</p>')
    })

    it('should handle nested @unless/@if correctly', async () => {
      const template = '@unless(hidden)@if(show)<span>inner</span>@else<span>other</span>@endif@endunless'
      const result = await processTemplate(template, { hidden: false, show: true })
      expect(result).toContain('<span>inner</span>')
    })
  })

  describe('findTopLevelElse performance (unit)', () => {
    it('should find top-level @else in @if/@endif blocks', async () => {
      const template = '@if(show)<p>Yes</p>@else<p>No</p>@endif'
      const result = await processTemplate(template, { show: false })
      expect(result).toContain('<p>No</p>')
      expect(result).not.toContain('<p>Yes</p>')
    })

    it('should handle nested conditionals when finding top-level @else', async () => {
      const template = '@if(outer)@if(inner)<span>both</span>@else<span>outer-only</span>@endif@else<span>neither</span>@endif'
      const result = await processTemplate(template, { outer: false, inner: true })
      expect(result).toContain('<span>neither</span>')
    })

    it('should not confuse nested @else with top-level @else', async () => {
      const template = '@if(a)@if(b)B@else notB@endif@else notA@endif'
      const result = await processTemplate(template, { a: true, b: false })
      expect(result).toContain('notB')
      expect(result).not.toContain('notA')
    })
  })

  describe('@switch nested depth (unit)', () => {
    it('should handle simple @switch correctly', async () => {
      const template = `
        @switch(color)
          @case('red')
            <p>Red</p>
            @break
          @case('blue')
            <p>Blue</p>
            @break
          @default
            <p>Unknown</p>
        @endswitch
      `
      const result = await processTemplate(template, { color: 'blue' })
      expect(result).toContain('Blue')
      expect(result).not.toContain('Red')
      expect(result).not.toContain('Unknown')
    })
  })

  describe('@env balanced parsing (unit)', () => {
    it('should handle @production directive', () => {
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      try {
        const result = processEnvDirective(
          '@production\n<p>Prod only</p>\n@endproduction',
          {},
        )
        expect(result).toContain('Prod only')
      } finally {
        process.env.NODE_ENV = origEnv
      }
    })

    it('should hide @production content in development', () => {
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      try {
        const result = processEnvDirective(
          '@production\n<p>Prod only</p>\n@endproduction',
          {},
        )
        expect(result).not.toContain('Prod only')
      } finally {
        process.env.NODE_ENV = origEnv
      }
    })

    it('should handle @env with specific environment', () => {
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'staging'
      try {
        const result = processEnvDirective(
          "@env('staging')\n<p>Staging info</p>\n@endenv",
          {},
        )
        expect(result).toContain('Staging info')
      } finally {
        process.env.NODE_ENV = origEnv
      }
    })
  })

  describe('@isset/@empty performance (unit)', () => {
    it('should handle @isset with large content efficiently', () => {
      const largeContent = 'x'.repeat(10000)
      const template = `@isset(value)${largeContent}@endisset`
      const result = processIssetEmptyDirectives(template, { value: 'exists' }, '')
      expect(result.length).toBe(10000)
    })

    it('should handle nested @isset/@else correctly', () => {
      const template = `@isset(a)A@isset(b)B@endisset@else NoA @endisset`
      const result = processIssetEmptyDirectives(template, { a: 'yes', b: 'yes' }, '')
      expect(result).toContain('A')
      expect(result).toContain('B')
      expect(result).not.toContain('NoA')
    })
  })

  describe('@env block performance (unit)', () => {
    it('should process @env directive efficiently with large content', () => {
      const largeContent = 'y'.repeat(10000)
      const template = `@env('test')${largeContent}@endenv`
      const origEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'test'
      const result = processEnvDirective(template, {})
      process.env.NODE_ENV = origEnv
      expect(result.length).toBe(10000)
    })
  })

  describe('parseConditionalBlock performance (unit)', () => {
    it('should parse @if/@elseif/@else with large content efficiently', async () => {
      const content = 'x'.repeat(5000)
      const template = `@if(a)${content}@elseif(b)Second@else Third@endif`
      const result = await processTemplate(template, { a: false, b: true })
      expect(result).toContain('Second')
      expect(result).not.toContain(content)
    })
  })

  describe('Nested @switch integration', () => {
    it('should handle nested @switch blocks', async () => {
      const testFile = await createTestFile('nested-switch.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Nested Switch</title>
        <script>
          module.exports = { outer: 'A', inner: 'X' };
        </script>
        </head>
        <body>
          @switch(outer)
            @case('A')
              <p>Outer A</p>
              @switch(inner)
                @case('X')
                  <p>Inner X</p>
                  @break
                @case('Y')
                  <p>Inner Y</p>
                  @break
              @endswitch
              @break
            @case('B')
              <p>Outer B</p>
              @break
          @endswitch
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const html = await getHtmlOutput(result)
      expect(html).toContain('Outer A')
      expect(html).toContain('Inner X')
      expect(html).not.toContain('Outer B')
      expect(html).not.toContain('Inner Y')
    })
  })

  describe('Balanced parsing robustness', () => {
    it('should handle deeply nested structures', async () => {
      const testFile = await createTestFile('deeply-nested.stx', `
        <!DOCTYPE html>
        <html>
        <head><title>Deeply Nested</title>
        <script>
          module.exports = {
            show: true,
            items: ['one', 'two'],
            color: 'red'
          };
        </script>
        </head>
        <body>
          @if(show)
            @foreach(items as item)
              @switch(color)
                @case('red')
                  <p class="red">{{ item }}</p>
                  @break
                @case('blue')
                  <p class="blue">{{ item }}</p>
                  @break
              @endswitch
            @endforeach
          @endif
        </body>
        </html>
      `)

      const result = await Bun.build({
        entrypoints: [testFile],
        outdir: OUTPUT_DIR,
        plugins: [stxPlugin()],
      })

      const html = await getHtmlOutput(result)
      expect(html).toContain('<p class="red">one</p>')
      expect(html).toContain('<p class="red">two</p>')
      expect(html).not.toContain('blue')
    })
  })
})
