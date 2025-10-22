# stx VSCode Extension - Features Guide

Welcome to the stx extension for Visual Studio Code! This guide walks you through all the powerful features that make working with stx templates a breeze.

## 🎨 Syntax Highlighting

The extension provides beautiful syntax highlighting that understands the context of your code.

### What Gets Highlighted

- **Directives**: All `@if`, `@foreach`, `@component` directives are highlighted
- **TypeScript Blocks**: Code between `@ts` and `@endts` gets full TypeScript syntax highlighting
- **JavaScript Blocks**: Code between `@js` and `@endjs` is highlighted as JavaScript
- **Expressions**: Variables and expressions inside `{{ }}` are highlighted as TypeScript
- **HTML**: Regular HTML markup is highlighted with all its attributes
- **CSS**: Styles inside `<style>` tags or `@css` blocks get CSS highlighting

### Example

```stx
@ts
  const user = {
    name: 'Sarah',
    role: 'admin'
  }
@endts

@if (user.role === 'admin')
  <div class="admin-panel">
    <h1>Welcome back, {{ user.name }}!</h1>
  </div>
@endif
```

## 💡 Intelligent Hover Information

Hover over any element to see helpful information right in your editor.

### Directive Documentation

Hover over any directive to see:
- **What it does**: Clear description of the directive's purpose
- **Syntax**: How to use it with parameters
- **Examples**: Real-world usage examples

**Try hovering over:**
```stx
@foreach (items as item, index)
  <div>Item {{ index }}: {{ item.name }}</div>
@endforeach
```

You'll see documentation explaining that `@foreach` iterates over arrays, the syntax for using it, and practical examples.

### Variable Type Information

Hover over variables to see their types and values:

```stx
@ts
  const products = [
    { id: 1, name: 'Laptop', price: 999 },
    { id: 2, name: 'Mouse', price: 29 }
  ]
@endts

<!-- Hover over 'product' to see its type -->
@foreach (products as product)
  <div>{{ product.name }}: ${{ product.price }}</div>
@endforeach
```

### Function Signatures

Hover over functions to see their parameters and return types:

```stx
@ts
  function calculateTotal(items: Array<{price: number}>): number {
    return items.reduce((sum, item) => sum + item.price, 0)
  }
@endts

<!-- Hover over 'calculateTotal' to see its signature -->
<p>Total: ${{ calculateTotal(products) }}</p>
```

## 🎯 Smart Code Completion

The extension offers intelligent autocomplete to speed up your workflow.

### Directive Completion

Start typing `@` and you'll see all available directives:

```stx
@if    → @if (condition)
@for   → @foreach (items as item)
@ts    → @ts ... @endts
@comp  → @component('name')
```

### Property Completion

When working with objects, get completions for their properties:

```stx
@ts
  interface User {
    name: string
    email: string
    isAdmin: boolean
  }

  const currentUser: User = {
    name: 'Alex',
    email: 'alex@example.com',
    isAdmin: true
  }
@endts

<!-- Type 'currentUser.' to see: name, email, isAdmin -->
<p>{{ currentUser. }}</p>
```

### Path Completion

Get file path suggestions for `@include` and `@component`:

```stx
@include('layouts/   ← shows available files in layouts/
@component('buttons/ ← shows available components in buttons/
```

## 🎨 Utility Class Features (Headwind Integration)

The extension includes powerful utility class support for frameworks like Tailwind CSS.

### Hover Preview for Utility Classes

Hover over any utility class to see the actual CSS it generates:

```stx
<div class="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg shadow-md">
  <!-- Hover over 'flex' to see: display: flex; -->
  <!-- Hover over 'bg-blue-500' to see the background color -->
  <h2 class="text-2xl font-bold">Dashboard</h2>
</div>
```

### Color Previews

Utility classes with colors show an inline color preview:

```stx
<!-- You'll see actual color squares next to these classes -->
<button class="bg-emerald-600 hover:bg-emerald-700 text-white">
  Save Changes
</button>

<div class="border-red-500 text-red-700 bg-red-50">
  Error message
</div>
```

### Class Sorting

Keep your utility classes organized with the sort command:

**Before:**
```stx
<div class="text-white p-4 bg-blue-500 flex rounded-lg items-center">
```

