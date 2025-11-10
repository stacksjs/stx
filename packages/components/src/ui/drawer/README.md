# Drawer Component

A slide-out panel component that can appear from any side of the screen.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export let drawerOpen = false
</script>

<button
  class="rounded-md bg-gray-950/5 px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-950/10"
  onclick="drawerOpen = true"
>
  Open drawer
</button>

@component('Drawer', {
  open: drawerOpen,
  onClose: () => drawerOpen = false,
  position: 'right',
  title: 'Panel title'
})
  <p class="text-sm text-gray-500 dark:text-gray-400">
    Your drawer content goes here.
  </p>
@endcomponent
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls drawer visibility |
| `onClose` | `function` | - | Callback when drawer should close |
| `position` | `'right' \| 'left' \| 'top' \| 'bottom'` | `'right'` | Position of the drawer |
| `title` | `string` | `''` | Optional title for the drawer |
| `className` | `string` | `''` | Additional CSS classes |

## Positions

### Right (default)
```stx
@component('Drawer', {
  open: true,
  position: 'right'
})
  Content
@endcomponent
```

### Left
```stx
@component('Drawer', {
  open: true,
  position: 'left'
})
  Content
@endcomponent
```

### Top
```stx
@component('Drawer', {
  open: true,
  position: 'top'
})
  Content
@endcomponent
```

### Bottom
```stx
@component('Drawer', {
  open: true,
  position: 'bottom'
})
  Content
@endcomponent
```

## Features

- **4 positions** - Slide from right, left, top, or bottom
- **Smooth animations** - CSS transitions for slide and fade effects
- **Backdrop click** - Closes drawer when clicking outside
- **Close button** - Positioned appropriately for each direction
- **Dark mode** - Full dark mode support
- **Accessible** - Screen reader support and focus management
- **Responsive** - Mobile-friendly with adjusted spacing
- **Modern ES modules** - Clean export syntax
- **Headwind styling** - Utility-first CSS classes

## Accessibility

- Close button includes `sr-only` text for screen readers
- Backdrop and close button have proper ARIA labels
- Keyboard accessible (ESC key closes drawer - handled by parent)
- Focus management for modal behavior

## Customization

The drawer accepts a `className` prop for additional styling and supports slot content for complete customization of the drawer body.
