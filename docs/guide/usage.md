# Basic Usage

This guide will help you get started with stx by walking through the basics of creating templates and components.

## Creating Your First Template

Create a new file `pages/hello.stx`:

```stx
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Hello stx</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
  @ts
    const greeting = 'Hello, World!'
    const items = ['stx', 'is', 'awesome']
    const isLoggedIn = true
  @endts

  <div class="container">
    <h1 class="text-2xl font-bold">{{ greeting }}</h1>

    @if(isLoggedIn)
      <p class="welcome-message">Welcome back!</p>
    @endif

    <ul class="list">
      @foreach(items as item)
        <li class="list-item">{{ item }}</li>
      @endforeach
    </ul>
  </div>
</body>
</html>
```

## Basic Syntax

### Variables and Expressions

Use double curly braces for variable interpolation:

```stx
<p>Hello, {{ name }}</p>

<span>Total: {{ price * quantity }}</span>

<div class="user-info">
  <h2>{{ user.name }}</h2>
  <span>{{ user.email }}</span>
</div>
```

Use the `@ts` directive for TypeScript code:

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

<div class="profile">
  <h1>Welcome, {{ user.name }}</h1>
  <p>{{ user.email }}</p>

  @if(user.isAdmin)
    <admin-badge>Admin User</admin-badge>
  @endif
</div>
```

### Conditionals

stx provides powerful conditional directives:

```stx
@if(user.isAdmin)
  <admin-panel class="bg-blue-100">
    <h2>Admin Dashboard</h2>
    <user-management />
  </admin-panel>
@else
  <user-dashboard class="bg-gray-100">
    <h2>User Dashboard</h2>
    <user-profile />
  </user-dashboard>
@endif

@unless(user.isBlocked)
  <div class="actions">
    <button @click="sendMessage">Send Message</button>
  </div>
@endunless

@switch(user.role)
  @case('admin')
    <admin-view />
    @break
  @case('moderator')
    <moderator-view />
    @break
  @default
    <user-view />
@endswitch
```

### Loops

stx offers various looping constructs:

```stx
<ul class="user-list">
  @foreach(users as user)
    <li class="user-item" :key="user.id">
      <user-card :user="user" />
    </li>
  @endforeach
</ul>

<div class="grid">
  @foreach(items as item, index)
    <div class="grid-item" :style="{ order: index }">
      {{ item.name }}
    </div>
  @endforeach
</div>

@forelse(notifications as notification)
  <notification-item :data="notification" />
@empty
  <empty-state>No notifications found</empty-state>
@endforelse
```

## Creating Components

Components help you create reusable UI elements. Create a new file `components/Button.stx`:

```stx
@ts
  interface ButtonProps {
    type?: 'primary' | 'secondary' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    onClick?: () => void
  }

  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white'
  }

  const sizes = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
@endts

@component('Button', {
  props: {
    type: 'primary',
    size: 'md',
    disabled: false,
    onClick: () => {}
  }
})
  <button
    class="button {{ variants[type] }} {{ sizes[size] }} rounded-md font-medium transition-colors"
    :disabled="disabled"
    @click="onClick"
  >
    <slot></slot>
  </button>

  <style>
    .button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      cursor: pointer;
    }

    .button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>
@endcomponent
```

### Using Components

Import and use components in your templates:

```stx
@import { Button } from '../components/Button'

<div class="actions">
  <Button
    type="primary"
    size="lg"
    @click="handleSubmit"
  >
    Submit Form
  </Button>

  <Button
    type="secondary"
    size="md"
    @click="handleCancel"
  >
    Cancel
  </Button>

  <Button
    type="danger"
    size="md"
    :disabled="isLoading"
  >
    {{ isLoading ? 'Loading...' : 'Delete' }}
  </Button>
</div>
```

## Layouts

Create reusable layouts with `@extends` and `@section`:

1. Create a layout (`layouts/main.stx`):

```stx
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>@yield('title') - My App</title>

  @section('head')
    <link rel="stylesheet" href="/css/main.css">
  @endsection
</head>
<body>
  <nav class="bg-white shadow">
    @include('partials/navigation')
  </nav>

  <main class="container mx-auto px-4 py-8">
    @section('content')
      <p>No content provided.</p>
    @endsection
  </main>

  <footer class="bg-gray-100">
    @include('partials/footer')
  </footer>

  @section('scripts')
    <script src="/js/app.js"></script>
  @endsection
</body>
</html>
```

2. Use the layout in a page:

```stx
@extends('layouts/main')

@section('title', 'Dashboard')

@section('head')
  @parent
  <link rel="stylesheet" href="/css/dashboard.css">
@endsection

@section('content')
  <div class="dashboard">
    <h1 class="text-3xl font-bold mb-8">Welcome to Dashboard</h1>

    <div class="grid grid-cols-3 gap-6">
      @foreach(widgets as widget)
        <dashboard-widget :data="widget" />
      @endforeach
    </div>
  </div>
@endsection
```

## TypeScript Integration

stx provides first-class TypeScript support:

```stx
@ts
  interface User {
    id: number
    name: string
    email: string
    role: 'admin' | 'user' | 'moderator'
    lastActive: Date
  }

  const users: User[] = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'admin',
      lastActive: new Date()
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'moderator',
      lastActive: new Date()
    }
  ]

  function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US').format(date)
  }
@endts

<div class="users-grid">
  @foreach(users as user)
    <div class="user-card" :key="user.id">
      <div class="card-header">
        <h3 class="text-xl font-semibold">{{ user.name }}</h3>
        <span class="badge badge-{{ user.role }}">
          {{ user.role }}
        </span>
      </div>

      <div class="card-body">
        <p class="text-gray-600">{{ user.email }}</p>
        <p class="text-sm text-gray-500">
          Last active: {{ formatDate(user.lastActive) }}
        </p>
      </div>

      @if(user.role === 'admin')
        <div class="card-footer">
          <admin-controls :user-id="user.id" />
        </div>
      @endif
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

- Learn about [Components](/guide/components) in depth
- Explore [Directives](/guide/directives) for template control
- Understand [TypeScript Integration](/guide/typescript)
- Check out the [VSCode Extension](/guide/tools/vscode) for better development experience
