import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// =============================================================================
// Types
// =============================================================================

/**
 * Options for initializing a new stx file
 */
interface InitOptions {
  /** Overwrite existing file */
  force?: boolean
  /** Path to a custom template file */
  template?: string
  /** Use a built-in template preset */
  preset?: TemplatePreset
}

/**
 * Built-in template presets
 */
type TemplatePreset = 'basic' | 'component' | 'layout' | 'blog' | 'api'

/**
 * Available template presets with descriptions
 */
export const TEMPLATE_PRESETS: Record<TemplatePreset, { description: string }> = {
  basic: { description: 'Simple page with script, style, and template sections' },
  component: { description: 'Reusable component with props and slots' },
  layout: { description: 'Layout template with sections and yields' },
  blog: { description: 'Blog post with frontmatter-style variables' },
  api: { description: 'API endpoint template with JSON response' },
}

/**
 * Initialize a new stx file with the specified name
 */
export async function initFile(fileName: string = 'index.stx', options: InitOptions = {}): Promise<boolean> {
  try {
    // Set default options
    const force = options.force || false

    // Resolve file path
    const filePath = path.resolve(process.cwd(), fileName)

    // Check if file exists
    if (fs.existsSync(filePath)) {
      if (!force) {
        throw new Error(`File ${fileName} already exists. Use --force to overwrite.`)
      }

      console.warn(`File ${fileName} already exists. Overwriting...`)
    }

    // Create directory if it doesn't exist
    const dirPath = path.dirname(filePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // Get the template content
    let templateContent: string

    // If a custom template file is specified, use that
    if (options.template) {
      const templatePath = path.resolve(process.cwd(), options.template)

      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file ${options.template} does not exist.`)
      }

      if (!templatePath.endsWith('.stx')) {
        console.warn(`Warning: Template file ${options.template} does not have a .stx extension. Using it anyway.`)
      }

      templateContent = fs.readFileSync(templatePath, 'utf-8')
      console.warn(`Using template from ${options.template}`)
    }
    else if (options.preset) {
      // Use built-in preset template
      templateContent = getPresetTemplate(options.preset)
      console.warn(`Using '${options.preset}' preset template`)
    }
    else {
      // Use default template (basic)
      templateContent = getPresetTemplate('basic')
    }

    // Write the file
    fs.writeFileSync(filePath, templateContent)

    console.warn(`Created new stx file: ${fileName}`)
    return true
  }
  catch (error) {
    console.error(`Error creating file: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

// =============================================================================
// Template Presets
// =============================================================================

/**
 * Get template content for a preset
 */
function getPresetTemplate(preset: TemplatePreset): string {
  switch (preset) {
    case 'basic':
      return getBasicTemplate()
    case 'component':
      return getComponentTemplate()
    case 'layout':
      return getLayoutTemplate()
    case 'blog':
      return getBlogTemplate()
    case 'api':
      return getApiTemplate()
    default:
      return getBasicTemplate()
  }
}

/**
 * Basic page template - simple page with script, style, and template
 */
function getBasicTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <script>
    const title = "My stx Page"
    const description = "A page built with stx"
    const items = [
      "Templates with TypeScript support",
      "Powerful directives",
      "Reusable components"
    ]
  </script>
  <style>
    :root {
      --primary-color: #3498db;
      --dark-color: #34495e;
      --font-main: system-ui, -apple-system, sans-serif;
    }
    body {
      font-family: var(--font-main);
      line-height: 1.6;
      color: var(--dark-color);
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 { color: var(--primary-color); }
  </style>
</head>
<body>
  <header>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </header>

  <div class="content">
    <h2>Features</h2>
    <ul>
      @foreach(items as item)
        <li>{{ item }}</li>
      @endforeach
    </ul>
  </div>
</body>
</html>`
}

/**
 * Component template - reusable component with props and slots
 */
function getComponentTemplate(): string {
  return `{{-- Component: MyComponent --}}
{{-- Props: title, variant (optional) --}}
<script>
  // Props with defaults
  const title = props.title || 'Default Title'
  const variant = props.variant || 'primary'
</script>

<div class="my-component my-component--{{ variant }}">
  <h3 class="my-component__title">{{ title }}</h3>
  <div class="my-component__content">
    @slot
      {{-- Default slot content --}}
      <p>Add your content here</p>
    @endslot
  </div>
</div>

<style scoped>
  .my-component {
    padding: 1rem;
    border-radius: 8px;
    background: #f5f5f5;
  }
  .my-component--primary { border-left: 4px solid #3498db; }
  .my-component--secondary { border-left: 4px solid #2ecc71; }
  .my-component__title {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
  }
</style>`
}

/**
 * Layout template - base layout with sections
 */
function getLayoutTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title', 'My App')</title>
  @yield('head')
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header, footer {
      background: #2c3e50;
      color: white;
      padding: 1rem 2rem;
    }
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    nav a { color: white; margin-right: 1rem; text-decoration: none; }
    nav a:hover { text-decoration: underline; }
  </style>
  @yield('styles')
</head>
<body>
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
      <a href="/contact">Contact</a>
    </nav>
  </header>

  <main>
    @yield('content')
  </main>

  <footer>
    <p>&copy; {{ new Date().getFullYear() }} My App</p>
  </footer>

  @yield('scripts')
</body>
</html>`
}

/**
 * Blog post template - article with metadata
 */
function getBlogTemplate(): string {
  return `<script>
  // Article metadata
  const title = "My Blog Post"
  const author = "Your Name"
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const tags = ["stx", "tutorial", "web development"]
  const readingTime = "5 min read"
</script>

@extends('layouts/blog')

@section('title')
  {{ title }}
@endsection

@section('content')
<article class="blog-post">
  <header class="blog-post__header">
    <h1>{{ title }}</h1>
    <div class="blog-post__meta">
      <span class="author">By {{ author }}</span>
      <span class="date">{{ date }}</span>
      <span class="reading-time">{{ readingTime }}</span>
    </div>
    <div class="blog-post__tags">
      @foreach(tags as tag)
        <span class="tag">#{{ tag }}</span>
      @endforeach
    </div>
  </header>

  <div class="blog-post__content">
    <p>Your content goes here...</p>

    <h2>Introduction</h2>
    <p>Start writing your blog post content.</p>

    <h2>Conclusion</h2>
    <p>Wrap up your thoughts here.</p>
  </div>
</article>
@endsection`
}

/**
 * API endpoint template - JSON response
 */
function getApiTemplate(): string {
  return `<script>
  // API endpoint configuration
  const endpoint = "/api/data"
  const method = "GET"

  // Mock data - replace with actual data fetching
  const data = {
    success: true,
    message: "Data retrieved successfully",
    items: [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" }
    ],
    meta: {
      total: 3,
      page: 1,
      perPage: 10
    }
  }

  // For error responses
  const error = null
</script>

@if(error)
{
  "success": false,
  "error": {
    "code": "{{ error.code || 'UNKNOWN_ERROR' }}",
    "message": "{{ error.message || 'An error occurred' }}"
  }
}
@else
{{ JSON.stringify(data, null, 2) }}
@endif`
}
