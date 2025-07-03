# Basic Usage

This guide will help you get started with STX by walking through the basics of creating templates and components.

## Creating Your First Template

Create a new file `pages/hello.stx`:

```stx
<!DOCTYPE html>
<html>
<head>
  <title>Hello STX</title>
</head>
<body>
  @ts
  const greeting = 'Hello, World!'
  const items = ['STX', 'is', 'awesome']
  @endts

  <h1>{{ greeting }}</h1>

  <ul>
    @foreach(items as item)
      <li>{{ item }}</li>
    @endforeach
  </ul>
</body>
</html>
```

## Basic Syntax

### Variables and Expressions

Use double curly braces to output variables:
```stx
<p>Hello, {{ name }}</p>
```

Use the `@ts` directive for TypeScript code:
```stx
@ts
const user = {
  name: 'John',
  isAdmin: true
}
@endts

<h1>Welcome, {{ user.name }}</h1>
```

### Conditionals

Use `@if`, `@else`, and `@endif` for conditional rendering:
```stx
@if(user.isAdmin)
  <admin-panel />
@else
  <user-dashboard />
@endif
```

### Loops

Use `@foreach` for iterating over arrays and objects:
```stx
<ul>
  @foreach(users as user)
    <li>{{ user.name }}</li>
  @endforeach
</ul>
```

## Creating Components

Components help you create reusable UI elements. Create a new file `components/Button.stx`:

```stx
@ts
interface ButtonProps {
  type?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
}
@endts

@component('Button', {
  props: {
    type: 'primary',
    size: 'md',
    onClick: () => {}
  }
})
  <button 
    class="btn btn-{{ type }} btn-{{ size }}"
    @click="onClick"
  >
    <slot></slot>
  </button>

  <style>
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      font-weight: 500;
    }
    .btn-primary {
      background: #3b82f6;
      color: white;
    }
    .btn-secondary {
      background: #6b7280;
      color: white;
    }
  </style>
@endcomponent
```

### Using Components

Import and use components in your templates:

```stx
@import { Button } from '../components/Button'

<div class="actions">
  <Button type="primary" size="lg" @click="handleClick">
    Click Me
  </Button>
</div>
```

## Layouts

Create reusable layouts with `@extends` and `@section`:

1. Create a layout (`layouts/main.stx`):
```stx
<!DOCTYPE html>
<html>
<head>
  <title>@yield('title')</title>
  @section('head')
  @endsection
</head>
<body>
  <nav>
    @include('partials/navigation')
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

2. Use the layout in a page:
```stx
@extends('layouts/main')

@section('title', 'My Page')

@section('content')
  <h1>Welcome to My Page</h1>
  <p>This is the main content.</p>
@endsection
```

## TypeScript Integration

STX provides first-class TypeScript support:

```stx
@ts
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

const users: User[] = [
  { id: 1, name: 'John', email: 'john@example.com', role: 'admin' },
  { id: 2, name: 'Jane', email: 'jane@example.com', role: 'user' }
]
@endts

<div class="users">
  @foreach(users as user)
    <div class="user-card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <span class="badge badge-{{ user.role }}">
        {{ user.role }}
      </span>
    </div>
  @endforeach
</div>
```

## Development Workflow

1. Start the development server:
```bash
bun run dev
```

2. Build for production:
```bash
bun run build
```

3. Preview production build:
```bash
bun run preview
```

## Next Steps

- Learn about [Components](/features/components) in depth
- Explore [Directives](/features/directives) for template control
- Understand [TypeScript Integration](/features/typescript)
- Check out the [VSCode Extension](/tools/vscode) for better development experience
