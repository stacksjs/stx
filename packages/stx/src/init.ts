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
type TemplatePreset = 'basic' | 'component' | 'layout' | 'blog' | 'api' | 'app'

/**
 * Available template presets with descriptions
 */
export const TEMPLATE_PRESETS: Record<TemplatePreset, { description: string }> = {
  basic: { description: 'Simple page with script, style, and template sections' },
  component: { description: 'Reusable component with props and slots' },
  layout: { description: 'Layout template with sections and yields' },
  blog: { description: 'Blog post with frontmatter-style variables' },
  api: { description: 'API endpoint template with JSON response' },
  app: { description: 'Full app with stores and components' },
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
    case 'app':
      return getAppTemplate()
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
    const features = [
      { name: "Single File Components", desc: "Script, style, and template in one .stx file" },
      { name: "Component System", desc: "Import components with @component('name', {})" },
      { name: "Blade Directives", desc: "@if, @foreach, @switch, @layout and more" }
    ]
  </script>
  <style>
    :root {
      --primary: #3498db;
      --secondary: #2ecc71;
      --dark: #34495e;
      --light: #ecf0f1;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: var(--dark);
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 { color: var(--primary); }
    .card {
      background: var(--light);
      padding: 1rem;
      border-radius: 8px;
      margin: 1rem 0;
    }
    .card h3 { color: var(--primary); margin: 0 0 0.5rem; }
    .card p { margin: 0; color: #666; }
  </style>
</head>
<body>
  <header>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </header>

  <main>
    <h2>Features</h2>
    @foreach(features as feature)
      <div class="card">
        <h3>{{ feature.name }}</h3>
        <p>{{ feature.desc }}</p>
      </div>
    @endforeach
  </main>
</body>
</html>`
}

/**
 * Component template - reusable component with props and slots
 */
function getComponentTemplate(): string {
  return `{{-- Component: Card --}}
{{-- Props: title, variant, collapsible --}}
{{-- Usage: @component('card', { title: "Hello", variant: "primary", collapsible: true }) Content @endcomponent --}}
<script>
  // Props with defaults
  const title = props.title || 'Card Title'
  const variant = props.variant || 'default'
  const collapsible = props.collapsible || false
</script>

<div class="card card--{{ variant }}">
  <div class="card__header" onclick="this.parentElement.classList.toggle('collapsed')">
    <h3 class="card__title">{{ title }}</h3>
    @if(collapsible)
      <span class="card__toggle">▼</span>
    @endif
  </div>
  <div class="card__body">
    {{ slot }}
  </div>
</div>

<style scoped>
  .card {
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  .card--primary { border-top: 3px solid #3498db; }
  .card--success { border-top: 3px solid #2ecc71; }
  .card--warning { border-top: 3px solid #f39c12; }
  .card--danger { border-top: 3px solid #e74c3c; }
  .card__header {
    padding: 1rem;
    background: #f8f9fa;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .card__title { margin: 0; font-size: 1.1rem; }
  .card__toggle { transition: transform 0.2s; }
  .card.collapsed .card__toggle { transform: rotate(-90deg); }
  .card__body { padding: 1rem; }
  .card.collapsed .card__body { display: none; }
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
    {{ slot }}
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

@layout('layouts/blog')

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

/**
 * App template - Full app with stores and components
 * Demonstrates modern stx patterns for building interactive applications
 */
function getAppTemplate(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }} - stx App</title>
  <script>
    const title = "My App"
  </script>
  <style>
    :root {
      --bg: #1a1a2e;
      --bg-dark: #16213e;
      --fg: #eaeaea;
      --primary: #e94560;
      --secondary: #0f3460;
      --success: #00d9ff;
      --border: #2a2a4a;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: var(--bg);
      color: var(--fg);
      min-height: 100vh;
    }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
    .header { text-align: center; margin-bottom: 2rem; }
    .header h1 { color: var(--primary); margin-bottom: 0.5rem; }
    .card {
      background: var(--bg-dark);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    .btn {
      background: var(--primary);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--secondary { background: var(--secondary); }
    .btn--success { background: var(--success); color: var(--bg); }
    .input {
      width: 100%;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--fg);
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 1rem;
      margin-bottom: 1rem;
    }
    .input:focus { outline: none; border-color: var(--primary); }
    .flex { display: flex; gap: 1rem; align-items: center; }
    .flex-between { justify-content: space-between; }
    .text-muted { color: #888; }
    .text-success { color: var(--success); }
    .mb-1 { margin-bottom: 1rem; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>{{ title }}</h1>
      <p class="text-muted">Built with stx</p>
    </header>

    <!-- Counter Example -->
    <div class="card">
      <h2 class="mb-1">Counter Example</h2>
      <div class="flex flex-between">
        <span id="counterDisplay">Count: 0</span>
        <div class="flex">
          <button class="btn btn--secondary" onclick="window.app?.decrement()">-</button>
          <button class="btn" onclick="window.app?.increment()">+</button>
          <button class="btn btn--success" onclick="window.app?.reset()">Reset</button>
        </div>
      </div>
    </div>

    <!-- Todo List Example -->
    <div class="card">
      <h2 class="mb-1">Todo List</h2>
      <div class="flex mb-1">
        <input
          type="text"
          id="todoInput"
          class="input"
          placeholder="Add a new todo..."
          onkeypress="if(event.key==='Enter') window.app?.addTodo()"
          style="margin-bottom:0"
        />
        <button class="btn" onclick="window.app?.addTodo()">Add</button>
      </div>
      <div id="todoList"></div>
      <p id="todoCount" class="text-muted">0 items</p>
    </div>

    <!-- Toggle Example -->
    <div class="card">
      <h2 class="mb-1">Toggle Example</h2>
      <button
        id="toggleBtn"
        class="btn btn--secondary"
        onclick="window.app?.toggle()"
      >Inactive</button>
      <div id="toggleContent" class="mt-1" style="margin-top:1rem;display:none">
        <p class="text-success">This content is visible when active!</p>
      </div>
    </div>
  </div>

  <!-- Simple Store Implementation -->
  <script>
    (function() {
      // Create a simple reactive store
      function createStore(initialState) {
        let state = { ...initialState };
        const listeners = [];
        return {
          get() { return state; },
          set(newState) {
            state = { ...state, ...newState };
            listeners.forEach(fn => fn(state));
          },
          subscribe(fn) {
            listeners.push(fn);
            fn(state); // Call immediately
            return () => listeners.splice(listeners.indexOf(fn), 1);
          }
        };
      }

      // Initialize app store
      const appStore = createStore({
        count: 0,
        todos: [],
        isActive: false
      });

      // App methods
      window.app = {
        increment() {
          const { count } = appStore.get();
          appStore.set({ count: count + 1 });
        },
        decrement() {
          const { count } = appStore.get();
          appStore.set({ count: Math.max(0, count - 1) });
        },
        reset() {
          appStore.set({ count: 0 });
        },
        toggle() {
          const { isActive } = appStore.get();
          appStore.set({ isActive: !isActive });
        },
        addTodo() {
          const input = document.getElementById('todoInput');
          const text = input.value.trim();
          if (!text) return;
          const { todos } = appStore.get();
          appStore.set({ todos: [...todos, { id: Date.now(), text, done: false }] });
          input.value = '';
        },
        toggleTodo(id) {
          const { todos } = appStore.get();
          appStore.set({
            todos: todos.map(t => t.id === id ? { ...t, done: !t.done } : t)
          });
        },
        deleteTodo(id) {
          const { todos } = appStore.get();
          appStore.set({ todos: todos.filter(t => t.id !== id) });
        }
      };

      // Update UI based on state
      function updateUI(state) {
        // Update counter
        const counterDisplay = document.getElementById('counterDisplay');
        if (counterDisplay) counterDisplay.textContent = 'Count: ' + state.count;

        // Update todo count
        const todoCount = document.getElementById('todoCount');
        if (todoCount) todoCount.textContent = state.todos.length + ' items';

        // Update toggle button
        const toggleBtn = document.getElementById('toggleBtn');
        if (toggleBtn) {
          toggleBtn.textContent = state.isActive ? 'Active' : 'Inactive';
          toggleBtn.className = 'btn ' + (state.isActive ? 'btn--success' : 'btn--secondary');
        }

        // Show/hide toggle content
        const toggleContent = document.getElementById('toggleContent');
        if (toggleContent) toggleContent.style.display = state.isActive ? 'block' : 'none';

        // Render todo list
        const list = document.getElementById('todoList');
        if (list) {
          list.innerHTML = state.todos.map(todo => \`
            <div style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;border-bottom:1px solid var(--border)">
              <input type="checkbox" \${todo.done ? 'checked' : ''} onchange="window.app?.toggleTodo(\${todo.id})" />
              <span style="\${todo.done ? 'text-decoration:line-through;opacity:0.5' : ''}">\${todo.text}</span>
              <button onclick="window.app?.deleteTodo(\${todo.id})" style="margin-left:auto;background:none;border:none;color:var(--primary);cursor:pointer">×</button>
            </div>
          \`).join('');
        }
      }

      // Subscribe to store changes
      appStore.subscribe(updateUI);
    })();
  </script>
</body>
</html>`
}
