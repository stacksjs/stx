# Quick Start Guide

Get up and running with the stx VSCode extension in minutes!

## 📦 Installation

1. Open Visual Studio Code
2. Open the Extensions view (`Cmd+Shift+X` on Mac, `Ctrl+Shift+X` on Windows/Linux)
3. Search for "stx" or "Stacks"
4. Click "Install"
5. Reload VS Code when prompted

That's it! The extension is now active for all `.stx` files.

## 🎯 Your First Template

Let's create a simple "Hello World" template to see the extension in action.

### Step 1: Create a New File

Create a file named `hello.stx` in your workspace.

### Step 2: Add Some Code

Type or paste this code:

```stx
@ts
  const name = 'World'
  const currentTime = new Date().toLocaleTimeString()
@endts

<!DOCTYPE html>
<html>
<head>
  <title>Hello, {{ name }}!</title>
</head>
<body>
  <h1>Hello, {{ name }}! 👋</h1>
  <p>The current time is {{ currentTime }}</p>
</body>
</html>
```

### Step 3: Explore the Features

Now try these things:

1. **Hover over `@ts`** - You'll see documentation about TypeScript blocks
2. **Hover over `name`** - See the variable's type information
3. **Type `@` and wait** - Get autocomplete suggestions for directives
4. **Hover over `name` in `{{ name }}`** - See the value and type

## 🎨 Adding Utility Classes

Let's add some styling with utility classes:

```stx
@ts
  const name = 'World'
@endts

<div class="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md">
    <h1 class="text-3xl font-bold text-gray-900 mb-4">
      Hello, {{ name }}! 👋
    </h1>
    <p class="text-gray-600">
      Welcome to stx templates with TypeScript!
    </p>
  </div>
</div>
```

**Try this:**
- Hover over `bg-blue-500` - See the actual blue color
- Hover over `flex` - See `display: flex;`
- Use `Cmd+Shift+P` → "Stacks: Sort Utility Classes" to organize them

## 🔄 Working with Loops

Let's create a list of items:

```stx
@ts
  interface Product {
    id: number
    name: string
    price: number
  }

  const products: Product[] = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 },
    { id: 3, name: 'Keyboard', price: 79 }
  ]
@endts

<div class="p-6">
  <h2 class="text-2xl font-bold mb-4">Our Products</h2>

  <div class="space-y-3">
    @foreach (products as product)
      <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
        <span class="font-medium">{{ product.name }}</span>
        <span class="text-green-600 font-bold">${{ product.price }}</span>
      </div>
    @endforeach
  </div>
</div>
```

**Notice:**
- Hover over `@foreach` to see how it works
- Type `product.` inside the loop - get autocomplete for `id`, `name`, `price`
- The extension understands the type of `product` in the loop!

## ✅ Using Conditionals

Add conditional rendering:

```stx
@ts
  const user = {
    name: 'Alice',
    isAdmin: true,
    notifications: 3
  }
@endts

<div class="p-6">
  <h1>Welcome, {{ user.name }}!</h1>

  @if (user.isAdmin)
    <div class="bg-purple-100 text-purple-800 p-3 rounded">
      👑 You have admin privileges
    </div>
  @endif

  @if (user.notifications > 0)
    <div class="bg-blue-100 text-blue-800 p-3 rounded mt-2">
      📬 You have {{ user.notifications }} new notifications
    </div>
  @else
    <p class="text-gray-600 mt-2">No new notifications</p>
  @endif
</div>
```

## 🧩 Creating Components

Break your code into reusable pieces:

**File: `components/button.stx`**
```stx
@ts
  const color = $props.color || 'blue'
  const text = $props.text || 'Click me'
@endts

<button class="px-6 py-2 bg-{{ color }}-500 hover:bg-{{ color }}-600 text-white rounded-lg font-medium transition">
  {{ text }}
</button>
```

