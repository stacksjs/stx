# Templates

STX provides a powerful and flexible templating system that combines the elegance of Laravel Blade with modern TypeScript features. This guide covers everything you need to know about working with STX templates.

## Basic Template Structure

A basic STX template looks like this:

```stx
<!DOCTYPE html>
<html>
<head>
  <title>{{ title }}</title>
</head>
<body>
  @ts
  const greeting = 'Welcome to STX!'
  @endts

  <h1>{{ greeting }}</h1>
  <div>@slot</div>
</body>
</html>
```

## Template Syntax

### Variables and Expressions

Display variables using double curly braces:

```stx
<h1>{{ title }}</h1>
<p>{{ user.name }}</p>
```

For complex expressions:

```stx
<p>Total: {{ price * quantity }}</p>
<div>{{ isActive ? 'Active' : 'Inactive' }}</div>
```

### TypeScript Integration

Use the `@ts` directive to write TypeScript code:

```stx
@ts
interface User {
  name: string
  email: string
  isAdmin: boolean
}

const user: User = {
  name: 'John',
  email: 'john@example.com',
  isAdmin: true
}
@endts

<div>
  @if(user.isAdmin)
    <admin-panel />
  @endif
</div>
```

### Directives

STX provides several built-in directives for common tasks:

#### Conditionals

```stx
@if(user.isAdmin)
  <admin-panel />
@elseif(user.isManager)
  <manager-panel />
@else
  <user-panel />
@endif

@unless(user.isBlocked)
  <access-panel />
@endunless
```

#### Loops

```stx
@foreach(users as user)
  <user-card :user="user" />
@endforeach

@for(let i = 0; i < 5; i++)
  <div>Item {{ i + 1 }}</div>
@endfor

@while(condition)
  <div>Looped content</div>
@endwhile
```

### Template Inheritance

STX supports template inheritance through layouts:

1. Define a layout (`layouts/main.stx`):
```stx
<!DOCTYPE html>
<html>
<head>
  <title>@yield('title')</title>
  @section('meta')
  @endsection
</head>
<body>
  <nav>
    @include('partials/nav')
  </nav>

  <main>
    @section('content')
    @endsection
  </main>

  <footer>
    @include('partials/footer')
  </footer>
</body>
</html>
```

2. Extend the layout in your template:
```stx
@extends('layouts/main')

@section('title', 'My Page')

@section('meta')
  <meta name="description" content="Page description">
@endsection

@section('content')
  <h1>Welcome</h1>
  <p>Page content goes here</p>
@endsection
```

### Including Partials

Break your templates into reusable partials:

```stx
@include('partials/header')

<main>
  @include('partials/sidebar', { active: 'home' })
  @include('partials/content')
</main>

@include('partials/footer')
```

### Components

Use components for reusable UI elements:

```stx
@component('Card', { title: 'Welcome', theme: 'dark' })
  <h2>{{ title }}</h2>
  <slot></slot>
  
  @slot('footer')
    <button>Read More</button>
  @endslot
@endcomponent
```

### Error Handling

Handle errors gracefully in templates:

```stx
@try
  {{ potentiallyErroringFunction() }}
@catch(error)
  <error-display :message="error.message" />
@endtry
```

## Best Practices

1. **Keep Templates Focused**: Each template should have a single responsibility
2. **Use Components**: Break complex UIs into reusable components
3. **Leverage TypeScript**: Use TypeScript for type safety and better IDE support
4. **Consistent Naming**: Follow a consistent naming convention for templates and partials
5. **Comments**: Use comments to explain complex logic or important notes

```stx
{{-- This is a template comment --}}
@ts
// This is a TypeScript comment
@endts
```

## Performance Tips

1. Use `@once` for content that doesn't need to be re-rendered:
```stx
@once
  <heavy-component />
@endonce
```

2. Leverage caching when possible:
```stx
@cache('key')
  <expensive-component />
@endcache
```

3. Use lazy loading for heavy components:
```stx
@lazy
  <heavy-feature />
@endlazy
```

## Advanced Features

### Custom Directives

Create custom directives for specialized functionality:

```stx
@directive('uppercase')
  return value.toUpperCase()
@enddirective

<h1>@uppercase('hello')</h1> <!-- Outputs: HELLO -->
```

### State Management

Integrate with state management:

```stx
@ts
import { useStore } from '@/store'
const store = useStore()
@endts

<div>
  <h1>{{ store.user.name }}</h1>
  <button @click="store.logout()">Logout</button>
</div>
```

### Streaming Support

STX supports streaming for improved performance:

```stx
@stream
  <real-time-feed />
@endstream
```

## Debug Mode

Enable debug mode during development:

```stx
@debug
  {{ someVariable }}
@enddebug
```

This will output additional debugging information in the browser console. 