# Templates

stx provides a powerful templating system with an intuitive syntax that makes building UIs both productive and enjoyable. This page covers all template features and capabilities available in the stx ecosystem.

## Template Syntax

### Text Interpolation

stx uses double curly braces for safe text interpolation:

```stx
<div>&#123;&#123; message &#125;&#125;</div>
<span>&#123;&#123; user.name &#125;&#125;</span>
<p>&#123;&#123; formatDate(post.createdAt) &#125;&#125;</p>
```

### Raw HTML Interpolation

For trusted HTML content, use triple braces:

```stx
<div>&#123;&#123;&#123; trustedHtmlContent &#125;&#125;&#125;</div>
```

### Attribute Binding

Bind dynamic values to attributes:

```stx
<img :src="imageUrl" :alt="imageAlt">
<button :disabled="isLoading" :class="buttonClass">
<input :value="inputValue" :placeholder="placeholderText">
```

## Conditional Rendering

### Basic Conditionals

```stx
@if(user.isAuthenticated)
  <dashboard />
@elseif(user.isGuest)
  <welcome-message />
@else
  <login-form />
@endif
```

### Short Conditionals

```stx
@auth
  <admin-panel />
@endauth

@guest
  <login-banner />
@endguest

@unless(user.hasPermission)
  <access-denied />
@endunless
```

### Conditional Classes

```stx
<div class="card" :class="{
  'card--active': isActive,
  'card--disabled': isDisabled,
  'card--large': size === 'large'
}">
  Content
</div>
```

## List Rendering

### Basic Loops

```stx
@foreach(items as item)
  <div class="item">
    <h3>&#123;&#123; item.title &#125;&#125;</h3>
    <p>&#123;&#123; item.description &#125;&#125;</p>
  </div>
@endforeach
```

### Loop with Index

```stx
@foreach(users as index => user)
  <tr class="&#123;&#123; index % 2 === 0 ? 'even' : 'odd' &#125;&#125;">
    <td>&#123;&#123; index + 1 &#125;&#125;</td>
    <td>&#123;&#123; user.name &#125;&#125;</td>
  </tr>
@endforeach
```

### Empty State

```stx
@forelse(posts as post)
  <article>
    <h2>&#123;&#123; post.title &#125;&#125;</h2>
    <p>&#123;&#123; post.excerpt &#125;&#125;</p>
  </article>
@empty
  <p>No posts found.</p>
@endforelse
```

### Nested Loops

```stx
@foreach(categories as category)
  <div class="category">
    <h2>&#123;&#123; category.name &#125;&#125;</h2>
    @foreach(category.products as product)
      <div class="product">
        <h3>&#123;&#123; product.name &#125;&#125;</h3>
        <p>$&#123;&#123; product.price &#125;&#125;</p>
      </div>
    @endforeach
  </div>
@endforeach
```

## Template Composition

### Layouts

```stx
<!-- layouts/app.stx -->
<!DOCTYPE html>
<html>
<head>
  <title>@yield('title', 'Default Title')</title>
  @stack('styles')
</head>
<body>
  <header>
    @include('partials.navigation')
  </header>

  <main>
    @yield('content')
  </main>

  <footer>
    @include('partials.footer')
  </footer>

  @stack('scripts')
</body>
</html>
```

### Template Inheritance

```stx
<!-- pages/home.stx -->
@extends('layouts.app')

@section('title', 'Welcome Home')

@push('styles')
  <link rel="stylesheet" href="/css/home.css">
@endpush

@section('content')
  <h1>Welcome to our website!</h1>
  <p>This is the home page content.</p>
@endsection

@push('scripts')
  <script src="/js/home.js"></script>
@endpush
```

### Partial Templates

```stx
<!-- partials/user-card.stx -->
<div class="user-card">
  <img :src="user.avatar" :alt="user.name">
  <h3>&#123;&#123; user.name &#125;&#125;</h3>
  <p>&#123;&#123; user.email &#125;&#125;</p>
</div>

<!-- Usage -->
@include('partials.user-card', { user: currentUser })
```

## Template Directives

### Form Handling

```stx
<form @submit.prevent="handleSubmit">
  <input @model="form.email" type="email" required>
  <input @model="form.password" type="password" required>
  <button type="submit" :disabled="isSubmitting">
    &#123;&#123; isSubmitting ? 'Logging in...' : 'Login' &#125;&#125;
  </button>
</form>
```

### Event Handling

```stx
<button @click="increment">Increment</button>
<input @input="handleInput" @blur="validateField">
<div @mouseenter="showTooltip" @mouseleave="hideTooltip">
  Hover me
</div>

<!-- Event modifiers -->
<form @submit.prevent="onSubmit">
<input @keyup.enter="search">
<button @click.once="initializeOnce">
```

