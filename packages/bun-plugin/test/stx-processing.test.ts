import { afterEach, beforeEach, describe, expect, test, setDefaultTimeout } from 'bun:test'

// Increase timeout for CI environments where Bun.build() can be slow
setDefaultTimeout(30000)
import fs from 'node:fs'
import path from 'node:path'
import plugin from '../src/index'

const TEST_DIR = import.meta.dir
const TEMP_DIR = path.join(TEST_DIR, 'temp-stx-processing')
const OUTPUT_DIR = path.join(TEMP_DIR, 'dist')

describe('BUN-PLUGIN: stx File Processing', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(TEMP_DIR, { recursive: true })
    await fs.promises.mkdir(OUTPUT_DIR, { recursive: true })
  })

  afterEach(async () => {
    await fs.promises.rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should load and parse basic stx files', async () => {
    const testFile = path.join(TEMP_DIR, 'basic.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Basic Test</title>
</head>
<body>
  <h1>Hello World</h1>
  <p>This is a basic stx template.</p>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThanOrEqual(1)

    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()
    expect(content).toContain('<h1>Hello World</h1>')
    expect(content).toContain('<p>This is a basic stx template.</p>')
  })

  test('should extract script content from stx files', async () => {
    const testFile = path.join(TEMP_DIR, 'with-script.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <script>
    const title = "Dynamic Title";
    const message = "Hello from script!";
    module.exports = { title, message };
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  <p>{{ message }}</p>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    expect(result.outputs.length).toBeGreaterThanOrEqual(1)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    // The script should be removed and variables should be processed
    expect(content).not.toContain('<script>')
    expect(content).toContain('<title>Dynamic Title</title>')
    expect(content).toContain('<h1>Dynamic Title</h1>')
    expect(content).toContain('<p>Hello from script!</p>')
  })

  test('should extract template content without script tags', async () => {
    const testFile = path.join(TEMP_DIR, 'template-extraction.stx')
    await Bun.write(testFile, `<div class="container">
  <script>
    const greeting = "Hello";
    const name = "World";
    module.exports = { greeting, name };
  </script>
  <header>
    <h1>{{ greeting }}, {{ name }}!</h1>
  </header>
  <main>
    <p>This content should remain.</p>
  </main>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<div class="container">')
    expect(content).toContain('<header>')
    expect(content).toContain('<h1>Hello, World!</h1>')
    expect(content).toContain('<main>')
    expect(content).toContain('<p>This content should remain.</p>')
    expect(content).not.toContain('<script>')
  })

  test('should handle variable extraction and context creation', async () => {
    const testFile = path.join(TEMP_DIR, 'variables.stx')
    await Bun.write(testFile, `<script>
  const user = {
    name: "John Doe",
    age: 30,
    isActive: true
  };

  const items = ["apple", "banana", "cherry"];
  const greeting = "Hello, John Doe!";

  module.exports = { user, items, greeting };
</script>

<div>
  <h1>{{ greeting }}</h1>
  <p>Age: {{ user.age }}</p>
  <p>Status: {{ user.isActive ? 'Active' : 'Inactive' }}</p>

  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h1>Hello, John Doe!</h1>')
    expect(content).toContain('<p>Age: 30</p>')
    expect(content).toContain('<p>Status: Active</p>')
    expect(content).toContain('<li>apple</li>')
    expect(content).toContain('<li>banana</li>')
    expect(content).toContain('<li>cherry</li>')
  })

  test('should process directive integration (@if, @foreach, etc.)', async () => {
    const testFile = path.join(TEMP_DIR, 'directives.stx')
    await Bun.write(testFile, `<script>
  const showHeader = true;
  const user = { name: "Alice", role: "admin" };
  const notifications = [
    { id: 1, message: "Welcome!", type: "success" },
    { id: 2, message: "Update available", type: "info" }
  ];

  module.exports = { showHeader, user, notifications };
</script>

<div>
  @if (showHeader)
    <header>
      <h1>Welcome, {{ user.name }}!</h1>
      @if (user.role === 'admin')
        <span class="badge">Admin</span>
      @endif
    </header>
  @endif

  <main>
    @if (notifications.length > 0)
      <div class="notifications">
        @foreach (notifications as notification)
          <div class="alert alert-{{ notification.type }}">
            {{ notification.message }}
          </div>
        @endforeach
      </div>
    @else
      <p>No notifications</p>
    @endif
  </main>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<header>')
    expect(content).toContain('<h1>Welcome, Alice!</h1>')
    expect(content).toContain('<span class="badge">Admin</span>')
    expect(content).toContain('<div class="notifications">')
    expect(content).toContain('<div class="alert alert-success">')
    expect(content).toContain('Welcome!')
    expect(content).toContain('<div class="alert alert-info">')
    expect(content).toContain('Update available')
  })

  test('should handle error handling for malformed stx files', async () => {
    const testFile = path.join(TEMP_DIR, 'malformed.stx')
    await Bun.write(testFile, `<script>
  // Invalid JavaScript syntax
  const user = {
    name: "Test"
    age: 30  // Missing comma
  };

  module.exports = { user };
</script>

<div>
  <h1>{{ user.name }}</h1>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    // When script execution fails, variables become undefined and render as empty
    // This is the expected graceful degradation behavior
    expect(content).toContain('<div>')
    expect(content).toContain('<h1></h1>') // Empty because user.name is undefined
    expect(content).toContain('</div>')
  })

  test('should handle CommonJS vs ESM export styles', async () => {
    const testFile = path.join(TEMP_DIR, 'commonjs.stx')
    await Bun.write(testFile, `<script>
  // CommonJS style exports
  module.exports = {
    title: "CommonJS Title",
    description: "Using module.exports",
    items: ["item1", "item2", "item3"]
  };
</script>

<div>
  <h1>{{ title }}</h1>
  <p>{{ description }}</p>
  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>
</div>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<h1>CommonJS Title</h1>')
    expect(content).toContain('<p>Using module.exports</p>')
    expect(content).toContain('<li>item1</li>')
    expect(content).toContain('<li>item2</li>')
    expect(content).toContain('<li>item3</li>')
  })

  test('should handle files without script tags', async () => {
    const testFile = path.join(TEMP_DIR, 'no-script.stx')
    await Bun.write(testFile, `<!DOCTYPE html>
<html>
<head>
  <title>Static Template</title>
</head>
<body>
  <h1>Static Content</h1>
  <p>This template has no script tag and should work fine.</p>
  <div class="footer">
    <p>&copy; 2023 Static Site</p>
  </div>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<!DOCTYPE html>')
    expect(content).toContain('<title>Static Template</title>')
    expect(content).toContain('<h1>Static Content</h1>')
    expect(content).toContain('<p>This template has no script tag and should work fine.</p>')
    expect(content).toContain('&copy; 2023 Static Site')
  })

  test('should process complex template with nested structures', async () => {
    const testFile = path.join(TEMP_DIR, 'complex.stx')
    await Bun.write(testFile, `<script>
  const page = {
    title: "Complex Template",
    meta: {
      description: "A complex template example",
      keywords: ["stx", "template", "complex"]
    }
  };

  const navigation = [
    { label: "Home", url: "/", active: true },
    { label: "About", url: "/about", active: false },
    { label: "Contact", url: "/contact", active: false }
  ];

  const posts = [
    { title: "Post 1", excerpt: "First post excerpt", published: true },
    { title: "Post 2", excerpt: "Second post excerpt", published: false },
    { title: "Post 3", excerpt: "Third post excerpt", published: true }
  ];

  module.exports = { page, navigation, posts };
</script>

<!DOCTYPE html>
<html>
<head>
  <title>{{ page.title }}</title>
  <meta name="description" content="{{ page.meta.description }}">
  <meta name="keywords" content="{{ page.meta.keywords.join(', ') }}">
</head>
<body>
  <nav>
    <ul>
      @foreach (navigation as navItem)
        <li class="{{ navItem.active ? 'active' : '' }}">
          <a href="{{ navItem.url }}">{{ navItem.label }}</a>
        </li>
      @endforeach
    </ul>
  </nav>

  <main>
    <h1>{{ page.title }}</h1>

    <section class="posts">
      @foreach (posts as post)
        @if (post.published)
          <article>
            <h2>{{ post.title }}</h2>
            <p>{{ post.excerpt }}</p>
          </article>
        @endif
      @endforeach
    </section>
  </main>
</body>
</html>`)

    const result = await Bun.build({
      entrypoints: [testFile],
      outdir: OUTPUT_DIR,
      plugins: [plugin()],
    })

    expect(result.success).toBe(true)
    const htmlOutput = result.outputs.find(o => o.path.endsWith('.html')) || result.outputs[0]
    const content = await Bun.file(htmlOutput.path).text()

    expect(content).toContain('<title>Complex Template</title>')
    expect(content).toContain('content="A complex template example"')
    expect(content).toContain('content="stx, template, complex"')
    expect(content).toContain('<li class="active">')
    expect(content).toContain('<a href="/">Home</a>')
    expect(content).toContain('<li class="">')
    expect(content).toContain('<a href="/about">About</a>')
    expect(content).toContain('<h2>Post 1</h2>')
    expect(content).toContain('<p>First post excerpt</p>')
    expect(content).toContain('<h2>Post 3</h2>')
    expect(content).not.toContain('<h2>Post 2</h2>') // Should be filtered out because published: false
  })
})
