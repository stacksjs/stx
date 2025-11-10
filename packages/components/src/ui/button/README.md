# Button Component

A versatile button component built with STX and headwind utility classes.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Button', { variant: 'primary', size: 'md' })
  Click me
@endcomponent
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Button visual style |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Button HTML type |
| `className` | `string` | `''` | Additional CSS classes |
| `onClick` | `() => void` | - | Click handler |

## Examples

### Variants

```stx
@component('Button', { variant: 'primary' })
  Primary Button
@endcomponent

@component('Button', { variant: 'secondary' })
  Secondary Button
@endcomponent

@component('Button', { variant: 'outline' })
  Outline Button
@endcomponent

@component('Button', { variant: 'ghost' })
  Ghost Button
@endcomponent

@component('Button', { variant: 'danger' })
  Danger Button
@endcomponent
```

### Sizes

```stx
@component('Button', { size: 'sm' })
  Small Button
@endcomponent

@component('Button', { size: 'md' })
  Medium Button
@endcomponent

@component('Button', { size: 'lg' })
  Large Button
@endcomponent
```

### Disabled State

```stx
@component('Button', { disabled: true })
  Disabled Button
@endcomponent
```

### With Icon

```stx
@component('Button', { variant: 'primary' })
  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
  Add Item
@endcomponent
```

## Features

- 5 visual variants (primary, secondary, outline, ghost, danger)
- 3 size options (sm, md, lg)
- Disabled state support
- Focus ring with keyboard navigation
- Dark mode support
- Accessible by default
- Smooth transitions
- Headwind utility classes for easy customization
