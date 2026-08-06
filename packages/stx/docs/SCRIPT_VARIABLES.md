# Script Variables in STX

STX provides flexible variable declaration in `<script server>` tags with **optional export syntax**.

> **The `server` attribute is required for everything on this page.** Only
> `<script server>` runs on the server; a bare `<script>` (and `<script client>`)
> runs in the browser, so its `const` is not in scope for `{{ }}`, `@foreach`,
> `@if` or any other server directive.
>
> This page used to show a bare `<script>` throughout, which is why a documented
> `@foreach` over a variable declared that way rendered nothing
> ([#1842](https://github.com/stacksjs/stx/issues/1842)). Every example below now
> spells it `<script server>`.

## Quick Start

You can declare variables in `<script server>` tags without using the `export` keyword:

```html
<script server>
const title = 'My Page'
const count = 42
</script>

<h1>{{ title }}</h1>
<p>Count: {{ count }}</p>
```

## Export Keyword is Optional

Both of these syntaxes work identically:

### Without Export (Recommended)

```html
<script server>
const title = 'Hello World'
const description = 'A simple example'

function greet(name) {
  return `Welcome, ${name}!`
}
</script>

<h1>{{ title }}</h1>
<p>{{ description }}</p>
<p>{{ greet('Alice') }}</p>
```

### With Export (Also Valid)

```html
<script server>
export const title = 'Hello World'
export const description = 'A simple example'

export function greet(name) {
  return `Welcome, ${name}!`
}
</script>

<h1>{{ title }}</h1>
<p>{{ description }}</p>
<p>{{ greet('Alice') }}</p>
```

## Supported Declaration Types

All JavaScript variable and function declarations are automatically available:

### Variables

```html
<script server>
const myConst = 'constant'
let myLet = 'variable'
var myVar = 'legacy variable'
</script>

<p>{{ myConst }}</p>
<p>{{ myLet }}</p>
<p>{{ myVar }}</p>
```

### Functions

```html
<script server>
// Regular function
function add(a, b) {
  return a + b
}

// Arrow function
const multiply = (a, b) => a * b

// Named arrow function
const divide = function(a, b) {
  return a / b
}
</script>

<p>5 + 3 = {{ add(5, 3) }}</p>
<p>5 × 3 = {{ multiply(5, 3) }}</p>
<p>6 ÷ 2 = {{ divide(6, 2) }}</p>
```

### Objects and Arrays

```html
<script server>
const user = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
}

const items = [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' },
  { id: 3, name: 'Item 3' }
]
</script>

<h2>{{ user.name }}</h2>
<p>Age: {{ user.age }}</p>

@foreach(item in items)
  <div>{{ item.name }}</div>
@endforeach
```

## Mixing Export and Non-Export

You can mix both styles in the same `<script server>` tag:

```html
<script server>
// Without export
const title = 'My App'
const version = '1.0.0'

// With export
export const author = 'John Doe'
export const year = 2025

// Functions work either way
function formatDate(date) {
  return date.toLocaleDateString()
}

export function formatTime(date) {
  return date.toLocaleTimeString()
}
</script>

<h1>{{ title }} v{{ version }}</h1>
<p>By {{ author }}, {{ year }}</p>
<p>Date: {{ formatDate(new Date()) }}</p>
<p>Time: {{ formatTime(new Date()) }}</p>
```

## Complex Examples

### Multi-line Objects

```html
<script server>
const config = {
  api: {
    baseUrl: 'https://api.example.com',
    timeout: 5000,
    headers: {
      'Content-Type': 'application/json'
    }
  },
  features: {
    darkMode: true,
    notifications: false
  }
}
</script>

<p>API: {{ config.api.baseUrl }}</p>
<p>Dark Mode: {{ config.features.darkMode }}</p>
```

### Computed Values

```html
<script server>
const items = [1, 2, 3, 4, 5]
const total = items.reduce((sum, n) => sum + n, 0)
const average = total / items.length

function formatNumber(num) {
  return num.toFixed(2)
}
</script>

<p>Total: {{ total }}</p>
<p>Average: {{ formatNumber(average) }}</p>
```

### Complex Logic

```html
<script server>
const products = [
  { id: 1, name: 'Laptop', price: 999, inStock: true },
  { id: 2, name: 'Mouse', price: 29, inStock: true },
  { id: 3, name: 'Keyboard', price: 79, inStock: false }
]

function getAvailableProducts() {
  return products.filter(p => p.inStock)
}

function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

const availableProducts = getAvailableProducts()
const totalValue = calculateTotal(availableProducts)
</script>

<h2>Available Products</h2>
@foreach(product in availableProducts)
  <div>
    <h3>{{ product.name }}</h3>
    <p>${{ product.price }}</p>
  </div>
@endforeach

<p>Total Value: ${{ totalValue }}</p>
```

## How It Works

Under the hood, STX automatically converts all variable and function declarations to CommonJS exports:

```javascript
// Your code:
const title = 'Hello'

// Internally converted to:
const title = 'Hello';
module.exports.title = title;
```

This happens transparently, so you don't need to worry about it. Just declare your variables naturally, and they'll be available in your template.

## Best Practices

### 1. Prefer `const` over `let`

Use `const` for values that don't change:

```html
<script server>
const siteTitle = 'My Website'  // ✅ Good
let siteTitle = 'My Website'    // ⚠️ Works but unnecessary
</script>
```

### 2. Use Descriptive Names

```html
<script server>
const userFullName = 'John Doe'           // ✅ Clear
const n = 'John Doe'                      // ❌ Unclear
</script>
```

### 3. Group Related Variables

```html
<script server>
// User data
const userName = 'John Doe'
const userEmail = 'john@example.com'
const userAge = 30

// Or better, use an object:
const user = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
}
</script>
```

### 4. Extract Complex Logic to Functions

```html
<script server>
const items = [1, 2, 3, 4, 5]

// ✅ Good - reusable and testable
function sum(numbers) {
  return numbers.reduce((total, n) => total + n, 0)
}

const total = sum(items)
</script>
```

## Compatibility

This feature works with:
- ✅ All variable declarations (`const`, `let`, `var`)
- ✅ All function declarations (regular, arrow, named)
- ✅ Complex objects and arrays
- ✅ Multi-line declarations
- ✅ Mixed export/non-export syntax
- ✅ Destructuring assignments
- ✅ Template literals
- ✅ Computed properties

## Legacy Support

If you prefer the explicit `module.exports` syntax, that still works:

```html
<script server>
const title = 'Hello'
const count = 42

module.exports = {
  title,
  count
}
</script>
```

However, this is no longer necessary since all declarations are automatically exported.
