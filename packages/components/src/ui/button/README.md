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

## Mac look

`appearance="mac"` draws the push button a Mac draws: 22px tall, a capsule, 13px words. The prop is `appearance` rather than `variant` because `variant` already says what a button is for, and it keeps doing that:

| `variant` | Under `appearance="mac"` |
|---|---|
| none, `secondary`, `outline` | The plain push button: a raised face (`--stx-mac-control`) |
| `primary` | The default button: accent fill, white words |
| `danger` | Destructive: red words on the plain face |
| `ghost` | No face until it is pointed at |

```html
<Button appearance="mac">Cancel</Button>
<Button appearance="mac" variant="primary">Save</Button>
<Button appearance="mac" variant="danger">Delete</Button>
```

Note that a button with no `variant` is the plain one here, not the primary one: on a Mac most buttons are plain. `size` is not read. `disabled`, `loading`, `label`, `fullWidth`, the icons and `@click` behave as they do everywhere else.

Colours and type come from the `--stx-mac-*` custom properties (`src/utils/mac-theme.ts`), light and dark, so an app re-themes it by setting a variable. A window that is not the key window (`data-stx-window-active="false"` on an ancestor, or Craft's `data-craft-window-active`) draws it without colour. A default button gives up its fill in an inactive window, as the system's does. The pressed tint is `--stx-mac-button-pressed`.
