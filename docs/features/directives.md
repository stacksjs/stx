# Directives

stx provides a powerful directive system for extending template functionality. This page covers all built-in directives and how to create custom directives in the stx ecosystem.

## Built-in Directives

### Conditional Directives

```stx
<!-- Basic conditionals -->
@if(user.isAuthenticated)
  <dashboard />
@elseif(user.isGuest)
  <welcome-message />
@else
  <login-form />
@endif

<!-- Authentication helpers -->
@auth
  <admin-panel />
@endauth

@guest
  <signup-banner />
@endguest

<!-- Unless directive -->
@unless(user.hasPermission('admin'))
  <access-denied />
@endunless
```

### Loop Directives

```stx
<!-- Basic foreach -->
@foreach(items as item)
  <div class="item">&#123;&#123; item.name &#125;&#125;</div>
@endforeach

<!-- With index -->
@foreach(users as index => user)
  <tr class="&#123;&#123; index % 2 === 0 ? 'even' : 'odd' &#125;&#125;">
    <td>&#123;&#123; index + 1 &#125;&#125;</td>
    <td>&#123;&#123; user.name &#125;&#125;</td>
  </tr>
@endforeach

<!-- With empty state -->
@forelse(posts as post)
  <article>&#123;&#123; post.title &#125;&#125;</article>
@empty
  <p>No posts found.</p>
@endforelse

<!-- For range -->
@for(i = 1; i <= 10; i++)
  <div>Item &#123;&#123; i &#125;&#125;</div>
@endfor

<!-- While loop -->
@while(hasMore && page < maxPages)
  <load-more-button @click="loadMore" />
@endwhile
```

### Template Directives

```stx
<!-- Include partials -->
@include('components.user-card', { user: currentUser })

<!-- Extend layouts -->
@extends('layouts.app')

@section('title', 'Home Page')

@section('content')
  <h1>Welcome!</h1>
@endsection

<!-- Push to stacks -->
@push('styles')
  <link rel="stylesheet" href="/css/home.css">
@endpush

@push('scripts')
  <script src="/js/home.js"></script>
@endpush

<!-- Yield sections -->
@yield('content', 'Default content')
@stack('scripts')
```

### Form Directives

```stx
<!-- Two-way binding -->
<input @model="username" type="text">
<input @model.number="age" type="number">
<input @model.trim="message" type="text">

<!-- Checkbox binding -->
<input @model="isChecked" type="checkbox">

<!-- Select binding -->
<select @model="selectedOption">
  @foreach(options as option)
    <option :value="option.value">&#123;&#123; option.label &#125;&#125;</option>
  @endforeach
</select>

<!-- Multiple select -->
<select @model="selectedItems" multiple>
  @foreach(items as item)
    <option :value="item.id">&#123;&#123; item.name &#125;&#125;</option>
  @endforeach
</select>
```

### Event Directives

```stx
<!-- Basic event handling -->
<button @click="handleClick">Click me</button>
<input @input="handleInput" @blur="handleBlur">

<!-- Event modifiers -->
<form @submit.prevent="onSubmit">
<button @click.stop="stopPropagation">
<input @keyup.enter="search">
<div @click.once="initializeOnce">

<!-- Dynamic events -->
<button @[eventName]="handler">Dynamic Event</button>

<!-- Multiple events -->
<input
  @input="handleInput"
  @focus="handleFocus"
  @blur="handleBlur"
>
```

### Attribute Directives

```stx
<!-- Dynamic attributes -->
<img :src="imageUrl" :alt="imageAlt">
<button :disabled="isLoading" :class="buttonClass">

<!-- Dynamic attribute names -->
<input :[attributeName]="attributeValue">

<!-- Class binding -->
<div :class="{
  'active': isActive,
  'disabled': isDisabled,
  'large': size === 'large'
}">
</div>

<!-- Style binding -->
<div :style="{
  color: textColor,
  fontSize: fontSize + 'px',
  backgroundColor: bgColor
}">
</div>
```

## Custom Directives

### Simple Custom Directive

