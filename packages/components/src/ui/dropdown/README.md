# Dropdown Component

A flexible dropdown menu component inspired by Headless UI, built with STX and headwind.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Dropdown')
  @component('DropdownButton', { className: 'btn-primary' })
    Options
  @endcomponent

  @component('DropdownItems')
    @component('DropdownItem')
      Edit
    @endcomponent
    @component('DropdownItem')
      Delete
    @endcomponent
  @endcomponent
@endcomponent
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
@component('Dropdown')
  @component('DropdownButton', {
    className: 'px-4 py-2 bg-blue-500 text-white rounded-md'
  })
    Actions
  @endcomponent

  @component('DropdownItems', {
    className: 'w-56'
  })
    @component('DropdownItem')
      Edit
    @endcomponent
    @component('DropdownItem')
      Duplicate
    @endcomponent
    @component('DropdownItem', { disabled: true })
      Archive (coming soon)
    @endcomponent
    @component('DropdownItem')
      Delete
    @endcomponent
  @endcomponent
@endcomponent
```

### With Icons

```stx
@component('DropdownItem')
  <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
  Edit
@endcomponent
```

### Grouped Items

```stx
@component('DropdownItems')
  <div class="px-1 py-1">
    @component('DropdownItem')
      Edit
    @endcomponent
    @component('DropdownItem')
      Duplicate
    @endcomponent
  </div>

  <div class="px-1 py-1">
    @component('DropdownItem')
      Archive
    @endcomponent
    @component('DropdownItem')
      Move
    @endcomponent
  </div>

  <div class="px-1 py-1">
    @component('DropdownItem')
      Delete
    @endcomponent
  </div>
@endcomponent
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