**After sorting** (`Cmd+Shift+P` → "Stacks: Sort Utility Classes"):
```stx
<div class="flex items-center rounded-lg bg-blue-500 p-4 text-white">
```

Classes are automatically sorted by category: layout → spacing → colors → effects

### Autocomplete for Utility Classes

Start typing a class name and get suggestions with previews:

```stx
<div class="bg-   ← shows all background colors with previews
<div class="text- ← shows text sizes and colors
<div class="flex- ← shows flex utilities
```

## 🔍 Diagnostics & Error Detection

The extension helps you catch errors before they become problems.

### Missing Directives

Get warnings for unclosed or mismatched directives:

```stx
@if (condition)
  <div>Content</div>
<!-- ⚠️ Warning: Missing @endif -->

@foreach (items as item)
  <div>{{ item }}</div>
@endfor
<!-- ❌ Error: @foreach must be closed with @endforeach -->
```

### Template Path Validation

Invalid paths in `@include` or `@component` are highlighted:

```stx
@include('layouts/header')    ✓ Valid path
@include('layouts/missing')   ❌ File not found
```

### Type Checking in Expressions

TypeScript errors in your expressions are caught:

```stx
@ts
  const user = { name: 'John', age: 30 }
@endts

{{ user.email }}  ❌ Property 'email' does not exist on type
{{ user.name }}   ✓ Valid
```

## 📁 Code Actions & Quick Fixes

Get helpful suggestions to fix common issues.

### Auto-close Directives

When you type an opening directive, the extension can suggest adding the closing tag:

```stx
@if (user.isLoggedIn)
  <p>Welcome!</p>
💡 Quick fix: Add @endif
```

### Extract to Component

Select HTML and extract it to a reusable component:

```stx
<!-- Select this block -->
<div class="card">
  <h3>{{ title }}</h3>
  <p>{{ description }}</p>
</div>

💡 Quick fix: Extract to @component
```

## 🎯 Code Folding

Collapse and expand sections of your template for better readability.

### Foldable Blocks

- Directive blocks: `@if...@endif`, `@foreach...@endforeach`
- Code blocks: `@ts...@endts`, `@css...@endcss`
- Components: `@component...@endcomponent`
- HTML tags: `<div>...</div>`

**Example:**
```stx
@ts ⊟
  const items = [1, 2, 3]
@endts

@foreach (items as item) ⊟
  <div>...</div>
@endforeach
```

## 🎨 Semantic Highlighting

Enhanced syntax coloring that understands the meaning of your code.

### What Gets Semantic Colors

- **Parameters**: Function and directive parameters
- **Variables**: Local and global variables
- **Properties**: Object properties
- **Functions**: Function calls and declarations
- **Types**: TypeScript type annotations

```stx
@ts
  interface Product {        ← Type
    name: string            ← Property
    price: number           ← Property
  }

  function formatPrice(value: number): string {  ← Function, Parameter, Type
    return `$${value.toFixed(2)}`
  }
@endts
```

## 🌈 Configuration Options

Customize the extension to match your workflow.

### Available Settings

```json
{
  // Enable/disable hover information
  "stx.hover.enable": true,
  "stx.hover.showExamples": true,

  // Enable/disable diagnostics
  "stx.diagnostics.enable": true,
  "stx.diagnostics.validateUnclosedDirectives": true,

  // Utility class features
  "stx.utilityClasses.enable": true,
  "stx.utilityClasses.colorPreview": true,
  "stx.utilityClasses.hoverPreview": true,
  "stx.utilityClasses.sortOnSave": false,

  // Headwind configuration
  "headwind.remToPxRatio": 16
}
```

## 🚀 Real-World Examples

### Building a User Card Component

```stx
@ts
  interface User {
    name: string
    email: string
    avatar: string
    role: 'admin' | 'user' | 'guest'
  }

  const user: User = {
    name: 'Emma Wilson',
    email: 'emma@example.com',
    avatar: '/avatars/emma.jpg',
    role: 'admin'
  }

  function getRoleBadgeColor(role: string): string {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
      guest: 'bg-gray-100 text-gray-800'
    }
    return colors[role] || colors.guest
  }
@endts

<div class="max-w-sm rounded-lg overflow-hidden shadow-lg bg-white">
  <img class="w-full h-48 object-cover" src="{{ user.avatar }}" alt="{{ user.name }}">

  <div class="px-6 py-4">
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-xl font-bold text-gray-900">{{ user.name }}</h2>
      <span class="px-2 py-1 text-xs font-semibold rounded-full {{ getRoleBadgeColor(user.role) }}">
        {{ user.role }}
      </span>
    </div>

    <p class="text-gray-600 text-sm">{{ user.email }}</p>
  </div>
</div>
```

