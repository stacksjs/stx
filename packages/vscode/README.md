# stx Language Support for VS Code

> Beautiful, intelligent language support for stx templates in Visual Studio Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/stacks.vscode-stacks)](https://marketplace.visualstudio.com/items?itemName=stacks.vscode-stacks)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/stacks.vscode-stacks)](https://marketplace.visualstudio.com/items?itemName=stacks.vscode-stacks)
[![License](https://img.shields.io/github/license/stacksjs/stx)](https://github.com/stacksjs/stx/blob/main/LICENSE.md)

## What is stx?

**stx** is a modern templating language that brings the elegance of Laravel Blade to the TypeScript ecosystem. Write clean, expressive templates with the full power of TypeScript, complete with type checking, IntelliSense, and all the developer experience you expect from modern tooling.

## ✨ Features at a Glance

### 🎨 Syntax Highlighting
Beautiful, context-aware syntax highlighting that understands TypeScript, HTML, CSS, and stx directives.

```stx
@ts
  const user = { name: 'Sarah', role: 'admin' }
@endts

@if (user.role === 'admin')
  <div class="admin-panel">
    <h1>Welcome back, {{ user.name }}! 👋</h1>
  </div>
@endif
```

### 💡 Intelligent Hover Information
Hover over any directive, variable, or function to see helpful documentation, type information, and examples.

![Hover Example](https://via.placeholder.com/600x200?text=Hover+over+directives+to+see+documentation)

### 🎯 Smart Autocomplete
Get intelligent suggestions as you type - from directives to properties to file paths.

### 🌈 Utility Class Support
Built-in integration with utility-first CSS frameworks like Tailwind:
- **Color Previews**: See actual colors inline in your editor
- **Hover CSS**: View generated CSS when hovering over utility classes
- **Auto-sort**: Keep your classes organized automatically
- **Autocomplete**: Get suggestions with live previews

```stx
<button class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg">
  Click me
</button>
```

### 🔍 Error Detection
Catch mistakes early with built-in diagnostics:
- Unclosed directives
- Missing template files
- Type errors in expressions
- Invalid utility classes

### ⚡ And Much More
- Code folding for all directive blocks
- Semantic syntax highlighting
- Quick fixes and code actions
- Path completion for includes and components
- Live diagnostics

## 🚀 Getting Started

### Installation

1. Open VS Code
2. Press `Cmd+Shift+X` (Mac) or `Ctrl+Shift+X` (Windows/Linux)
3. Search for "stx" or "Stacks"
4. Click Install

Or [install from the marketplace](https://marketplace.visualstudio.com/items?itemName=stacks.vscode-stacks)

### First Template

Create a new file `hello.stx` and start typing:

```stx
@ts
  const greeting = 'Hello, World!'
  const user = {
    name: 'Alex',
    email: 'alex@example.com'
  }
@endts

<!DOCTYPE html>
<html>
<head>
  <title>{{ greeting }}</title>
</head>
<body>
  <div class="container mx-auto p-6">
    <h1 class="text-3xl font-bold text-gray-900">{{ greeting }}</h1>
    <p class="text-gray-600">Welcome, {{ user.name }}!</p>
  </div>
</body>
</html>
```

## 📖 Directive Guide

### Conditionals

Control what gets rendered based on conditions:

```stx
@if (user.isLoggedIn)
  <p>Welcome back!</p>
@elseif (user.isGuest)
  <p>Welcome, guest!</p>
@else
  <p>Please log in</p>
@endif

@unless (user.hasSeenWelcome)
  <div class="welcome-banner">First time here?</div>
@endunless
```

### Loops

Iterate over arrays and objects effortlessly:

```stx
@foreach (products as product, index)
  <div class="product-card">
    <span class="badge">{{ index + 1 }}</span>
    <h3>{{ product.name }}</h3>
    <p>${{ product.price }}</p>
  </div>
@endforeach

@for (let i = 0; i < 5; i++)
  <div>Item {{ i }}</div>
@endfor

@while (hasMore)
  <div>Loading more...</div>
@endwhile
```

### Components

Build reusable, modular templates:

```stx
@component('layouts.app')
  @slot('header')
    <h1>Dashboard</h1>
  @endslot

  <div class="content">
    @include('partials.sidebar')
    @include('partials.main-content')
  </div>
@endcomponent
```

### Code Blocks

Embed TypeScript or JavaScript directly:

```stx
@ts
  interface Product {
    id: number
    name: string
    price: number
  }

  const featured: Product[] = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 }
  ]

  function formatPrice(price: number): string {
    return `$${price.toFixed(2)}`
  }
@endts

@foreach (featured as product)
  <div>{{ product.name }}: {{ formatPrice(product.price) }}</div>
@endforeach
```

### Special Directives

```stx
<!-- Raw output (no processing) -->
@raw
  This content is {{ not processed }}
@endraw

<!-- Markdown rendering -->
@markdown
  # Welcome
  This **markdown** gets rendered as HTML!
@endmarkdown

<!-- Translations -->
@t('welcome.message')
@translate('auth.login')

<!-- CSS styling -->
@css
  .custom-class {
    background: linear-gradient(to right, #667eea, #764ba2);
  }
@endcss
```

## ⚙️ Configuration

Customize the extension to fit your workflow. Press `Cmd+,` (Mac) or `Ctrl+,` (Windows/Linux) and search for "stx":

```json
{
  // Hover Information
  "stx.hover.enable": true,
  "stx.hover.showExamples": true,

  // Diagnostics
  "stx.diagnostics.enable": true,
  "stx.diagnostics.validateUnclosedDirectives": true,
  "stx.diagnostics.validateTemplatePaths": true,

  // Utility Classes
  "stx.utilityClasses.enable": true,
  "stx.utilityClasses.colorPreview": true,
  "stx.utilityClasses.hoverPreview": true,
  "stx.utilityClasses.sortOnSave": false,

  // Code Actions
  "stx.codeActions.enable": true,

  // Folding
  "stx.folding.enable": true,

  // Semantic Highlighting
  "stx.semanticHighlighting.enable": true
}
```

## 🎨 Working with Utility Classes

The extension includes powerful support for utility-first CSS frameworks:

### See Your Colors

Hover over color utilities to see the actual color:

```stx
<div class="bg-purple-600 text-white">
  <!-- Hover over bg-purple-600 to see #9333EA -->
  Purple background!
</div>
```

### View Generated CSS

Hover over any utility class to see what CSS it generates:

```stx
<div class="flex items-center justify-between">
  <!-- Hover over 'flex' to see: display: flex; -->
  <!-- Hover over 'items-center' to see: align-items: center; -->
</div>
```

### Keep Classes Organized

Sort your utility classes for better readability:

**Command:** `Stacks: Sort Utility Classes`

```stx
<!-- Before -->
<div class="text-white p-4 bg-blue-500 flex rounded-lg items-center">

<!-- After -->
<div class="flex items-center rounded-lg bg-blue-500 p-4 text-white">
```

## 🎯 Keyboard Shortcuts

| Action | Shortcut (Mac) | Shortcut (Windows/Linux) |
|--------|----------------|--------------------------|
| Sort Utility Classes | `Cmd+Shift+P` → Sort | `Ctrl+Shift+P` → Sort |
| Reload Headwind | `Cmd+Shift+P` → Reload | `Ctrl+Shift+P` → Reload |
| Set Language Mode | `Cmd+K M` | `Ctrl+K M` |

## 📚 Documentation

- **[Quick Start Guide](./docs/QUICK-START.md)** - Get up and running in minutes
- **[Complete Features Guide](./docs/FEATURES.md)** - Detailed walkthrough of all features
- **[Usage Guide](./docs/USAGE.md)** - Tips and best practices
- **[Examples](./examples/)** - Sample stx files to learn from
- **[Troubleshooting](./docs/FEATURES.md#-troubleshooting)** - Common issues and solutions

## 🎓 Real-World Example

Here's a complete example showing multiple features working together:

```stx
@ts
  interface Task {
    id: number
    title: string
    completed: boolean
    priority: 'high' | 'medium' | 'low'
  }

  const tasks: Task[] = [
    { id: 1, title: 'Review PRs', completed: false, priority: 'high' },
    { id: 2, title: 'Update docs', completed: true, priority: 'medium' },
    { id: 3, title: 'Fix bugs', completed: false, priority: 'high' }
  ]

  function getPriorityColor(priority: string): string {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return colors[priority] || colors.low
  }

  const activeTasks = tasks.filter(t => !t.completed)
  const completedTasks = tasks.filter(t => t.completed)
@endts

<div class="max-w-4xl mx-auto p-6">
  <h1 class="text-3xl font-bold text-gray-900 mb-8">My Tasks</h1>

  @if (activeTasks.length > 0)
    <div class="mb-8">
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Active Tasks</h2>
      @foreach (activeTasks as task)
        <div class="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm mb-3">
          <div class="flex items-center space-x-3">
            <input type="checkbox" class="w-5 h-5">
            <span class="text-gray-900">{{ task.title }}</span>
          </div>
          <span class="px-3 py-1 text-sm rounded-full {{ getPriorityColor(task.priority) }}">
            {{ task.priority }}
          </span>
        </div>
      @endforeach
    </div>
  @else
    <div class="text-center py-12 bg-green-50 rounded-lg">
      <p class="text-green-700 text-lg">🎉 All tasks completed!</p>
    </div>
  @endif

  @if (completedTasks.length > 0)
    <div>
      <h2 class="text-xl font-semibold text-gray-700 mb-4">Completed</h2>
      @foreach (completedTasks as task)
        <div class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg mb-2 opacity-60">
          <input type="checkbox" checked class="w-5 h-5">
          <span class="line-through text-gray-600">{{ task.title }}</span>
        </div>
      @endforeach
    </div>
  @endif
</div>
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Issues**: Found a bug? [Open an issue](https://github.com/stacksjs/stx/issues)
2. **Suggest Features**: Have an idea? We'd love to hear it!
3. **Submit PRs**: Improvements are always welcome
4. **Share Examples**: Show us what you've built with stx

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for recent changes and version history.

## 🙏 Acknowledgments

This extension is built with love by the Stacks team and powered by:
- **[@stacksjs/headwind](https://github.com/stacksjs/headwind)** - Utility-first CSS engine
- **TypeScript** - Language support and type checking
- **VS Code Language Server** - IntelliSense and diagnostics

Special thanks to all our [contributors](https://github.com/stacksjs/stx/graphs/contributors)!

## 📄 License

MIT License - see [LICENSE.md](./LICENSE.md) for details.

---

<div align="center">

**[Website](https://stacksjs.org)** • **[Documentation](https://stacksjs.org/docs)** • **[Twitter](https://twitter.com/stacksjs)** • **[Discord](https://discord.gg/stacksjs)**

Made with ❤️ by the Stacks team

</div>
