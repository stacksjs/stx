# Migrating from Laravel Blade to stx

This guide helps Laravel developers transition from Blade templates to stx. stx uses Blade-inspired syntax, making migration straightforward while providing additional features.

## Quick Comparison

| Feature | Laravel Blade | stx |
|---------|---------------|-----|
| File extension | `.blade.php` | `.stx` |
| Runtime | PHP | Bun/JavaScript |
| Expressions | `{{ $var }}` | `{{ var }}` |
| Raw output | `{!! $var !!}` | `{!! var !!}` |
| Comments | `{{-- --}}` | `{{-- --}}` |
| Directives | `@directive` | `@directive` |

## Variable Syntax

### Blade (PHP)
```php
{{ $user->name }}
{{ $items[0] }}
{{ $user['email'] }}
```

### stx (JavaScript)
```html
{{ user.name }}
{{ items[0] }}
{{ user.email }}
```

**Key Differences:**
- No `$` prefix for variables
- Use `.` notation instead of `->` for object properties
- Both bracket and dot notation work for objects

## Expressions & Filters

### Blade
```php
{{ strtoupper($name) }}
{{ number_format($price, 2) }}
{{ $date->format('Y-m-d') }}
```

### stx
```html
{{ name | uppercase }}
{{ price | currency }}
{{ date | date('YYYY-MM-DD') }}
```

stx provides built-in filters. You can also use JavaScript functions:

```html
{{ name.toUpperCase() }}
{{ new Date(timestamp).toLocaleDateString() }}
```

## Conditionals

### @if / @elseif / @else

**Blade:**
```php
@if($user->isAdmin())
    <span>Admin</span>
@elseif($user->isModerator())
    <span>Moderator</span>
@else
    <span>User</span>
@endif
```

**stx:**
```html
@if(user.isAdmin())
  <span>Admin</span>
@elseif(user.isModerator())
  <span>Moderator</span>
@else
  <span>User</span>
@endif
```

### @unless

**Blade:**
```php
@unless($user->isGuest())
    <a href="/dashboard">Dashboard</a>
@endunless
```

**stx:**
```html
@unless(user.isGuest())
  <a href="/dashboard">Dashboard</a>
@endunless
```

### @isset / @empty

**Blade:**
```php
@isset($avatar)
    <img src="{{ $avatar }}">
@endisset

@empty($posts)
    <p>No posts</p>
@endempty
```

**stx:**
```html
@isset(avatar)
  <img src="{{ avatar }}">
@endisset

@empty(posts)
  <p>No posts</p>
@endempty
```

### @switch

**Blade:**
```php
@switch($status)
    @case('pending')
        <span>Pending</span>
        @break
    @case('approved')
        <span>Approved</span>
        @break
    @default
        <span>Unknown</span>
@endswitch
```

**stx:**
```html
@switch(status)
  @case('pending')
    <span>Pending</span>
  @case('approved')
    <span>Approved</span>
  @default
    <span>Unknown</span>
@endswitch
```

**Note:** stx doesn't require `@break` after each case - it falls through automatically.

## Loops

### @foreach

**Blade:**
```php
@foreach($users as $user)
    <li>{{ $user->name }}</li>
@endforeach
```

**stx:**
```html
@foreach(users as user)
  <li>{{ user.name }}</li>
@endforeach
```

### @foreach with $loop

**Blade:**
```php
@foreach($items as $item)
    @if($loop->first)
        <li class="first">{{ $item }}</li>
    @elseif($loop->last)
        <li class="last">{{ $item }}</li>
    @else
        <li>{{ $item }}</li>
    @endif
@endforeach
```

**stx:**
```html
@foreach(items as item)
  @if(loop.first)
    <li class="first">{{ item }}</li>
  @elseif(loop.last)
    <li class="last">{{ item }}</li>
  @else
    <li>{{ item }}</li>
  @endif
@endforeach
```

**Loop Variable Mapping:**

| Blade | stx |
|-------|-----|
| `$loop->index` | `loop.index` |
| `$loop->iteration` | `loop.iteration` |
| `$loop->first` | `loop.first` |
| `$loop->last` | `loop.last` |
| `$loop->count` | `loop.count` |
| `$loop->remaining` | `loop.count - loop.iteration` |
| `$loop->depth` | Not available (no nested tracking) |
| `$loop->parent` | Not available |

