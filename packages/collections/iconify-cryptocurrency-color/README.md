# @stx/iconify-cryptocurrency-color

Cryptocurrency Color Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-cryptocurrency-color
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-cryptocurrency-color'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-cryptocurrency-color'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 483 icons from Cryptocurrency Color Icons.

## License

CC0 1.0

License: https://creativecommons.org/publicdomain/zero/1.0/

## Credits

- Icons: Christopher Downer (https://github.com/atomiclabs/cryptocurrency-icons)
- Iconify: https://iconify.design/