### Dynamic Binding

```stx
<component :is="currentComponent" :props="componentProps" />

<input :[attributeName]="attributeValue">
<button @[eventName]="eventHandler">
```

## Template Optimization

### Template Compilation

stx compiles templates to optimized JavaScript:

```typescript
// Original template
const template = `
  @foreach(items as item)
    <div>&#123;&#123; item.name &#125;&#125;</div>
  @endforeach
`

// Compiled output (simplified)
function render(context) {
  let html = ''
  for (const item of context.items) {
    html += `<div>${escape(item.name)}</div>`
  }
  return html
}
```

### Template Caching

```typescript
// Template caching configuration
const templateConfig = {
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    invalidateOnChange: true
  },

  // Precompile templates
  precompile: [
    'layouts/**/*.stx',
    'components/**/*.stx',
    'pages/**/*.stx'
  ]
}
```

### Lazy Loading

```stx
<!-- Lazy load heavy components -->
<suspense>
  <template #default>
    <heavy-component @lazy />
  </template>
  <template #fallback>
    <loading-spinner />
  </template>
</suspense>
```

## Template Security

### Automatic Escaping

stx automatically escapes output to prevent XSS:

```stx
<!-- Safe: automatically escaped -->
<div>&#123;&#123; userInput &#125;&#125;</div>

<!-- Raw HTML: only for trusted content -->
<div>&#123;&#123;&#123; trustedContent &#125;&#125;&#125;</div>
```

### Content Security Policy

```typescript
// CSP-compliant templates
const cspConfig = {
  nonce: generateNonce(),
  inlineStyles: false,
  inlineScripts: false
}

// Templates automatically include nonce
<script nonce="{{ cspNonce }}">
  // Safe inline script
</script>
```

## Advanced Features

### Template Slots

```stx
<!-- components/modal.stx -->
<div class="modal">
  <header class="modal__header">
    <slot name="header">Default Header</slot>
  </header>

  <main class="modal__body">
    <slot>Default content</slot>
  </main>

  <footer class="modal__footer">
    <slot name="footer">
      <button @click="close">Close</button>
    </slot>
  </footer>
</div>

<!-- Usage -->
<modal>
  <template #header>
    <h2>Custom Header</h2>
  </template>

  <p>Modal content goes here</p>

  <template #footer>
    <button @click="save">Save</button>
    <button @click="cancel">Cancel</button>
  </template>
</modal>
```

### Scoped Slots

```stx
<!-- components/data-list.stx -->
<div class="data-list">
  @foreach(items as item, index)
    <slot :item="item" :index="index">
      <!-- Default item template -->
      <div class="item">&#123;&#123; item.name &#125;&#125;</div>
    </slot>
  @endforeach
</div>

<!-- Usage with custom template -->
<data-list :items="users">
  <template #default="{ item, index }">
    <div class="user-item">
      <span>&#123;&#123; index &#125;&#125;.</span>
      <strong>&#123;&#123; item.name &#125;&#125;</strong>
      <small>&#123;&#123; item.email &#125;&#125;</small>
    </div>
  </template>
</data-list>
```

### Template Macros

```stx
<!-- Define reusable template macros -->
@macro('button', { type = 'button', size = 'medium', variant = 'primary' })
  <button
    type="&#123;&#123; type &#125;&#125;"
    class="btn btn--&#123;&#123; variant &#125;&#125; btn--&#123;&#123; size &#125;&#125;"
    {{ $attributes }}
  >
    {{ $slot }}
  </button>
@endmacro

<!-- Usage -->
@button({ variant: 'secondary', size: 'large' })
  Click me
@endbutton
```

## Template Testing

### Template Unit Tests

```typescript
import { renderTemplate } from '@stx/testing'

test('user list template', () => {
  const template = `
    @foreach(users as user)
      <div class="user">&#123;&#123; user.name &#125;&#125;</div>
    @endforeach
  `

  const context = {
    users: [
      { name: 'John Doe' },
      { name: 'Jane Smith' }
    ]
  }

  const html = renderTemplate(template, context)

  expect(html).toContain('<div class="user">John Doe</div>')
  expect(html).toContain('<div class="user">Jane Smith</div>')
})
```

### Snapshot Testing

```typescript
test('component template snapshot', () => {
  const component = renderComponent('UserCard', {
    user: { name: 'John', email: 'john@example.com' }
  })

  expect(component.html()).toMatchSnapshot()
})
```

## Related Resources

- [Template Syntax Guide](/guide/templates) - Comprehensive template syntax guide
- [Component System](/features/components) - Building reusable components
- [Directives](/features/directives) - Custom template directives
- [Performance](/features/performance) - Template performance optimization
