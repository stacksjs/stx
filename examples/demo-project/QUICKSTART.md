# Quick Start - Serving .stx Files

## 🎉 YES! You Can Now Run: `bun serve *.stx`

Well, almost! Here's how:

## Method 1: Simple CLI Command (Recommended)

```bash
# Serve all .stx files in a directory
bun ../packages/bun-plugin/dist/serve.js pages/*.stx

# Or with custom port
bun ../packages/bun-plugin/dist/serve.js pages/ --port 3000

# Or specific files
bun ../packages/bun-plugin/dist/serve.js pages/home.stx pages/about.stx
```

**What you'll see:**
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

## Method 2: Using Package Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "serve": "bun ../packages/bun-plugin/dist/serve.js pages/"
  }
}
```

Then just:
```bash
bun run serve
```

## Method 3: Using bunfig.toml (Advanced)

Create `bunfig.toml`:
```toml
preload = ["bun-plugin-stx/preload"]
```

Then create a simple server:
```typescript
// my-server.ts
import home from './pages/home.stx'
import about from './pages/about.stx'

const routes = {
  '/': home,
  '/about': about
}

Bun.serve({
  fetch(req) {
    const path = new URL(req.url).pathname
    return new Response(routes[path] || '404', {
      headers: { 'Content-Type': 'text/html' }
    })
  }
})
```

Run it:
```bash
bun my-server.ts
```

## 🚀 Try It Now!

From this directory:

```bash
# Option 1: Using the built-in serve.ts
bun run dev

# Option 2: Using the CLI directly
bun ../packages/bun-plugin/dist/serve.js pages/

# Option 3: Just build
bun run build
```

Then visit:
- http://localhost:3456/ (home)
- http://localhost:3456/about
- http://localhost:3456/contact

## 📝 How It's Different from JSX

### JSX (Traditional):
```bash
# Bun can run JSX directly
bun run app.tsx
```

### STX (Now Available):
```bash
# Use the serve command
bun-plugin-stx serve pages/*.stx

# Or with bunfig.toml preload
bun run your-server.ts
```

## ✨ What This Enables

✅ **No build step** - Just serve directly
✅ **Hot reload** - Use with `bun --watch`
✅ **Simple deployment** - One command
✅ **Fast development** - Instant feedback
✅ **Import .stx** - Treat them like modules

## 🎯 Real-World Usage

### Development Server
```bash
# Start development with watch mode
bun --watch ../packages/bun-plugin/dist/serve.js pages/
```

### Production
```bash
# Build to static files
bun run build

# Deploy the dist/ folder
```

### Docker
```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install
CMD ["bun", "../packages/bun-plugin/dist/serve.js", "pages/"]
```

---

**You can now serve .stx files as easily as JSX!** 🎉
