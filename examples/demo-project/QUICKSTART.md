# Quick Start - The Simplest Workflow ⚡

This is exactly what you wanted - the simplest possible way to use `.stx` files!

## 🎯 3-Step Workflow

### 1. Install the plugin

```bash
bun add bun-plugin-stx
```

### 2. Add script to package.json

```json
{
  "scripts": {
    "dev": "bun serve pages/*.stx"
  }
}
```

> Note: `bun serve` here refers to the `serve` binary from `bun-plugin-stx`

### 3. Run it!

```bash
bun run dev
```

That's it! 🎉 Visit http://localhost:3456

## 📝 Full Example from Scratch

```bash
# 1. Create project
mkdir my-site && cd my-site
bun init -y

# 2. Install plugin
bun add bun-plugin-stx

# 3. Create a page
cat > home.stx << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
  <script>
    export const title = "My Site";
    export const message = "Hello World!";
  </script>
</head>
<body>
  <h1>{{ title }}</h1>
  <p>{{ message }}</p>
</body>
</html>
EOF

# 4. Add serve script
cat > package.json << 'EOF'
{
  "name": "my-site",
  "type": "module",
  "scripts": {
    "dev": "bun ./node_modules/bun-plugin-stx/dist/serve.js *.stx"
  },
  "dependencies": {
    "bun-plugin-stx": "latest"
  }
}
EOF

# 5. Serve it!
bun run dev
```

Visit http://localhost:3456 - Done! 🚀

## 🌟 What You Get

- ✅ **Zero config** - No bunfig.toml needed
- ✅ **No build step** - Just serve
- ✅ **Template features** - Variables, loops, conditionals
- ✅ **Hot reload** - Changes reflect instantly
- ✅ **Smart routing** - `home.stx` → `/`, `about.stx` → `/about`

## 📦 Command Variations

```bash
# Serve all .stx files in a folder
bun serve pages/*.stx

# Serve specific files
bun serve home.stx about.stx

# Serve a directory
bun serve pages/

# Custom port
bun serve pages/*.stx --port 3000

# Single file
bun serve index.stx
```

> **Note:** After `bun add bun-plugin-stx`, the `serve` command is available in your node_modules/.bin

## 💡 Usage Patterns

### Pattern 1: Package Scripts (Recommended)

```json
{
  "scripts": {
    "dev": "bun ./node_modules/bun-plugin-stx/dist/serve.js pages/*.stx",
    "start": "bun ./node_modules/bun-plugin-stx/dist/serve.js pages/*.stx --port 8080"
  }
}
```

Then:
```bash
bun run dev
bun run start
```

### Pattern 2: Direct Path

```bash
bun ./node_modules/bun-plugin-stx/dist/serve.js pages/*.stx
```

### Pattern 3: Global Install (After npm publish)

```bash
bun add -g bun-plugin-stx
stx-serve pages/*.stx
```

## 🎨 Template Syntax Cheat Sheet

```html
<!DOCTYPE html>
<html>
<head>
  <script>
    export const name = "World";
    export const items = ["A", "B", "C"];
    export const show = true;
  </script>
</head>
<body>
  <!-- Variables -->
  <h1>Hello {{ name }}!</h1>

  <!-- Loops -->
  <ul>
    @foreach (items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>

  <!-- Conditionals -->
  @if (show)
    <p>This is shown</p>
  @endif
</body>
</html>
```

## ⚡ This Demo

From this directory:

```bash
# Start dev server
bun run dev

# Serves:
# - http://localhost:3456/ (home.stx)
# - http://localhost:3456/about (about.stx)
# - http://localhost:3456/contact (contact.stx)
```

## 📊 Before vs After

### ❌ Before (Complex)
```bash
# Step 1: Configure bunfig.toml
# Step 2: Create build script
# Step 3: Create server script
# Step 4: Run build
# Step 5: Run server
```

### ✅ After (Simple)
```bash
bun add bun-plugin-stx
bun run dev
```

**2 commands!** 🎉

---

**This is the workflow you asked for:**
1. `bun add bun-plugin-stx`
2. Add script to package.json
3. `bun run dev`

Done!
