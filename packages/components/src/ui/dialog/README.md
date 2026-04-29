# Dialog Component

A modal dialog component for overlays, alerts, and confirmations. Built with STX and headwind.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
let isOpen = false

function closeModal() {
  isOpen = false
}

function openModal() {
  isOpen = true
}
</script>

<Dialog :open="isOpen" :onClose="closeModal">
  <DialogBackdrop />

  <DialogPanel className="max-w-md">
    <DialogTitle>Payment successful</DialogTitle>

    <DialogDescription>
      Your payment has been successfully submitted.
    </DialogDescription>

    <div class="mt-4">
      <Button :onClick="closeModal">Got it, thanks!</Button>
    </div>
  </DialogPanel>
</Dialog>
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
<Dialog :open="isOpen" :onClose="closeModal">
  <DialogBackdrop />

  <DialogPanel className="max-w-md">
    <DialogTitle>Delete account</DialogTitle>

    <DialogDescription>
      Are you sure you want to delete your account? This action cannot be undone.
    </DialogDescription>

    <div class="mt-4 flex gap-2">
      <Button variant="danger" :onClick="handleDelete">Delete</Button>
      <Button variant="secondary" :onClick="closeModal">Cancel</Button>
    </div>
  </DialogPanel>
</Dialog>
```

### Large Dialog

```stx
<DialogPanel className="max-w-4xl">
  <DialogTitle>Terms and Conditions</DialogTitle>

  <div class="mt-4 max-h-96 overflow-y-auto">
    <!-- Long content -->
  </div>
</DialogPanel>
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