### @forelse

**Blade:**
```php
@forelse($posts as $post)
    <article>{{ $post->title }}</article>
@empty
    <p>No posts found.</p>
@endforelse
```

**stx:**
```html
@forelse(posts as post)
  <article>{{ post.title }}</article>
@empty
  <p>No posts found.</p>
@endforelse
```

### @for / @while

**Blade:**
```php
@for($i = 0; $i < 10; $i++)
    {{ $i }}
@endfor

@while($condition)
    Processing...
@endwhile
```

**stx:**
```html
@for(let i = 0; i < 10; i++)
  {{ i }}
@endfor

@while(condition)
  Processing...
@endwhile
```

### @break / @continue

Works identically in both:

```html
@foreach(users as user)
  @if(user.hidden)
    @continue
  @endif

  @if(loop.index > 10)
    @break
  @endif

  <li>{{ user.name }}</li>
@endforeach
```

stx also supports conditional versions:

```html
@continue(user.hidden)
@break(loop.index > 10)
```

## Layouts & Inheritance

### @extends / @section / @yield

**Blade:**
```php
{{-- layouts/app.blade.php --}}
<html>
<head>
    @yield('styles')
</head>
<body>
    @yield('content')
    @yield('scripts')
</body>
</html>

{{-- pages/home.blade.php --}}
@extends('layouts.app')

@section('content')
    <h1>Home Page</h1>
@endsection
```

**stx:**
```html
<!-- layouts/app.stx -->
<html>
<head>
  @yield('styles')
</head>
<body>
  @yield('content')
  @yield('scripts')
</body>
</html>

<!-- pages/home.stx -->
@extends('layouts/app')

@section('content')
  <h1>Home Page</h1>
@endsection
```

**Key Differences:**
- Use `/` instead of `.` for paths
- No `.blade.php` extension needed - just reference the name

### @parent

Works identically:

```html
@section('scripts')
  @parent
  <script src="page-specific.js"></script>
@endsection
```

### @push / @stack

**Blade:**
```php
@push('scripts')
    <script src="app.js"></script>
@endpush

@stack('scripts')
```

**stx:**
```html
@push('scripts')
  <script src="app.js"></script>
@endpush

@stack('scripts')
```

## Includes

### @include

**Blade:**
```php
@include('partials.header')
@include('partials.card', ['title' => 'Hello'])
```

**stx:**
```html
@include('partials/header')
@include('partials/card', { title: 'Hello' })
```

**Key Differences:**
- Use `/` for paths
- Use JavaScript object syntax `{ key: value }` instead of PHP arrays `['key' => 'value']`

### @includeIf / @includeWhen / @includeUnless

**Blade:**
```php
@includeIf('partials.optional')
@includeWhen($user->isPremium, 'partials.premium')
@includeUnless($user->isGuest, 'partials.user-menu')
```

**stx:**
```html
@includeIf('partials/optional')
@includeWhen(user.isPremium, 'partials/premium')
@includeUnless(user.isGuest, 'partials/user-menu')
```

### @includeFirst

**Blade:**
```php
@includeFirst(['custom.header', 'default.header'])
```

**stx:**
```html
@includeFirst(['custom/header', 'default/header'])
```

### @each

**Blade:**
```php
@each('partials.item', $items, 'item', 'partials.empty')
```

**stx:** Use `@foreach` with `@forelse`:

```html
@forelse(items as item)
  @include('partials/item', { item })
@empty
  @include('partials/empty')
@endforelse
```

## Components

### Blade Components

**Blade:**
```php
{{-- components/alert.blade.php --}}
<div class="alert alert-{{ $type }}">
    {{ $slot }}
</div>

{{-- Usage --}}
<x-alert type="warning">
    Be careful!
</x-alert>
```

