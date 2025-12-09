import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import fs from 'node:fs'
import path from 'node:path'
import { plugin } from '../../src/plugin'

const TEST_DIR = path.join(import.meta.dir, 'temp-plugin')
const OUTPUT_DIR = path.join(TEST_DIR, 'dist')

describe('Internal stx Plugin', () => {
  beforeAll(async () => {
    await fs.promises.mkdir(TEST_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
  })

  afterAll(async () => {
    await fs.promises.rm(TEST_DIR, { recursive: true, force: true })
  })

  it('should have correct plugin name', () => {
    expect(plugin.name).toBe('bun-plugin-stx')
  })

  it('should have a setup function', () => {
    expect(typeof plugin.setup).toBe('function')
  })

  it('should process basic stx template', async () => {
    const testFile = path.join(TEST_DIR, 'basic.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Plugin Test</title>
  <script>
    const title = "Hello from Plugin";
    const count = 42;
    module.exports = { title, count };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  <p>Count: {{ count }}</p>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h1>Hello from Plugin</h1>')
    expect(content).toContain('<p>Count: 42</p>')
  })

  it('should handle template with conditionals', async () => {
    const testFile = path.join(TEST_DIR, 'conditionals.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Conditionals Test</title>
  <script>
    const isAdmin = true;
    const username = "Admin User";
    module.exports = { isAdmin, username };
  </script>
</head>
<body>
  @if (isAdmin)
    <div class="admin-panel">Welcome, {{ username }}</div>
  @else
    <div class="user-panel">Welcome, Guest</div>
  @endif
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<div class="admin-panel">Welcome, Admin User</div>')
    expect(content).not.toContain('<div class="user-panel">')
  })

  it('should handle template with loops', async () => {
    const testFile = path.join(TEST_DIR, 'loops.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Loops Test</title>
  <script>
    const items = ["Apple", "Banana", "Cherry"];
    module.exports = { items };
  </script>
</head>
<body>
  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<li>Apple</li>')
    expect(content).toContain('<li>Banana</li>')
    expect(content).toContain('<li>Cherry</li>')
  })

  it('should preserve client-side scripts', async () => {
    const testFile = path.join(TEST_DIR, 'client-scripts.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Client Scripts Test</title>
  <script>
    const pageTitle = "My Page";
    module.exports = { pageTitle };
  </script>
</head>
<body>
  <h1>{{ pageTitle }}</h1>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Page loaded');
    });
  </script>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h1>My Page</h1>')
    expect(content).toContain('document.addEventListener')
    expect(content).toContain('Page loaded')
  })

  it('should handle empty stx file gracefully', async () => {
    const testFile = path.join(TEST_DIR, 'empty.stx')
    await Bun.write(testFile, '')

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    // Should produce output (error page) even for empty file
    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    // Empty file should trigger error handling
    expect(content).toBeDefined()
  })

  it('should handle template with object properties', async () => {
    const testFile = path.join(TEST_DIR, 'objects.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Objects Test</title>
  <script>
    const user = {
      name: "John Doe",
      email: "john@example.com",
      profile: {
        bio: "Developer"
      }
    };
    module.exports = { user };
  </script>
</head>
<body>
  <div class="user-card">
    <h2>{{ user.name }}</h2>
    <p>{{ user.email }}</p>
    <p>{{ user.profile.bio }}</p>
  </div>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h2>John Doe</h2>')
    expect(content).toContain('<p>john@example.com</p>')
    expect(content).toContain('<p>Developer</p>')
  })

  it('should handle template with functions', async () => {
    const testFile = path.join(TEST_DIR, 'functions.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Functions Test</title>
  <script>
    function formatName(first, last) {
      return first + ' ' + last;
    }
    const firstName = "Jane";
    const lastName = "Smith";
    module.exports = { formatName, firstName, lastName };
  </script>
</head>
<body>
  <p>{{ formatName(firstName, lastName) }}</p>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<p>Jane Smith</p>')
  })
})
