# Directive Reference

Complete reference for all stx template directives. stx uses Laravel Blade-inspired syntax with `@directive` patterns.

## Table of Contents

- [Expressions](#expressions)
- [Layout & Inheritance](#layout--inheritance)
- [Conditionals](#conditionals)
- [Loops](#loops)
- [Includes & Components](#includes--components)
- [Authentication & Authorization](#authentication--authorization)
- [Forms & Validation](#forms--validation)
- [Internationalization](#internationalization-i18n)
- [SEO & Meta](#seo--meta)
- [Security](#security)
- [Accessibility](#accessibility)
- [Animations](#animations)
- [Code Execution](#code-execution)
- [Utility](#utility)
- [Comments & Escaping](#comments--escaping)

---

## Expressions

### Output with Escaping

```html
{{ variable }}
{{ user.name }}
{{ formatDate(date) }}
```

Output is automatically HTML-escaped to prevent XSS attacks.

### Raw Output (Unescaped)

```html
{!! rawHtml !!}
{!! markdown(content) !!}
```

**Warning**: Only use with trusted content. Does not escape HTML.

### Filters

```html
{{ name | uppercase }}
{{ price | currency }}
{{ text | truncate(100) }}
{{ items | join(', ') }}
```

**Available Filters**: `uppercase`, `lowercase`, `capitalize`, `escape`, `json`, `number`, `currency`, `date`, `truncate`, `join`, `first`, `last`, `length`, `reverse`, `slice`, `replace`, `stripTags`, `urlencode`, `abs`, `round`, `default`, `pluralize`

---

## Layout & Inheritance

### @extends

Extend a parent layout template.

```html
@extends('layouts/main')

@section('content')
  <h1>Page Content</h1>
@endsection
```

### @section / @endsection

Define a section that can be yielded in layouts.

```html
@section('sidebar')
  <nav>Sidebar content</nav>
@endsection
```

### @yield

Output a section in a layout.

```html
<main>
  @yield('content')
  @yield('sidebar', '<p>Default sidebar</p>')
</main>
```

### @parent

Include parent section content when overriding.

```html
@section('scripts')
  @parent
  <script src="page.js"></script>
@endsection
```

### @push / @prepend

Add content to a stack.

```html
@push('scripts')
  <script src="app.js"></script>
@endpush

@prepend('styles')
  <link rel="stylesheet" href="critical.css">
@endprepend
```

### @stack

Output all pushed content.

```html
<head>
  @stack('styles')
</head>
<body>
  @stack('scripts')
</body>
```

---

## Conditionals

### @if / @elseif / @else / @endif

```html
@if(user.isAdmin)
  <span>Admin</span>
@elseif(user.isModerator)
  <span>Moderator</span>
@else
  <span>User</span>
@endif
```

### @unless / @endunless

Inverse of `@if`.

```html
@unless(user.isGuest)
  <a href="/dashboard">Dashboard</a>
@endunless
```

### @switch / @case / @default / @endswitch

```html
@switch(status)
  @case('pending')
    <span class="badge yellow">Pending</span>
  @case('approved')
    <span class="badge green">Approved</span>
  @default
    <span class="badge gray">Unknown</span>
@endswitch
```

### @isset / @endisset

Check if variable exists and is not null.

```html
@isset(user.avatar)
  <img src="{{ user.avatar }}" alt="Avatar">
@endisset
```

### @empty / @endempty

Check if variable is empty.

```html
@empty(notifications)
  <p>No notifications</p>
@endempty
```

### @env / @endenv

Conditional by environment.

```html
@env('local')
  <div class="debug-panel">Debug Info</div>
@endenv
```

### @production / @development / @staging / @testing

Environment-specific shortcuts.

```html
@production
  <script src="analytics.js"></script>
@endproduction

@development
  <script src="debug.js"></script>
@enddevelopment
```

---

## Loops

### @foreach / @endforeach

```html
@foreach(users as user)
  <li>{{ user.name }}</li>
@endforeach
```

**Loop Variables** available inside `@foreach`:

| Variable | Description |
|----------|-------------|
| `loop.index` | Zero-based index |
| `loop.iteration` | One-based count |
| `loop.first` | Is first iteration |
| `loop.last` | Is last iteration |
| `loop.count` | Total items |
| `$loop` | Alias (avoids conflicts) |

```html
@foreach(items as item)
  <div class="{{ loop.first ? 'first' : '' }}">
    {{ loop.iteration }}. {{ item.name }}
  </div>
@endforeach
```

### @forelse / @empty / @endforelse

Loop with empty state fallback.

```html
@forelse(posts as post)
  <article>{{ post.title }}</article>
@empty
  <p>No posts found.</p>
@endforelse
```

### @for / @endfor

Traditional for loop.

```html
@for(let i = 0; i < 5; i++)
  <span>{{ i }}</span>
@endfor
```

### @while / @endwhile

```html
@while(items.length > 0)
  {{ items.pop() }}
@endwhile
```

### @break / @continue

Control loop flow.

```html
@foreach(users as user)
  @if(user.hidden)
    @continue
  @endif

  @if(count > 10)
    @break
  @endif

  <li>{{ user.name }}</li>
@endforeach
```

Conditional versions:

```html
@foreach(users as user)
  @continue(user.hidden)
  @break(loop.index > 10)
  <li>{{ user.name }}</li>
@endforeach
```

---

## Includes & Components

### @include

Include a partial template.

```html
@include('partials/header')
@include('partials/card', { title: 'Hello', content: 'World' })
```

### @includeIf

Include only if file exists.

```html
@includeIf('partials/optional-widget')
```

### @includeWhen / @includeUnless

Conditional includes.

```html
@includeWhen(user.isPremium, 'partials/premium-features')
@includeUnless(user.isGuest, 'partials/user-menu')
```

### @includeFirst

Include first existing template from array.

```html
@includeFirst(['custom/header', 'default/header'])
@includeFirst(['custom/widget', 'partials/widget'], {}, '<p>Fallback</p>')
```

### @component

Include a component with props.

```html
@component('components/alert', { type: 'warning', message: 'Be careful!' })
```

### Component Tags

PascalCase or kebab-case component syntax.

```html
<Alert type="error" message="Something went wrong" />
<user-card :user="currentUser" />
```

### @slot / @endslot

Define slot content for components.

```html
@component('components/modal')
  @slot('header')
    <h2>Modal Title</h2>
  @endslot

  <p>Modal body content</p>
@endcomponent
```

### @once / @endonce

Render content only once per request (deduplication).

```html
@once
  <link rel="stylesheet" href="component.css">
@endonce
```

---

## Authentication & Authorization

### @auth / @endauth

Show content to authenticated users.

```html
@auth
  <a href="/logout">Logout</a>
@endauth
```

**Required Context**:
```typescript
{ auth: { check: true, user: { ... } } }
```

### @guest / @endguest

Show content to unauthenticated users.

```html
@guest
  <a href="/login">Login</a>
@endguest
```

### @can / @endcan

Check permission/ability.

```html
@can('edit', post)
  <button>Edit Post</button>
@endcan
```

**Required Context**:
```typescript
{
  permissions: {
    check: (ability: string, type?: string, id?: any) => boolean
  }
}
```

### @cannot / @endcannot

Inverse permission check.

```html
@cannot('delete', post)
  <span>You cannot delete this post</span>
@endcannot
```

### @elsecan / @elsecannot

```html
@can('admin')
  <button>Admin Panel</button>
@elsecan('moderator')
  <button>Mod Tools</button>
@endcan
```

---

## Forms & Validation

### @csrf

Insert CSRF token.

```html
<form method="POST">
  @csrf
  <!-- Creates: <input type="hidden" name="_token" value="..."> -->
</form>
```

### @method

HTTP method spoofing.

```html
<form method="POST" action="/posts/1">
  @method('PUT')
  @csrf
</form>
```

### @form / @endform

Form wrapper with automatic CSRF.

```html
@form('POST', '/submit', { class: 'my-form' })
  <input name="email" type="email">
  <button type="submit">Submit</button>
@endform
```

### @input

Form input with validation state.

```html
@input('email', user.email, { type: 'email', placeholder: 'Email' })
```

### @textarea

```html
@textarea('bio', user.bio, { rows: 5 })
```

### @select

```html
@select('country', countries, user.country, { class: 'form-select' })
```

### @checkbox / @radio

```html
@checkbox('newsletter', true, { label: 'Subscribe' })
@radio('plan', 'premium', { label: 'Premium Plan' })
```

### @error / @enderror

Display validation errors.

```html
@error('email')
  <span class="error">{{ message }}</span>
@enderror
```

---

## Internationalization (i18n)

### @translate / @t

Translate text with optional parameters.

```html
@translate('welcome')
@t('greeting', { name: user.name })
```

With pluralization:

```html
@t('items_count', { count: items.length })
```

Translation file format:
```json
{
  "items_count": "One item|{count} items"
}
```

---

## SEO & Meta

### @meta

Generate meta tags.

```html
@meta('description', 'Page description here')
@meta('og:title', pageTitle)
```

### @seo

Comprehensive SEO generation.

```html
@seo({
  title: 'Page Title',
  description: 'Page description',
  keywords: ['keyword1', 'keyword2'],
  canonical: 'https://example.com/page',
  openGraph: {
    type: 'article',
    image: '/images/og.jpg'
  },
  twitter: {
    card: 'summary_large_image',
    site: '@username'
  }
})
```

### @structuredData

JSON-LD structured data.

```html
@structuredData({
  '@type': 'Article',
  headline: article.title,
  author: {
    '@type': 'Person',
    name: article.author
  }
})
```

---

## Security

### @csp

Insert Content Security Policy meta tag.

```html
<head>
  @csp
</head>
```

Requires CSP configuration in `stx.config.ts`:

```typescript
export default {
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'strict-dynamic'"]
    }
  }
}
```

### @cspNonce

Output nonce for inline scripts/styles.

```html
<script nonce="@cspNonce">
  console.log('Safe inline script');
</script>
```

Or with expression:

```html
<script nonce="{{ cspNonce }}">
  // ...
</script>
```

---

## Accessibility

### @a11y

Add accessibility hints as HTML comments.

```html
@a11y('landmark', 'This section needs a heading')
```

### @screenReader / @endscreenReader

Content visible only to screen readers.

```html
@screenReader
  <span>Opens in new window</span>
@endscreenReader
```

### @ariaDescribe

Connect elements with descriptions.

```html
@ariaDescribe('password-help', 'Password must be at least 8 characters')
<input type="password" aria-describedby="password-help">
```

---

## Animations

### @transition / @endtransition

Add transition effects.

```html
@transition('fade', 300)
  <div>Fading content</div>
@endtransition

@transition('slide', 500, 'ease-out')
  <div>Sliding content</div>
@endtransition
```

**Transition Types**: `fade`, `slide`, `scale`, `flip`, `rotate`

### @animationGroup / @endanimationGroup

Group animations together.

```html
@animationGroup('stagger')
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
@endanimationGroup
```

### @scroll / @endscroll

Scroll-triggered animations.

```html
@scroll
  <section class="animate-on-scroll">
    Content revealed on scroll
  </section>
@endscroll
```

---

## Code Execution

### @js / @endjs

Execute JavaScript server-side.

```html
@js
  const greeting = `Hello, ${name}!`;
@endjs

<p>{{ greeting }}</p>
```

### @ts / @endts

Execute TypeScript server-side.

```html
@ts
  interface User { name: string; age: number }
  const user: User = { name: 'John', age: 30 };
@endts
```

---

## Utility

### @json

Output data as JSON.

```html
<script>
  const config = @json(appConfig);
  const formatted = @json(data, true);
</script>
```

### @route

Generate named route URLs.

```html
<a href="@route('users.show', { id: user.id })">View Profile</a>
```

---

## Comments & Escaping

### Comments

```html
{{-- This comment will not appear in HTML output --}}
```

### Escape @ Symbol

```html
@@if  <!-- Outputs: @if -->
```

### Escape Expressions

```html
@{{ variable }}  <!-- Outputs: {{ variable }} -->
```

---

## Processing Order

Directives are processed in a specific order. Understanding this helps debug complex templates:

1. Comments removal
2. Escaped directives/expressions
3. Stack directives (`@push`, `@prepend`)
4. Layout resolution (`@extends`, `@section`, `@yield`)
5. Code execution (`@js`, `@ts`)
6. Custom directives
7. Components
8. Animations
9. Authentication/Authorization
10. Forms
11. Includes
12. Loops
13. Conditionals
14. i18n
15. Accessibility
16. SEO
17. Security (CSP)
18. Expressions (`{{ }}`)
19. Auto-injections (SEO tags, CSP meta)

---

## Custom Directives

Register custom directives in configuration:

```typescript
// stx.config.ts
export default {
  customDirectives: [
    {
      name: 'uppercase',
      handler: (content) => content.toUpperCase(),
      hasEndTag: true,
      description: 'Convert content to uppercase'
    },
    {
      name: 'datetime',
      handler: (_, params) => new Date(params[0]).toLocaleString(),
      hasEndTag: false
    }
  ]
}
```

Usage:

```html
@uppercase
  this will be uppercase
@enduppercase

@datetime('2024-01-15')
```

---

## See Also

- [Configuration Reference](/api/config)
- [Component System](/api/components)
- [Migration from Blade](/guide/migration-from-blade)
