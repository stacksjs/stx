# STX Demo Project

A complete demo showing the simplest way to use `.stx` files with the bun-plugin.

## 🎯 The Simplest Workflow

### 1. Install the plugin

```bash
bun add bun-plugin-stx
```

### 2. Serve your .stx files

```bash
# Using the serve command directly
bun serve pages/*.stx

# Or specific files
bun serve pages/home.stx pages/about.stx

# Or a directory
bun serve pages/

# Custom port
bun serve pages/*.stx --port 3000
```

That's it! No configuration needed.

## 📁 Project Structure

```
demo-project/
├── pages/
│   ├── home.stx      # Serves at /
│   ├── about.stx     # Serves at /about
│   └── contact.stx   # Serves at /contact
└── package.json
```

## 🚀 Quick Start

From this directory:

```bash
# Option 1: Use package script
bun run dev

# Option 2: Direct command (after install)
bun serve pages/*.stx

# Option 3: Custom server (advanced)
bun server.ts
```

## 🎨 What `.stx` Files Look Like

```html
<!-- pages/home.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <script>
    export const title = "My Site";
    export const items = ["One", "Two", "Three"];
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>
</body>
</html>
```

## 📝 Available Commands

### Development

```bash
# Start dev server (watches for changes)
bun run dev

# Same as above
bun run start
```

### Serve Specific Files

```bash
# Just home and about pages
bun serve pages/home.stx pages/about.stx

# All .stx files
bun serve pages/*.stx

# All files in directory
bun serve pages/
```

### Build for Production

```bash
# Build static HTML files
bun run build
```

## 🌐 How It Works

When you run `bun serve pages/*.stx`:

1. **Discovers files** - Finds all .stx files matching your pattern
2. **Builds** - Processes each .stx file through the plugin
3. **Serves** - Starts a development server with hot reloading
4. **Routes** - Smart routing: `home.stx` → `/`, `about.stx` → `/about`

## 📄 Available Pages

Once the server is running at http://localhost:3456:

- **Home** - http://localhost:3456/
  - Features grid
  - Navigation
  - Styled layout

- **About** - http://localhost:3456/about
  - Team member cards
  - Dynamic rendering with @foreach

- **Contact** - http://localhost:3456/contact
  - Contact information
  - Variable interpolation

## ⚡ Features

✅ **Zero configuration** - Just install and serve
✅ **Hot reloading** - Changes reflect immediately
✅ **Smart routing** - Automatic route mapping
✅ **Template features** - Variables, loops, conditionals
✅ **Fast** - Powered by Bun
✅ **Simple** - One command to serve

## 📦 Installation in Your Project

```bash
# 1. Create a new project
mkdir my-stx-project
cd my-stx-project

# 2. Initialize
bun init -y

# 3. Install the plugin
bun add bun-plugin-stx

# 4. Create a page
cat > index.stx << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>My Site</title>
  <script>
    export const message = "Hello World!";
  </script>
</head>
<body>
  <h1>{{ message }}</h1>
</body>
</html>
EOF

# 5. Serve it!
bun serve index.stx
```

Visit http://localhost:3456 and you're done!

## 🔧 Advanced: Custom Server

If you need more control (API routes, custom logic), see `server.ts` and `server-with-api.ts` for examples of building a custom server with `Bun.serve()`.

```typescript
// server.ts
import { serve } from "bun"
import { Glob } from "bun"
import stxPlugin from "bun-plugin-stx"

// Build .stx files
const result = await Bun.build({
  entrypoints: await Array.fromAsync(new Glob("pages/*.stx").scan(".")),
  plugins: [stxPlugin()],
})

// Create routes and serve
const routes = {}
// ... route logic ...

serve({ routes, development: true })
```

## 🎯 Comparison with Other Tools

### HTML (Static)
```bash
bun --hot index.html  # Bun's static server
```

### STX (Dynamic Templates)
```bash
bun serve index.stx   # With templating features!
```

## 💡 Tips

- **File naming**: `home.stx` or `index.stx` will serve at `/`
- **Custom port**: Add `--port 8080` to any serve command
- **Watch mode**: Built-in with the serve command
- **Production**: Use `bun run build` to generate static HTML

## 🐛 Troubleshooting

**Command not found: serve**

The `serve` command is provided by the `bun-plugin-stx` package. Make sure it's installed:
```bash
bun add bun-plugin-stx
```

Then use the full command:
```bash
bun ./node_modules/bun-plugin-stx/dist/serve.js pages/*.stx
```

Or add to package.json scripts and use `bun run dev`.

**Port in use**

Change the port:
```bash
bun serve pages/*.stx --port 3001
```

**Files not found**

Make sure your pattern is correct:
```bash
# Check what files exist
ls pages/*.stx

# Then serve them
bun serve pages/*.stx
```

---

**Super simple workflow:** Install → Serve → Done! 🎉
