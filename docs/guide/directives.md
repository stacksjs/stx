# Directives

stx directives are special template attributes that provide powerful functionality for your templates. This guide covers all available directives and their usage.

## Core Directives

### Conditional Rendering

#### @if / @else / @elseif

```stx
@if(user.isAdmin)
  <admin-panel />
@elseif(user.isModerator)
  <moderator-panel />
@else
  <user-panel />
@endif
```

#### @unless

The opposite of `@if`:

```stx
@unless(user.isVerified)
  <verify-email-banner />
@endunless
```

#### @show / @hide

Shorthand for visibility control:

```stx
<div @show="isVisible">Visible content</div>
<div @hide="isHidden">Hidden when true</div>
```

### Loops and Iteration

#### @foreach

Iterate over arrays and objects:

```stx
<ul>
  @foreach(users as user)
    <li>{{ user.name }}</li>
  @endforeach
</ul>

<!-- With index -->
<ul>
  @foreach(users as user, index)
    <li>{{ index + 1 }}. {{ user.name }}</li>
  @endforeach
</ul>

<!-- With empty state -->
@foreach(items as item)
  <item-card :data="item" />
@empty
  <p>No items found</p>
@endforeach
```

#### @for

Traditional for loop:

```stx
@for(let i = 0; i < 5; i++)
  <span>Item {{ i + 1 }}</span>
@endfor
```

#### @while

While loop:

```stx
@while(condition)
  <keep-trying />
@endwhile
```

### Layout Control

#### @extends

Inherit from a layout:

```stx
@extends('layouts/main')
```

#### @section / @yield

Define and render content sections:

```stx
<!-- Layout -->
<title>@yield('title')</title>
<main>@yield('content')</main>

<!-- Page -->
@section('title', 'My Page')
@section('content')
  <h1>Welcome</h1>
@endsection
```

#### @include

Include other templates:

```stx
@include('partials/header')
@include('components/card', { title: 'My Card' })
@includeIf('optional/feature')
@includeWhen(user.isAdmin, 'admin/tools')
```

### Component Directives

#### @component

Define a component:

```stx
@ts
interface ButtonProps {
  type: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
}
@endts

@component('Button', {
  props: {
    type: 'primary',
    size: 'md'
  }
})
  <button class="btn btn-{{ type }} btn-{{ size }}">
    <slot></slot>
  </button>
@endcomponent
```

#### @slot

Define named slots:

```stx
@component('Card')
  <slot name="header"></slot>
  <slot></slot>
  <slot name="footer"></slot>
@endcomponent

<!-- Usage -->
<Card>
  @slot('header')
    <h2>Card Title</h2>
  @endslot

  <p>Card content</p>

  @slot('footer')
    <button>Action</button>
  @endslot
</Card>
```

### Event Handling

#### @click

Handle click events:

```stx
<button @click="handleClick">Click Me</button>
<button @click="count++">Increment</button>
```

#### @submit

Handle form submissions:

```stx
<form @submit.prevent="handleSubmit">
  <!-- form fields -->
</form>
```

#### Event Modifiers

Add event modifiers with dots:

```stx
<button @click.stop="handleClick">Stop Propagation</button>
<button @click.prevent="handleClick">Prevent Default</button>
<form @submit.prevent="handleSubmit">Submit</form>
<div @click.once="handleClick">Click Once Only</div>
<button @click.self="handleClick">Self Only</button>
```

### Data Binding

#### @bind

Two-way data binding:

```stx
<input @bind="username" />
<select @bind="selectedOption">
  <option value="1">One</option>
  <option value="2">Two</option>
</select>
```

#### @model

Form input binding:

```stx
<input type="text" @model="user.name" />
<input type="checkbox" @model="isChecked" />
<select @model="selected">
  <!-- options -->
</select>
```

### Advanced Directives

#### @memo

Memoize expensive computations:

```stx
@memo(expensiveValue)
  <heavy-component :value="expensiveValue" />
@endmemo
```

#### @watch

Watch for changes:

```stx
@watch(user.status)
  <status-indicator :status="user.status" />
@endwatch
```

#### @error

Error handling:

```stx
@error
  <div class="error-message">
    {{ error.message }}
  </div>
@enderror
```

### Custom Directives

Create your own directives:

```ts
// directives/tooltip.ts
import { defineDirective } from '@stacksjs/stx'

export const tooltip = defineDirective({
  mounted(el, { value }) {
    el.setAttribute('title', value)
  },
  updated(el, { value }) {
    el.setAttribute('title', value)
  }
})

// Usage in template
<button @tooltip="Help text">Hover me</button>
```

## Best Practices

1. **Conditional Rendering**
   - Use `@if` for simple conditions
   - Use `@switch` for multiple conditions
   - Consider extracting complex logic to computed properties

2. **Loops**
   - Always provide a key for list items
   - Use `@empty` for empty states
   - Consider pagination for large lists

3. **Event Handling**
   - Use appropriate event modifiers
   - Keep event handlers simple
   - Consider debouncing/throttling when needed

4. **Component Organization**
   - Keep directives focused and reusable
   - Document custom directives
   - Test directive behavior

## Next Steps

- Learn about [Components](/features/components)
- Explore [Template Syntax](/features/templates)
- Understand [TypeScript Integration](/features/typescript)
- Check out [Custom Directives](/advanced/custom-directives)
