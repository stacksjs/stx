# @stx/iconify-hugeicons

Huge Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-hugeicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-hugeicons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-hugeicons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 4583 icons from Huge Icons.

## License

MIT



## Credits

- Icons: Hugeicons (https://icon-sets.iconify.design/icon-sets/hugeicons/)
- Iconify: https://iconify.design/
