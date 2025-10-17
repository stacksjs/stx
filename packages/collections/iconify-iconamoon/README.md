# @stacksjs/iconify-iconamoon

IconaMoon icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-iconamoon
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-iconamoon'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-iconamoon'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1781 icons from IconaMoon.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Dariush Habibpour (https://github.com/dariushhpg1/IconaMoon)
- Iconify: https://iconify.design/