```typescript
// directives/focus.ts
export const focus = {
  mounted(el: HTMLElement, binding: any) {
    if (binding.value) {
      el.focus()
    }
  },

  updated(el: HTMLElement, binding: any) {
    if (binding.value) {
      el.focus()
    }
  }
}

// Register directive
app.directive('focus', focus)
```

Usage:

```stx
<input @focus="shouldFocus" type="text">
```

### Advanced Custom Directive

```typescript
// directives/lazy-load.ts
export const lazyLoad = {
  mounted(el: HTMLElement, binding: any) {
    const options = {
      threshold: 0.1,
      rootMargin: '50px',
      ...binding.value?.options
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement

          // Load the image
          if (binding.value?.src) {
            img.src = binding.value.src
          }

          // Add loaded class
          img.classList.add('loaded')

          // Execute callback
          if (binding.value?.onLoad) {
            binding.value.onLoad(img)
          }

          observer.unobserve(img)
        }
      })
    }, options)

    observer.observe(el)

    // Store observer for cleanup
    el._lazyObserver = observer
  },

  beforeUnmount(el: HTMLElement) {
    if (el._lazyObserver) {
      el._lazyObserver.disconnect()
    }
  }
}
```

Usage:

```stx
<img
  @lazy-load="{
    src: '/images/large-image.jpg',
    onLoad: handleImageLoad,
    options: { threshold: 0.2 }
  }"
  src="/images/placeholder.jpg"
  alt="Lazy loaded image"
>
```

### Directive with Arguments

```typescript
// directives/click-outside.ts
export const clickOutside = {
  mounted(el: HTMLElement, binding: any) {
    const handler = (event: Event) => {
      if (!el.contains(event.target as Node)) {
        binding.value(event)
      }
    }

    document.addEventListener('click', handler)
    el._clickOutsideHandler = handler
  },

  beforeUnmount(el: HTMLElement) {
    if (el._clickOutsideHandler) {
      document.removeEventListener('click', el._clickOutsideHandler)
    }
  }
}
```

Usage:

```stx
<div @click-outside="closeMenu" class="dropdown">
  <!-- Dropdown content -->
</div>
```

### Parameterized Directive

```typescript
// directives/tooltip.ts
export const tooltip = {
  mounted(el: HTMLElement, binding: any) {
    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.textContent = binding.value
    tooltip.style.display = 'none'
    document.body.appendChild(tooltip)

    const showTooltip = (event: MouseEvent) => {
      tooltip.style.display = 'block'
      tooltip.style.left = event.pageX + 10 + 'px'
      tooltip.style.top = event.pageY + 10 + 'px'
    }

    const hideTooltip = () => {
      tooltip.style.display = 'none'
    }

    el.addEventListener('mouseenter', showTooltip)
    el.addEventListener('mouseleave', hideTooltip)

    el._tooltip = tooltip
    el._showTooltip = showTooltip
    el._hideTooltip = hideTooltip
  },

  updated(el: HTMLElement, binding: any) {
    if (el._tooltip) {
      el._tooltip.textContent = binding.value
    }
  },

  beforeUnmount(el: HTMLElement) {
    if (el._tooltip) {
      document.body.removeChild(el._tooltip)
    }
    if (el._showTooltip) {
      el.removeEventListener('mouseenter', el._showTooltip)
    }
    if (el._hideTooltip) {
      el.removeEventListener('mouseleave', el._hideTooltip)
    }
  }
}
```

Usage:

```stx
<button @tooltip="'This is a helpful tooltip'">
  Hover me
</button>
```

## Directive Composition

### Multiple Directives

```stx
<input
  @model="searchQuery"
  @focus="true"
  @click-outside="closeSearchResults"
  @debounce:300="performSearch"
  type="text"
>
```

### Directive Inheritance

```typescript
// Base directive
const baseValidation = {
  mounted(el: HTMLElement, binding: any) {
    // Common validation logic
  }
}

// Extended directive
const emailValidation = {
  ...baseValidation,
  mounted(el: HTMLElement, binding: any) {
    baseValidation.mounted(el, binding)
    // Email-specific validation
    el.addEventListener('input', validateEmail)
  }
}
```

