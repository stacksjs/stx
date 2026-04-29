# Dropdown Component

A flexible dropdown menu component inspired by Headless UI, built with STX and headwind.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<Dropdown>
  <DropdownButton className="btn-primary">Options</DropdownButton>

  <DropdownItems>
    <DropdownItem>Edit</DropdownItem>
    <DropdownItem>Delete</DropdownItem>
  </DropdownItems>
</Dropdown>
```

## Props

### Dropdown
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### DropdownButton
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'button'` | HTML element to render |
| `disabled` | `boolean` | `false` | Disable the button |
| `onClick` | `(e: Event) => void` | - | Click handler |

### DropdownItems
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |
| `static` | `boolean` | `false` | Keep visible regardless of state |

### DropdownItem
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |
| `disabled` | `boolean` | `false` | Disable the item |
| `onClick` | `(e: Event) => void` | - | Click handler |

## Examples

### Basic Dropdown

```stx
<Dropdown>
  <DropdownButton className="px-4 py-2 bg-blue-500 text-white rounded-md">
    Actions
  </DropdownButton>

  <DropdownItems className="w-56">
    <DropdownItem>Edit</DropdownItem>
    <DropdownItem>Duplicate</DropdownItem>
    <DropdownItem disabled>Archive (coming soon)</DropdownItem>
    <DropdownItem>Delete</DropdownItem>
  </DropdownItems>
</Dropdown>
```

### With Icons

```stx
<DropdownItem>
  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
  Edit
</DropdownItem>
```

### Grouped Items

```stx
<DropdownItems>
  <div class="px-1 py-1">
    <DropdownItem>Edit</DropdownItem>
    <DropdownItem>Duplicate</DropdownItem>
  </div>

  <div class="px-1 py-1">
    <DropdownItem>Archive</DropdownItem>
    <DropdownItem>Move</DropdownItem>
  </div>

  <div class="px-1 py-1">
    <DropdownItem>Delete</DropdownItem>
  </div>
</DropdownItems>
```

## Features

- Automatic positioning
- Keyboard navigation
- Focus management
- Dark mode support
- Accessible (WAI-ARIA)
- Customizable styling with headwind
- Disabled state support
- Active state on hover
