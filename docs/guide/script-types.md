# Script Types

Understanding script types is the single most important concept in stx. There are exactly two script types, and they run in completely different environments.

## The Two Script Types

| Tag | Runs on | When | Output |
|-----|---------|------|--------|
| `<script server>` | Server (Bun) | Build time (SSG) or per-request (SSR) | Stripped from HTML -- never reaches browser |
| `<script client>` | Browser | Page load | Shipped as-is in the final HTML |

A bare `<script>` tag (without `server` or `client`) is treated as **client-side**. We recommend always being explicit with `<script client>` for clarity.

TypeScript is the default. You never need `lang="ts"` on any script tag.

## `<script server>` -- Server-Side Execution

Server scripts run in Bun on the server. They make variables available to template expressions (`{{ }}`). This is where you fetch data, query databases, set SEO metadata, and define page configuration.

```html
<script server>
const response = await fetch('https://api.example.com/posts')
const posts = await response.json()

const title = 'Our Blog'
const description = 'Latest posts from the team'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
})

definePageMeta({
  layout: 'marketing',
})
</script>

<h1>{{ title }}</h1>

<ul>
  @foreach(posts as post)
    <li>{{ post.title }}</li>
  @endforeach
</ul>
```

### What You Can Do in `<script server>`

- **Data fetching**: `fetch()`, database queries, file reads
- **SEO**: `useSeoMeta()`, `definePageMeta()`
- **Variable declarations**: All `const`, `let`, `var`, and `function` declarations are automatically available to `{{ }}` expressions
- **Use secrets**: API keys, database credentials -- this code never reaches the browser
- **Import server modules**: Bun APIs, Node.js builtins, server-only npm packages

### What You Cannot Do in `<script server>`

- Access `document`, `window`, `localStorage`, or any browser API
- Use signals (`state()`, `derived()`, `effect()`)
- Attach event handlers
- Call `onMount()` or any lifecycle hook

### The `export` Keyword Is Optional

All variable declarations in `<script server>` are automatically made available to the template. You do not need to export anything:

```html
<script server>
// Both of these work identically:
const title = 'Hello'            // auto-exported
export const subtitle = 'World'  // explicitly exported

function greet(name) {            // auto-exported
  return `Hello, ${name}!`
}
</script>

<h1>{{ title }}</h1>
<p>{{ greet('Alice') }}</p>
```

## `<script client>` -- Browser Execution

Client scripts run in the browser after the page loads. This is where you create reactive state, attach event handlers, run lifecycle hooks, and build interactive features.

```html
<script client>
const count = state(0)
const doubled = derived(() => count() * 2)

function increment() {
  count.set(count() + 1)
}

onMount(() => {
  console.log('Page mounted!')
})
</script>

<button @click="increment()">
  Count: <span x-text="count()"></span>
</button>
<p>Doubled: <span x-text="doubled()"></span></p>
```

### What You Can Do in `<script client>`

- **Signals**: `state()`, `derived()`, `effect()`
- **Lifecycle hooks**: `onMount()`, `onDestroy()`
- **DOM manipulation**: `useRef()`, `document.querySelector()` (prefer `useRef`)
- **Event handlers**: Define functions called by `@click`, `@submit`, etc.
- **Composables**: `useHead()`, `useSeoMeta()`, `useAuth()`, custom composables
- **Navigation**: `navigate('/path')` for SPA transitions
- **Stores**: `useStore('name')` to access shared state

### What You Cannot Do in `<script client>`

- Access server-side secrets (they are stripped at build time)
- Run database queries
- Use Bun or Node.js APIs

## Both Scripts in One Page

A page can (and often should) have both script types. The server script handles data fetching and SEO, while the client script handles interactivity.

```html
<script server>
const response = await fetch('https://api.example.com/products')
const products = await response.json()

useSeoMeta({
  title: 'Product Catalog',
  description: `Browse our ${products.length} products`,
})
</script>

<script client>
const search = state('')
const sortBy = state('name')

function handleSearch(term) {
  search.set(term)
  // Client-side filtering happens via :for and reactive bindings
}

onMount(() => {
  // Focus the search input on page load
  document.getElementById('search-input')?.focus()
})
</script>

<h1>Product Catalog</h1>

<input
  id="search-input"
  type="text"
  placeholder="Search products..."
  x-model="search"
/>

<div>
  @foreach(products as product)
    <div class="product-card">
      <h2>{{ product.name }}</h2>
      <p>{{ product.description }}</p>
      <span>${{ product.price }}</span>
    </div>
  @endforeach
</div>
```

