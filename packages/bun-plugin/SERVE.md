# Serving .stx Files Directly

YES! You can now serve `.stx` files directly, similar to how you can with JSX/TSX files.

## 🚀 Quick Start

### Method 1: Using the CLI (Easiest!)

```bash
# Serve all .stx files in a directory
bun-plugin-stx serve pages/*.stx

# Serve specific files
bun-plugin-stx serve index.stx about.stx

# Serve a directory
bun-plugin-stx serve pages/

# Custom port
bun-plugin-stx serve pages/ --port 3000
```

**How it works:**
- Automatically discovers and builds your .stx files
- Starts a development server
- Smart routing: `home.stx` → `/`, `about.stx` → `/about`
- Live 404 page with navigation

### Method 2: Using bunfig.toml (Runtime Imports)

1. Create `bunfig.toml` in your project:

```toml
preload = ["bun-plugin-stx/preload"]
```

2. Now you can import `.stx` files in your code:

```typescript
// server.ts
import homeContent from './pages/home.stx'
import aboutContent from './pages/about.stx'

Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url)

    if (url.pathname === '/') {
      return new Response(homeContent, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    if (url.pathname === '/about') {
      return new Response(aboutContent, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    return new Response('Not Found', { status: 404 })
  }
})
```

Then run:
```bash
bun run server.ts
```

### Method 3: Direct Bun Command (With Preload)

```bash
# Serve with preload
bun --preload bun-plugin-stx/preload your-server.ts

# Or use bunfig.toml and just:
bun your-server.ts
```

## 📝 Full Examples

### Example 1: CLI Serve

```bash
cd demo-project
bun-plugin-stx serve pages/*.stx
```

Output:
```
🚀 Starting stx development server...

📄 Found 3 .stx files:
   - pages/home.stx
   - pages/about.stx
   - pages/contact.stx

🔨 Building...
✅ Build complete

🌐 Server running at: http://localhost:3456

📚 Available routes:
   http://localhost:3456/
   http://localhost:3456/about
   http://localhost:3456/contact
```

### Example 2: Custom Server with Imports

```typescript
// serve.ts
import { Glob } from 'bun'

// Auto-discover all .stx files
const glob = new Glob('pages/**/*.stx')
const files = await Array.fromAsync(glob.scan('.'))

// Build route map
const routes = new Map()
for (const file of files) {
  const name = file.replace('pages/', '').replace('.stx', '')
  const route = name === 'home' ? '/' : `/${name}`

  // Import the .stx file (plugin processes it)
  const content = await import(`./${file}`)
  routes.set(route, content.default)
}

// Serve
Bun.serve({
  port: 3456,
  fetch(req) {
    const url = new URL(req.url)
    const content = routes.get(url.pathname)

    if (content) {
      return new Response(content, {
        headers: { 'Content-Type': 'text/html' }
      })
    }

    return new Response('404', { status: 404 })
  }
})
```

With bunfig.toml:
```toml
preload = ["bun-plugin-stx/preload"]
```

Run it:
```bash
bun serve.ts
```

### Example 3: Quick File Serve

The absolute simplest way:

```bash
# In your project directory
echo 'preload = ["bun-plugin-stx/preload"]' > bunfig.toml

# Create a simple server
cat > serve.ts << 'EOF'
import home from './pages/home.stx'

Bun.serve({
  fetch: () => new Response(home, {
    headers: { 'Content-Type': 'text/html' }
  })
})
EOF

# Run it
bun serve.ts
```

## 🎯 Comparison with JSX

### JSX (How Bun normally works):
```bash
# Bun can directly run JSX
bun app.tsx
```

### STX (How it now works):
```bash
# Option 1: Use the CLI
bun-plugin-stx serve pages/*.stx

# Option 2: Use bunfig.toml preload
bun --preload bun-plugin-stx/preload app.ts

# Option 3: Configure bunfig.toml once, then:
bun app.ts  # Just works!
```

## 📦 Installation

If you haven't already:

```bash
bun add bun-plugin-stx
```

Or in a monorepo/workspace:

```json
{
  "dependencies": {
    "bun-plugin-stx": "workspace:*"
  }
}
```

## 🔧 Advanced Usage

### Custom Port

```bash
bun-plugin-stx serve pages/ --port 8080
```

### Watch Mode (Auto-reload on changes)

The CLI doesn't have watch mode yet, but you can use Bun's `--watch`:

```bash
bun --watch serve.ts
```

### With TypeScript

Create type declarations for .stx files:

```typescript
// stx.d.ts
declare module '*.stx' {
  const content: string
  export default content
}
```

Add to `tsconfig.json`:

```json
{
  "include": ["**/*.ts", "**/*.stx", "stx.d.ts"]
}
```

Now TypeScript won't complain about .stx imports!

### Integration with Existing Server

```typescript
import express from 'express'
import homeContent from './pages/home.stx'

const app = express()

app.get('/', (req, res) => {
  res.type('html').send(homeContent)
})

app.listen(3000)
```

## 🎨 What This Enables

✅ **Direct serving** - No manual build step needed
✅ **Import .stx files** - Use them like any other module
✅ **Hot reloading** - Changes reflect immediately (with --watch)
✅ **Simple deployment** - One command to serve your site
✅ **Development speed** - Fast iteration with Bun's speed
✅ **Type safety** - TypeScript support with declarations

## 🐛 Troubleshooting

**"Command not found: bun-plugin-stx"**

Make sure the plugin is installed and built:
```bash
cd packages/bun-plugin
bun run build
```

Or use the full path:
```bash
bun packages/bun-plugin/dist/serve.js pages/*.stx
```

**"Cannot find module"**

Make sure `bunfig.toml` is in your project root with the preload configured.

**".stx files not processing"**

Verify the plugin is loaded:
```bash
bun --preload bun-plugin-stx/preload -e "console.log('Plugin loaded')"
```

You should see: `✅ stx plugin loaded - .stx files can now be imported`

## 📚 More Examples

See the `demo-project/` directory for a complete working example with:
- Multiple pages
- Navigation
- Styled components
- Route handling

Run it:
```bash
cd demo-project
bun-plugin-stx serve pages/*.stx
```

---

**Summary:** You can now serve .stx files directly using `bun-plugin-stx serve` or by configuring `bunfig.toml` with the preload option! 🎉