## Built-in Directive Modifiers

### Event Modifiers

```stx
<!-- Prevent default -->
<form @submit.prevent="onSubmit">

<!-- Stop propagation -->
<button @click.stop="handleClick">

<!-- Capture phase -->
<div @click.capture="handleCapture">

<!-- Once only -->
<button @click.once="initialize">

<!-- Passive listener -->
<div @scroll.passive="handleScroll">

<!-- Key modifiers -->
<input @keyup.enter="search">
<input @keyup.esc="clearSearch">
<input @keyup.ctrl.s="save">
```

### Model Modifiers

```stx
<!-- Trim whitespace -->
<input @model.trim="message">

<!-- Convert to number -->
<input @model.number="age">

<!-- Lazy sync (on change instead of input) -->
<input @model.lazy="value">

<!-- Debounced input -->
<input @model.debounce:500="searchQuery">
```

## Async Directives

### Async Directive Example

```typescript
// directives/async-load.ts
export const asyncLoad = {
  async mounted(el: HTMLElement, binding: any) {
    el.classList.add('loading')

    try {
      const data = await binding.value()

      // Update element with loaded data
      if (typeof data === 'string') {
        el.textContent = data
      } else if (data.html) {
        el.innerHTML = data.html
      }

      el.classList.remove('loading')
      el.classList.add('loaded')
    } catch (error) {
      el.classList.remove('loading')
      el.classList.add('error')
      console.error('Async load failed:', error)
    }
  }
}
```

Usage:

```stx
<div @async-load="loadUserData">Loading...</div>
```

## Directive Testing

### Testing Custom Directives

```typescript
import { mount } from '@stx/testing'
import { tooltip } from './directives/tooltip'

describe('Tooltip Directive', () => {
  test('creates tooltip on hover', async () => {
    const wrapper = mount({
      template: '<button @tooltip="\'Test tooltip\'">Hover</button>',
      directives: { tooltip }
    })

    const button = wrapper.find('button')
    await button.trigger('mouseenter')

    const tooltipEl = document.querySelector('.tooltip')
    expect(tooltipEl).toBeTruthy()
    expect(tooltipEl.textContent).toBe('Test tooltip')

    await button.trigger('mouseleave')
    expect(tooltipEl.style.display).toBe('none')
  })
})
```

### Integration Testing

```typescript
describe('Form with Custom Directives', () => {
  test('validation and focus work together', async () => {
    const wrapper = mount({
      template: `
        <form>
          <input
            @model="email"
            @focus="true"
            @validate="validateEmail"
            type="email"
          >
        </form>
      `,
      data: {
        email: ''
      }
    })

    const input = wrapper.find('input')
    expect(document.activeElement).toBe(input.element)

    await input.setValue('invalid-email')
    // Test validation behavior
  })
})
```

## Performance Considerations

### Efficient Directive Updates

```typescript
export const optimizedDirective = {
  mounted(el: HTMLElement, binding: any) {
    // Initialize once
    el._directiveData = {
      previousValue: binding.value,
      handler: createHandler(binding.value)
    }
  },

  updated(el: HTMLElement, binding: any) {
    // Only update if value changed
    if (binding.value !== el._directiveData.previousValue) {
      // Cleanup previous
      cleanup(el._directiveData.handler)

      // Setup new
      el._directiveData = {
        previousValue: binding.value,
        handler: createHandler(binding.value)
      }
    }
  }
}
```

### Memory Management

```typescript
export const memoryEfficientDirective = {
  mounted(el: HTMLElement, binding: any) {
    const controller = new AbortController()

    el.addEventListener('click', handler, {
      signal: controller.signal
    })

    // Store for cleanup
    el._abortController = controller
  },

  beforeUnmount(el: HTMLElement) {
    // Automatic cleanup of all listeners
    el._abortController?.abort()
  }
}
```

## Related Resources

- [Directive Guide](/guide/directives) - Comprehensive directive development guide
- [Template System](/features/templates) - Template syntax and directives
- [Custom Directives](/advanced/custom-directives) - Advanced directive patterns
- [Component System](/features/components) - Using directives with components
