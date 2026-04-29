# Button Component

A versatile button component built with STX and headwind utility classes.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<Button variant="primary" size="md">Click me</Button>
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
<Button variant="primary">Primary Button</Button>

<Button variant="secondary">Secondary Button</Button>

<Button variant="outline">Outline Button</Button>

<Button variant="ghost">Ghost Button</Button>

<Button variant="danger">Danger Button</Button>
```

### Sizes

```stx
<Button size="sm">Small Button</Button>

<Button size="md">Medium Button</Button>

<Button size="lg">Large Button</Button>
```

### Disabled State

```stx
<Button disabled>Disabled Button</Button>
```

### With Icon

```stx
<Button variant="primary">
  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
  </svg>
  Add Item
</Button>
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