**stx:**
```html
<!-- components/alert.stx -->
<div class="alert alert-{{ type }}">
  {{ slot }}
</div>

<!-- Usage (PascalCase) -->
<Alert type="warning">
  Be careful!
</Alert>

<!-- Or kebab-case -->
<alert type="warning">
  Be careful!
</alert>

<!-- Or @component -->
@component('components/alert', { type: 'warning' })
  Be careful!
@endcomponent
```

### Component Slots

**Blade:**
```php
<x-card>
    <x-slot:header>
        Card Title
    </x-slot>

    Card content here
</x-card>
```

**stx:**
```html
@component('components/card')
  @slot('header')
    Card Title
  @endslot

  Card content here
@endcomponent
```

**Note:** stx currently supports default slot. Named slots work via `@slot`.

## Authentication

### @auth / @guest

**Blade:**
```php
@auth
    <a href="/logout">Logout</a>
@endauth

@guest
    <a href="/login">Login</a>
@endguest
```

**stx:**
```html
@auth
  <a href="/logout">Logout</a>
@endauth

@guest
  <a href="/login">Login</a>
@endguest
```

**Required Context:**
```typescript
{
  auth: {
    check: true,  // or false for guests
    user: { id: 1, name: 'John' }
  }
}
```

### @can / @cannot

**Blade:**
```php
@can('edit', $post)
    <button>Edit</button>
@endcan

@cannot('delete', $post)
    <span>Cannot delete</span>
@endcannot
```

**stx:**
```html
@can('edit', 'post', post.id)
  <button>Edit</button>
@endcan

@cannot('delete', 'post', post.id)
  <span>Cannot delete</span>
@endcannot
```

**Required Context:**
```typescript
{
  permissions: {
    check: (ability, type, id) => boolean
  }
}
```

## Forms

### @csrf / @method

Works identically:

```html
<form method="POST" action="/posts">
  @csrf
  @method('PUT')
  <!-- form fields -->
</form>
```

### @error

**Blade:**
```php
@error('email')
    <span class="error">{{ $message }}</span>
@enderror
```

**stx:**
```html
@error('email')
  <span class="error">{{ message }}</span>
@enderror
```

**Required Context:**
```typescript
{
  errors: {
    email: 'The email field is required.'
  }
}
```

## Environment

### @env / @production

**Blade:**
```php
@env('local')
    <div>Debug panel</div>
@endenv

@production
    <script src="analytics.js"></script>
@endproduction
```

**stx:**
```html
@env('local')
  <div>Debug panel</div>
@endenv

@production
  <script src="analytics.js"></script>
@endproduction
```

**Required Context:**
```typescript
{
  env: 'production'  // or 'local', 'staging', 'testing'
}
```

## Raw PHP vs JavaScript

### Blade @php

**Blade:**
```php
@php
    $total = array_sum($prices);
    $formatted = number_format($total, 2);
@endphp
```

**stx @js:**
```html
@js
  const total = prices.reduce((sum, p) => sum + p, 0);
  const formatted = total.toFixed(2);
@endjs
```

Or use `@ts` for TypeScript:

```html
@ts
  const total: number = prices.reduce((sum: number, p: number) => sum + p, 0);
@endts
```

## JSON Output

### @json

**Blade:**
```php
<script>
    const config = @json($config);
</script>
```

**stx:**
```html
<script>
  const config = @json(config);
</script>
```

## Features Not in Blade

stx adds several features not found in Laravel Blade:

### Filters

```html
{{ text | uppercase | truncate(100) }}
{{ price | currency }}
{{ date | date('MMMM D, YYYY') }}
```

### Content Security Policy

```html
<head>
  @csp
</head>
<script nonce="{{ cspNonce }}">
  // Safe inline script
</script>
```

### Animations

```html
@transition('fade', 300)
  <div>Animated content</div>
@endtransition
```

### SEO Helpers

```html
@seo({
  title: 'Page Title',
  description: 'Description',
  openGraph: { image: '/og.jpg' }
})
```

### Accessibility

```html
@screenReader
  <span>Opens in new window</span>
@endscreenReader
```

### Script Variables

Variables in `<script>` tags are automatically available:

```html
<script>
const pageTitle = 'Welcome'
const items = ['a', 'b', 'c']
</script>

<h1>{{ pageTitle }}</h1>
@foreach(items as item)
  <span>{{ item }}</span>
@endforeach
```

