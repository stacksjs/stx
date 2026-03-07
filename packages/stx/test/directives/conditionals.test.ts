import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import stxPlugin from 'bun-plugin-stx'
import { cleanupTestDirs, createTestFile, getHtmlOutput, OUTPUT_DIR, setupTestDirs } from '../utils'

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
})
