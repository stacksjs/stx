# Transition Component

Smooth enter/leave transitions for showing and hiding content.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
let isOpen = true
</script>

<Transition :show="isOpen">
  <div class="p-4 bg-white rounded-lg shadow-lg">
    Content with fade transition
  </div>
</Transition>
```

## Features

- Enter/leave animations
- Customizable transition classes
- Dark mode support
- Headwind utility classes
