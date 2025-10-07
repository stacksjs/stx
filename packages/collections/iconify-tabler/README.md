# @stx/iconify-tabler

Tabler Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-tabler
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-tabler'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-tabler'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 6011 icons from Tabler Icons.

## License

MIT

License: https://github.com/tabler/tabler-icons/blob/master/LICENSE

## Credits

- Icons: Paweł Kuna (https://github.com/tabler/tabler-icons)
- Iconify: https://iconify.design/
