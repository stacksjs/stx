# @stx/iconify-ps

PrestaShop Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-ps
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-ps'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-ps'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 479 icons from PrestaShop Icons.

## License

CC BY-NC 4.0

License: https://creativecommons.org/licenses/by-nc/4.0/

## Credits

- Icons: PrestaShop (https://github.com/PrestaShop/prestashop-icon-font)
- Iconify: https://iconify.design/
