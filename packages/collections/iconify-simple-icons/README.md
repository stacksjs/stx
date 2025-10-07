# @stx/iconify-simple-icons

Simple Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-simple-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-simple-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-simple-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 3594 icons from Simple Icons.

## License

CC0 1.0

License: https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md

## Credits

- Icons: Simple Icons Collaborators (https://github.com/simple-icons/simple-icons)
- Iconify: https://iconify.design/
