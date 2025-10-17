# STX Demo Project

This is a demo project showing how to use `bun-plugin-stx` in a real application.

## 📁 Project Structure

```
demo-project/
├── pages/
│   ├── home.stx      # Home page
│   ├── about.stx     # About page
│   └── contact.stx   # Contact page
├── dist/             # Build output (generated)
├── build.ts          # Build script
├── serve.ts          # Development server
└── package.json
```

## 🚀 Quick Start

### The Simplest Way (Recommended)

Just run the server:

```bash
bun server.ts
```

That's it! Your server is running at http://localhost:3000

This uses Bun's native fullstack dev server with .stx files as routes, configured via `bunfig.toml`.

### How It Works

The server builds .stx files on startup and serves them through Bun.serve():

```typescript
// server.ts
import { serve } from "bun"
import { Glob } from "bun"
import stxPlugin from "bun-plugin-stx"

// 1. Build all .stx files
const glob = new Glob("pages/**/*.stx")
const stxFiles = await Array.fromAsync(glob.scan("."))

const buildResult = await Bun.build({
  entrypoints: stxFiles,
  outdir: "./dist",
  plugins: [stxPlugin()],
})

// 2. Create routes from built HTML
const routes = {}
for (const output of buildResult.outputs) {
  if (output.path.endsWith(".html")) {
    const filename = output.path.split("/").pop().replace(".html", "")
    const route = filename === "home" ? "/" : `/${filename}`
    const html = await output.text()
    routes[route] = new Response(html, {
      headers: { "Content-Type": "text/html" },
    })
  }
}

// 3. Serve with Bun
serve({
  routes,
  development: true,
})
```

This approach:
- ✅ Builds .stx files once on startup
- ✅ Uses standard Bun.serve() patterns
- ✅ Works with development mode
- ✅ Simple `bun server.ts` command

### With API Endpoints

```bash
bun server-with-api.ts
```

This demonstrates combining .stx routes with API endpoints in one server.

## 📄 Available Pages

- **Home** - http://localhost:3456/
- **About** - http://localhost:3456/about
- **Contact** - http://localhost:3456/contact

## 🎯 What This Demonstrates

✅ **Direct serving** - Serve .stx files like JSX, no build step needed
✅ **Automatic file discovery** - Finds all .stx files automatically
✅ **Multi-page application** - Multiple routes from multiple .stx files
✅ **Template directives** - @foreach, @if, variable interpolation
✅ **Hot builds** - Build and serve in one command
✅ **404 handling** - Custom 404 page with navigation
✅ **Clean routing** - home.stx maps to /, about.stx to /about

### HTML vs STX Comparison

**HTML (Bun's native support):**
```typescript
import home from "./index.html"

Bun.serve({
  routes: { "/": home },
  development: true,
})
```

**STX (Now works the same way!):**
```typescript
import home from "./pages/home.stx"

Bun.serve({
  routes: { "/": home },
  development: true,
})
```

Configure the plugin once in `bunfig.toml` and it just works! 🎉

## 🛠 How It Works

1. **Build Process** (`build.ts`)
   - Discovers all `.stx` files using Bun's Glob API
   - Passes them to `Bun.build()` with the stx plugin
   - Outputs compiled HTML to `dist/`

2. **Development Server** (`serve.ts`)
   - Builds the project first
   - Creates a route map from the built HTML files
   - Serves pages using `Bun.serve()`
   - Provides 404 handling with navigation

3. **Template Processing**
   - Each `.stx` file has a `<script>` section with exports
   - Variables are used in the template with `{{ variable }}`
   - Directives like `@foreach` are processed
   - Final output is clean HTML

## 📝 Creating New Pages

1. Create a new `.stx` file in `pages/`:

```html
<!-- pages/products.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>Products</title>
  <script>
    export const products = [
      { name: "Product 1", price: 99 },
      { name: "Product 2", price: 149 }
    ];
  </script>
</head>
<body>
  <h1>Our Products</h1>
  @foreach (products as product)
    <div>{{ product.name }} - ${{ product.price }}</div>
  @endforeach
</body>
</html>
```

2. Rebuild and restart the server:

```bash
bun run dev
```

3. Visit http://localhost:3456/products

That's it! The new page is automatically discovered and served.

## 🔧 Customization

### Change the port

Edit `serve.ts`:

```typescript
const server = Bun.serve({
  port: 3000, // Change this
  // ...
})
```

### Add custom plugins

Edit `build.ts` or `serve.ts`:

```typescript
const result = await Bun.build({
  entrypoints,
  outdir: './dist',
  plugins: [
    stxPlugin({
      debug: true,
      cache: true,
      // ... other options
    })
  ],
})
```

### Watch mode (auto-rebuild on changes)

You can use Bun's file watcher:

```typescript
import { watch } from 'fs'

watch('./pages', { recursive: true }, async (event, filename) => {
  if (filename?.endsWith('.stx')) {
    console.log(`🔄 Rebuilding ${filename}...`)
    // Rebuild logic here
  }
})
```

## 💡 Tips

- Keep your `.stx` files in the `pages/` directory for organization
- Use consistent naming: `home.stx` for `/`, `about.stx` for `/about`
- Add shared components in a `components/` directory
- Use the `@include()` directive to reuse components
- Enable `debug: true` in the plugin options to see processing details

## 🐛 Troubleshooting

**Build fails:**
- Check syntax in your `.stx` files
- Ensure script exports are valid JavaScript
- Check the console for detailed error messages

**Page not loading:**
- Make sure the route matches the filename (minus `.stx`)
- Check that the file was built (look in `dist/`)
- Verify the server is running on the expected port

**Styles not applying:**
- Styles in `<style>` tags are included in the output
- Check browser devtools for CSS errors

Happy coding with stx! 🎉
