# @stacksjs/iconify-cryptocurrency

Cryptocurrency Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-cryptocurrency
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-cryptocurrency'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-cryptocurrency'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 483 icons from Cryptocurrency Icons.

## License

CC0 1.0

License: https://creativecommons.org/publicdomain/zero/1.0/

## Credits

- Icons: Christopher Downer (https://github.com/atomiclabs/cryptocurrency-icons)
- Iconify: https://iconify.design/