## SSG vs SSR: When Server Scripts Run

The `ssr` config flag controls **when** `<script server>` runs, not **whether** it runs.

| Mode | `<script server>` Runs | Result |
|------|------------------------|--------|
| SSG (`ssr: false`, default) | Once at `bun run build` | Static HTML in `dist/` |
| SSR (`ssr: true`) | Per request at runtime | Dynamic HTML from `.output/` server |
| Dev mode | Per request (always) | Dynamic for fast iteration |

In SSG mode, the server script runs once during the build. The output is baked into static HTML. This means:

- Data is frozen at build time
- Great for marketing pages, docs, blogs
- Cannot use request-specific data (cookies, headers)

In SSR mode, the server script runs on every request:

- Data is always fresh
- Can access request context
- Requires a running Bun server

## Security: Server Code Never Reaches the Browser

Everything inside `<script server>` is executed on the server and then **completely stripped** from the HTML output. Only the template expressions' rendered values appear in the final page.

```html
<script server>
// This API key NEVER appears in the browser
const API_KEY = process.env.SECRET_API_KEY
const data = await fetch(`https://api.example.com/data?key=${API_KEY}`)
const results = await data.json()
</script>

<!-- Only the rendered values appear in the HTML -->
<div>{{ results.summary }}</div>
```

The browser receives:

```html
<div>The actual summary text from the API</div>
```

No trace of the API key, the fetch call, or the server script tag.

## Common Patterns

### Marketing Page with SEO

```html
<script server>
const page = await fetch('https://cms.example.com/api/homepage').then(r => r.json())

useSeoMeta({
  title: page.seoTitle,
  description: page.seoDescription,
  ogImage: page.ogImage,
})
</script>

<script client>
const menuOpen = state(false)

function toggleMenu() {
  menuOpen.set(!menuOpen())
}
</script>

<nav>
  <button @click="toggleMenu()" class="md:hidden">
    Menu
  </button>
  <div :show="menuOpen()" class="md:block">
    @foreach(page.navItems as item)
      <a x-href="item.url">{{ item.label }}</a>
    @endforeach
  </div>
</nav>

<main>
  <h1>{{ page.headline }}</h1>
  <p>{{ page.subheadline }}</p>
</main>
```

### Dashboard with Client-Side Data Fetching

```html
<script server>
useSeoMeta({ title: 'Dashboard' })
definePageMeta({ layout: 'app', middleware: 'auth' })
</script>

<script client>
const stats = state(null)
const loading = state(true)
const error = state(null)

onMount(async () => {
  try {
    const res = await fetch('/api/dashboard/stats')
    stats.set(await res.json())
  } catch (e) {
    error.set(e.message)
  } finally {
    loading.set(false)
  }
})
</script>

<h1>Dashboard</h1>

<div :show="loading()">Loading...</div>
<div :show="error()" class="text-red-500" x-text="error()"></div>
<div :show="!loading() && !error()">
  <div class="grid grid-cols-3 gap-4">
    <div class="stat-card">
      <span x-text="stats()?.totalUsers"></span>
      <label>Total Users</label>
    </div>
    <div class="stat-card">
      <span x-text="stats()?.revenue"></span>
      <label>Revenue</label>
    </div>
  </div>
</div>
```

## Warnings

> **Do not use browser APIs in `<script server>`.**
> Code like `localStorage.getItem()` or `document.querySelector()` will throw a runtime error during build or SSR because those APIs do not exist in Bun.

> **Do not put secrets in `<script client>`.**
> Client scripts are shipped verbatim to the browser. API keys, database passwords, and any sensitive values must go in `<script server>` or environment variables accessed only on the server.

> **Do not use `state()` in `<script server>`.**
> Signals are a client-side reactivity primitive. They have no meaning on the server. Use plain variables in server scripts.

> **Bare `<script>` tags run on the client, not the server.**
> If you write `<script>` without the `server` attribute, it runs in the browser. This is by design and enforced across all code paths. Always use `<script server>` when you need server execution.