### Creating a Dynamic List with Filtering

```stx
@ts
  interface Product {
    id: number
    name: string
    price: number
    category: string
    inStock: boolean
  }

  const products: Product[] = [
    { id: 1, name: 'Laptop', price: 999, category: 'Electronics', inStock: true },
    { id: 2, name: 'Mouse', price: 29, category: 'Electronics', inStock: true },
    { id: 3, name: 'Desk', price: 299, category: 'Furniture', inStock: false },
    { id: 4, name: 'Chair', price: 199, category: 'Furniture', inStock: true }
  ]

  const selectedCategory = 'Electronics'
  const filteredProducts = products.filter(p =>
    !selectedCategory || p.category === selectedCategory
  )
@endts

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6 text-gray-900">Products</h1>

  @if (filteredProducts.length === 0)
    <div class="text-center py-12">
      <p class="text-gray-500 text-lg">No products found</p>
    </div>
  @else
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      @foreach (filteredProducts as product)
        <div class="border rounded-lg p-4 hover:shadow-lg transition-shadow">
          <div class="flex items-center justify-between mb-2">
            <h3 class="text-lg font-semibold">{{ product.name }}</h3>
            @if (product.inStock)
              <span class="text-xs text-green-600 font-medium">In Stock</span>
            @else
              <span class="text-xs text-red-600 font-medium">Out of Stock</span>
            @endif
          </div>

          <p class="text-sm text-gray-600 mb-4">{{ product.category }}</p>

          <div class="flex items-center justify-between">
            <span class="text-2xl font-bold text-blue-600">${{ product.price }}</span>
            <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    @if (!product.inStock) disabled @endif>
              Add to Cart
            </button>
          </div>
        </div>
      @endforeach
    </div>
  @endif
</div>
```

## 🎓 Tips & Tricks

### 1. Quick Directive Insertion

Type `@` and press `Tab` to quickly insert directive pairs:
- `@if` + Tab → Full if-endif block with cursor inside condition
- `@for` + Tab → Complete foreach block with placeholder

### 2. Organize Utility Classes

Use the sort command regularly to keep classes readable:
- Shortcut: `Cmd+Shift+P` → "Sort Utility Classes"
- Or enable `"stx.utilityClasses.sortOnSave": true` to sort automatically

### 3. Navigate with Breadcrumbs

Use VS Code's breadcrumb navigation to jump between sections in large templates.

### 4. Use Multi-Cursor Editing

Select a variable name and press `Cmd+D` to select the next occurrence for simultaneous editing.

### 5. Preview Colors

Hover over color utilities to see the actual color before applying it:
```stx
<div class="bg-indigo-600">  ← Hover to see #4F46E5
```

## 🐛 Troubleshooting

### Hover Not Working?

1. Reload VS Code window: `Cmd+Shift+P` → "Developer: Reload Window"
2. Check that `stx.hover.enable` is `true` in settings
3. Make sure you're hovering in a `.stx` file

### Colors Not Showing?

1. Ensure `stx.utilityClasses.colorPreview` is enabled
2. Check that you have `@stacksjs/headwind` dependency installed
3. Reload window to reinitialize the extension

### Syntax Highlighting Issues?

1. Right-click in editor → "Change Language Mode" → Select "stx"
2. Check the bottom-right corner shows "stx" as the language
3. If using custom file extensions, configure file associations in settings

## 📚 Learn More

- [Quick Start Guide](./QUICK-START.md) - Get started in minutes
- [Usage Guide](./USAGE.md) - Tips and best practices
- [Examples Repository](../examples/) - Real-world stx templates
- [GitHub Repository](https://github.com/stacksjs/stx) - Source code and issues

---

**Made with ❤️ by the Stacks team**

Need help? [Open an issue](https://github.com/stacksjs/stx/issues) or check our [documentation](https://stacksjs.org/docs).
