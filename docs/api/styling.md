# Styling API

stx provides a powerful and flexible styling system that combines the best of modern CSS approaches. This guide covers all styling capabilities available in stx.

## Basic Styling

### Inline Styles

```html
<div :style="{ color: activeColor, fontSize: fontSize + 'px' }">
  Dynamic Styling
</div>
```

### Class Bindings

```html
<div :class="{ active: isActive, 'text-danger': hasError }">
  Dynamic Classes
</div>
```

## CSS Modules

### Usage

```typescript
import styles from './MyComponent.module.css'

<div :class="styles.container">
  Scoped Styling
</div>
```

### TypeScript Support

```typescript
// style.d.ts
declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}
```

## Utility Classes

stx includes a comprehensive set of utility classes for rapid styling:

```html
<div class="flex items-center justify-between p-4 bg-white shadow-md">
  <h2 class="text-xl font-bold text-gray-800">Title</h2>
  <button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Action
  </button>
</div>
```

## Theme System

### Theme Configuration

```typescript
// stx.config.ts
export default {
  theme: {
    colors: {
      primary: '#3B82F6',
      secondary: '#10B981',
      // ...
    },
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      // ...
    }
  }
}
```

### Theme Usage

```html
<div class="bg-primary p-md">
  Themed Component
</div>
```

## Dynamic Styling

### Reactive Styles

```typescript
const theme = reactive({
  color: 'blue',
  fontSize: '16px'
})

<div :style="theme">
  Reactive Styling
</div>
```

### Computed Styles

```typescript
const buttonClasses = computed(() => ({
  'btn': true,
  'btn-primary': isPrimary.value,
  'btn-disabled': isDisabled.value
}))
```

## CSS-in-JS

### Styled Components

```typescript
const StyledButton = styled.button`
  background: ${props => props.primary ? 'blue' : 'white'};
  color: ${props => props.primary ? 'white' : 'black'};
  padding: 0.5em 1em;
  border-radius: 4px;
`
```

## Responsive Design

### Breakpoint Utilities

```html
<div class="hidden sm:block md:flex lg:grid">
  Responsive Layout
</div>
```

### Custom Media Queries

```typescript
// stx.config.ts
export default {
  theme: {
    screens: {
      tablet: '640px',
      laptop: '1024px',
      desktop: '1280px',
    }
  }
}
```

## Best Practices

1. Use CSS Modules for component-specific styles
2. Leverage utility classes for rapid development
3. Maintain consistent theming through configuration
4. Follow responsive design principles
5. Keep styles modular and reusable

## Related Topics

- [Component API](/api/component)
- [Configuration](/api/config)
- [TypeScript Integration](/api/typescript)
