# @stx/iconify-flat-color-icons

Flat Color Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-flat-color-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-flat-color-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-flat-color-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 329 icons from Flat Color Icons.

## License

MIT



## Credits

- Icons: Icons8 (https://github.com/icons8/flat-Color-icons)
- Iconify: https://iconify.design/
