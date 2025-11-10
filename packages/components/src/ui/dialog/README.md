# Dialog Component

A modal dialog component for overlays, alerts, and confirmations. Built with STX and headwind.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export let isOpen = false

export function closeModal() {
  isOpen = false
}

export function openModal() {
  isOpen = true
}
</script>

@component('Dialog', { open: isOpen, onClose: closeModal })
  @component('DialogBackdrop')

  @component('DialogPanel', { className: 'max-w-md' })
    @component('DialogTitle')
      Payment successful
    @endcomponent

    @component('DialogDescription')
      Your payment has been successfully submitted.
    @endcomponent

    <div class="mt-4">
      @component('Button', { onClick: closeModal })
        Got it, thanks!
      @endcomponent
    </div>
  @endcomponent
@endcomponent
```

## Props

### Dialog
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether dialog is open |
| `onClose` | `(value: boolean) => void` | - | Close handler |
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### DialogBackdrop
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### DialogPanel
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'div'` | HTML element to render |

### DialogTitle
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'h3'` | HTML element to render |

### DialogDescription
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `as` | `string` | `'p'` | HTML element to render |

## Examples

### Confirmation Dialog

```stx
@component('Dialog', { open: isOpen, onClose: closeModal })
  @component('DialogBackdrop')

  @component('DialogPanel', { className: 'max-w-md' })
    @component('DialogTitle')
      Delete account
    @endcomponent

    @component('DialogDescription')
      Are you sure you want to delete your account? This action cannot be undone.
    @endcomponent

    <div class="mt-4 flex gap-2">
      @component('Button', { variant: 'danger', onClick: handleDelete })
        Delete
      @endcomponent
      @component('Button', { variant: 'secondary', onClick: closeModal })
        Cancel
      @endcomponent
    </div>
  @endcomponent
@endcomponent
```

### Large Dialog

```stx
@component('DialogPanel', { className: 'max-w-4xl' })
  @component('DialogTitle')
    Terms and Conditions
  @endcomponent

  <div class="mt-4 max-h-96 overflow-y-auto">
    <!-- Long content -->
  </div>
@endcomponent
```

## Features

- Focus trap
- Backdrop overlay
- Keyboard support (ESC to close)
- Dark mode support
- Accessible (WAI-ARIA)
- Customizable with headwind classes
- Multiple sizes
- Scrollable content support
