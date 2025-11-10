# Transition Component

Smooth enter/leave transitions for showing and hiding content.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export let isOpen = true
</script>

@component('Transition', { show: isOpen })
  <div class="p-4 bg-white rounded-lg shadow-lg">
    Content with fade transition
  </div>
@endcomponent
```

## Features

- Enter/leave animations
- Customizable transition classes
- Dark mode support
- Headwind utility classes
