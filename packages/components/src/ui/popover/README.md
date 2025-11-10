# Popover Component

A floating panel that displays rich content anchored to a button or element.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
@component('Popover')
  @component('PopoverButton', { className: 'px-4 py-2 bg-blue-500 text-white rounded' })
    Solutions
  @endcomponent

  @component('PopoverPanel', { className: 'w-64' })
    <div class="grid gap-4">
      <a href="/analytics">Analytics</a>
      <a href="/engagement">Engagement</a>
      <a href="/security">Security</a>
    </div>
  @endcomponent
@endcomponent
```

## Props

### Popover
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### PopoverButton
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'button'` | HTML element to render |
| `disabled` | `boolean` | `false` | Disable the button |
| `onClick` | `(e: Event) => void` | - | Click handler |

### PopoverPanel
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |
| `static` | `boolean` | `false` | Keep visible regardless of state |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'bottom'` | Panel position |

## Examples

### Solutions Menu

```stx
@component('PopoverPanel', { className: 'w-80' })
  <div class="grid gap-8">
    <a href="/analytics" class="flex items-start gap-4 group">
      <div class="shrink-0 text-blue-500">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <p class="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-500">Analytics</p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">Get a better understanding of your traffic</p>
      </div>
    </a>
  </div>
@endcomponent
```

### Different Positions

```stx
@component('PopoverPanel', { position: 'top' })
  Content appears above
@endcomponent

@component('PopoverPanel', { position: 'left' })
  Content appears to the left
@endcomponent
```

## Features

- Multiple positioning options
- Auto-positioning
- Dark mode support
- Accessible (WAI-ARIA)
- Keyboard support
- Focus management
- Customizable styling