## Migration Checklist

When migrating a Blade template:

1. **File Extension**: Rename `.blade.php` to `.stx`

2. **Variables**: Remove `$` prefix
   - `{{ $user }}` → `{{ user }}`

3. **Object Access**: Change `->` to `.`
   - `{{ $user->name }}` → `{{ user.name }}`

4. **Arrays/Objects**: Use JS syntax
   - `['key' => 'value']` → `{ key: 'value' }`

5. **Paths**: Use `/` instead of `.`
   - `@include('partials.header')` → `@include('partials/header')`

6. **PHP Functions**: Replace with JS equivalents or filters
   - `strtoupper($x)` → `x | uppercase` or `x.toUpperCase()`

7. **Date Formatting**: Use JS Date or filters
   - `$date->format('Y-m-d')` → `date | date('YYYY-MM-DD')`

8. **Number Formatting**: Use filters
   - `number_format($x, 2)` → `x | number(2)`

9. **Raw PHP**: Replace `@php` with `@js` or `@ts`

10. **Components**: Update syntax
    - `<x-component>` → `<Component>` or `@component()`

## Example: Full Template Migration

### Original Blade Template

```php
{{-- resources/views/posts/show.blade.php --}}
@extends('layouts.app')

@section('title', $post->title)

@section('content')
<article>
    <h1>{{ $post->title }}</h1>

    @if($post->featured_image)
        <img src="{{ $post->featured_image }}" alt="{{ $post->title }}">
    @endif

    <div class="meta">
        By {{ $post->author->name }} on {{ $post->created_at->format('F j, Y') }}
    </div>

    <div class="content">
        {!! $post->content !!}
    </div>

    @auth
        @can('edit', $post)
            <a href="{{ route('posts.edit', $post) }}">Edit Post</a>
        @endcan
    @endauth

    <h2>Comments ({{ $post->comments->count() }})</h2>

    @forelse($post->comments as $comment)
        @include('partials.comment', ['comment' => $comment])
    @empty
        <p>No comments yet.</p>
    @endforelse

    @auth
        <form method="POST" action="{{ route('comments.store') }}">
            @csrf
            <input type="hidden" name="post_id" value="{{ $post->id }}">

            <textarea name="body" placeholder="Add a comment..."></textarea>
            @error('body')
                <span class="error">{{ $message }}</span>
            @enderror

            <button type="submit">Submit</button>
        </form>
    @endauth
</article>
@endsection

@push('scripts')
<script src="/js/comments.js"></script>
@endpush
```

### Migrated stx Template

```html
<!-- pages/posts/show.stx -->
@extends('layouts/app')

@section('title', post.title)

@section('content')
<article>
  <h1>{{ post.title }}</h1>

  @if(post.featuredImage)
    <img src="{{ post.featuredImage }}" alt="{{ post.title }}">
  @endif

  <div class="meta">
    By {{ post.author.name }} on {{ post.createdAt | date('MMMM D, YYYY') }}
  </div>

  <div class="content">
    {!! post.content !!}
  </div>

  @auth
    @can('edit', 'post', post.id)
      <a href="@route('posts.edit', { id: post.id })">Edit Post</a>
    @endcan
  @endauth

  <h2>Comments ({{ post.comments.length }})</h2>

  @forelse(post.comments as comment)
    @include('partials/comment', { comment })
  @empty
    <p>No comments yet.</p>
  @endforelse

  @auth
    <form method="POST" action="@route('comments.store')">
      @csrf
      <input type="hidden" name="post_id" value="{{ post.id }}">

      <textarea name="body" placeholder="Add a comment..."></textarea>
      @error('body')
        <span class="error">{{ message }}</span>
      @enderror

      <button type="submit">Submit</button>
    </form>
  @endauth
</article>
@endsection

@push('scripts')
<script src="/js/comments.js"></script>
@endpush
```

## Need Help?

- [Directive Reference](/api/directives) - Complete list of all directives
- [Configuration](/api/config) - Configuration options
- [GitHub Issues](https://github.com/stacksjs/stx/issues) - Report problems or ask questions