**File: `main.stx`**
```stx
<div class="flex gap-3">
  @component('components.button', { color: 'blue', text: 'Save' })
  @component('components.button', { color: 'red', text: 'Delete' })
  @component('components.button', { color: 'green', text: 'Submit' })
</div>
```

## ⚙️ Useful Settings

Press `Cmd+,` (or `Ctrl+,` on Windows/Linux) and search for "stx" to customize:

### Essential Settings

```json
{
  // Show hover documentation
  "stx.hover.enable": true,

  // Show color previews for utility classes
  "stx.utilityClasses.colorPreview": true,

  // Show CSS when hovering utility classes
  "stx.utilityClasses.hoverPreview": true,

  // Enable error checking
  "stx.diagnostics.enable": true
}
```

### Optional Settings

```json
{
  // Auto-sort utility classes on save
  "stx.utilityClasses.sortOnSave": false,

  // Show code examples in hover tooltips
  "stx.hover.showExamples": true,

  // Enable semantic syntax highlighting
  "stx.semanticHighlighting.enable": true
}
```

## 🎓 Learning Path

Now that you have the basics, explore more:

1. **[Complete Features Guide](./FEATURES.md)** - Learn all the features in depth
2. **[Examples Folder](../examples/)** - See real-world templates
3. **[Usage Guide](./USAGE.md)** - Tips, tricks, and best practices

## 💡 Quick Tips

### Tip 1: Use Snippets
Type `@` followed by a directive name and press `Tab` for instant snippets:
- `@if` + Tab → Complete if-endif block
- `@for` + Tab → Complete foreach block with placeholders

### Tip 2: Sort Your Classes
Keep utility classes readable by sorting them regularly:
- Command: `Cmd+Shift+P` → "Stacks: Sort Utility Classes"
- Or enable auto-sort: `"stx.utilityClasses.sortOnSave": true`

### Tip 3: Explore with Hover
Hover over EVERYTHING:
- Directives → See documentation and examples
- Variables → See types and values
- Functions → See signatures
- Utility classes → See generated CSS and colors

### Tip 4: Use TypeScript
Take advantage of TypeScript's type system:

```stx
@ts
  // Define types for better autocomplete
  interface User {
    name: string
    email: string
  }

  // Get full IntelliSense
  const user: User = {
    name: 'John',
    email: 'john@example.com'
  }
@endts

<!-- Autocomplete works perfectly here -->
<p>{{ user. }}</p>
```

### Tip 5: Organize Your Templates
Structure your project for better maintainability:

```
templates/
├── layouts/
│   ├── app.stx
│   └── admin.stx
├── components/
│   ├── button.stx
│   ├── card.stx
│   └── modal.stx
├── partials/
│   ├── header.stx
│   └── footer.stx
└── pages/
    ├── home.stx
    └── about.stx
```

## 🐛 Common Issues

### Issue: Syntax highlighting not working
**Solution:**
1. Check the bottom-right corner shows "stx" as the language
2. If not, click it and select "stx" from the list
3. Reload VS Code: `Cmd+Shift+P` → "Developer: Reload Window"

### Issue: Hover not showing
**Solution:**
1. Check `stx.hover.enable` is `true` in settings
2. Make sure you're in a `.stx` file
3. Reload window

### Issue: Colors not previewing
**Solution:**
1. Check `stx.utilityClasses.colorPreview` is `true`
2. Reload window to reinitialize Headwind

### Issue: Autocomplete not working
**Solution:**
1. Make sure the file is saved with `.stx` extension
2. Check that TypeScript is working (try in a `@ts` block)
3. Reload window

## 🎉 You're Ready!

You now know enough to start building with stx! Remember:

- **Hover** over things to learn
- **Explore** the examples folder
- **Experiment** with features
- **Read** the full docs when you need more

Happy coding! 🚀

---

**Need Help?**
- [Full Documentation](./FEATURES.md)
- [GitHub Issues](https://github.com/stacksjs/stx/issues)
- [Stacks Discord](https://discord.gg/stacksjs)
