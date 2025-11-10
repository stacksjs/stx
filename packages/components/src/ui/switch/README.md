# Switch Component

A modern toggle switch component built with STX and headwind utility classes, inspired by Headless UI.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Switch', { checked: true, label: 'Enable notifications' })
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `checked` | `boolean` | `false` | Whether the switch is checked |
| `disabled` | `boolean` | `false` | Disable the switch |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Switch size |
| `className` | `string` | `''` | Additional CSS classes |
| `onChange` | `(checked: boolean) => void` | - | Change handler |
| `label` | `string` | `''` | Optional label text |

## Examples

### Basic Switch

```stx
<script>
let enabled = false

function handleChange(checked) {
  enabled = checked
  console.log('Switch is now:', checked)
}

module.exports = { enabled, handleChange }
</script>

@component('Switch', {
  checked: enabled,
  onChange: handleChange
})
```

### With Label

```stx
@component('Switch', {
  checked: true,
  label: 'Enable notifications',
  onChange: handleChange
})
```

### Sizes

```stx
@component('Switch', { size: 'sm', checked: true })

@component('Switch', { size: 'md', checked: true })

@component('Switch', { size: 'lg', checked: true })
```

### Disabled State

```stx
@component('Switch', {
  checked: true,
  disabled: true,
  label: 'Cannot toggle'
})
```

### Custom Styling

```stx
@component('Switch', {
  checked: true,
  className: 'my-4'
})
```

## Accessibility

The Switch component follows WAI-ARIA best practices:

- Proper `role="switch"` attribute
- `aria-checked` reflects the current state
- `aria-disabled` when disabled
- Screen reader text via `sr-only` class
- Keyboard accessible (can be toggled with Space/Enter)
- Focus visible ring for keyboard navigation

## Features

- Smooth animations and transitions
- Three size options (sm, md, lg)
- Dark mode support
- Disabled state
- Optional label
- Accessible by default
- Headwind utility classes for easy customization
- Inspired by Headless UI design

## Styling

The component uses headwind utility classes for styling. You can customize it by:

1. Passing additional classes via `className` prop
2. Modifying the component source
3. Using headwind configuration to adjust the design system

### Color Customization

To customize colors, you can:

- Override the checked state background color in your headwind config
- Pass custom classes via `className` prop
- Modify the component's source code

Example:
```stx
@component('Switch', {
  checked: true,
  className: '!bg-green-500'
})
```
