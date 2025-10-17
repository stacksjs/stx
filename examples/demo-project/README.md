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

### NEW! Serve .stx Files Directly (Like JSX)

```bash
# The simplest way - just serve your .stx files!
bun ../../packages/bun-plugin/dist/serve.js pages/*.stx
```

That's it! Your server is running at http://localhost:3456

### Alternative Methods

#### 1. Using Package Scripts

```bash
# Build static files
bun run build

# Start development server
bun run dev
```

#### 2. Custom Port

```bash
bun ../../packages/bun-plugin/dist/serve.js pages/ --port 3000
```

#### 3. Specific Files Only

```bash
bun ../../packages/bun-plugin/dist/serve.js pages/home.stx pages/about.stx
```

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

### JSX vs STX Comparison

```bash
# JSX (how Bun normally works)
bun app.tsx

# STX (how it works now!)
bun ../../packages/bun-plugin/dist/serve.js pages/*.stx
```

Both are equally simple! 🎉

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
