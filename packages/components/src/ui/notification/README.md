# Notification Component

Toast notifications for user feedback and alerts.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
let showNotification = true

function closeNotification() {
  showNotification = false
}
</script>

<Notification
  :show="showNotification"
  title="Success!"
  message="Your changes have been saved."
  type="success"
  :onClose="closeNotification"
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `true` | Whether notification is visible |
| `title` | `string` | `''` | Notification title |
| `message` | `string` | `''` | Notification message |
| `type` | `'info' \| 'success' \| 'warning' \| 'error'` | `'info'` | Notification type |
| `position` | `'top-left' \| 'top-right' \| 'top-center' \| 'bottom-left' \| 'bottom-right' \| 'bottom-center'` | `'top-right'` | Position on screen |
| `duration` | `number` | `5000` | Auto-hide duration (0 = no auto-hide) |
| `onClose` | `() => void` | - | Close handler |
| `className` | `string` | `''` | Additional CSS classes |

## Examples

### Types

```stx
<Notification type="info" title="Information" message="This is an info message" />

<Notification type="success" title="Success" message="Operation completed" />

<Notification type="warning" title="Warning" message="Please be careful" />

<Notification type="error" title="Error" message="Something went wrong" />
```

### Positions

```stx
<Notification position="top-left" title="Top Left" />
<Notification position="top-center" title="Top Center" />
<Notification position="bottom-right" title="Bottom Right" />
```

### No Auto-Hide

```stx
<Notification
  :duration="0"
  title="Important"
  message="This will not auto-hide"
/>
```

### Custom Content

```stx
<Notification type="info">
  <div class="flex items-start gap-3">
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <p class="font-medium">Custom notification</p>
      <p class="mt-1 text-sm">With custom content and layout</p>
    </div>
  </div>
</Notification>
```

### With Actions

```stx
<Notification type="info" title="New message">
  <p>You have a new message from John</p>
  <div class="mt-3 flex gap-2">
    <Button size="sm" variant="primary">View</Button>
    <Button size="sm" variant="ghost">Dismiss</Button>
  </div>
</Notification>
```

## Features

- 4 types (info, success, warning, error)
- 6 position options
- Auto-hide with configurable duration
- Dark mode support
- Accessible (WAI-ARIA)
- Close button
- Custom content support
- Smooth transitions
- Customizable styling
