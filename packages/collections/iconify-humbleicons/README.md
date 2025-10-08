# @stacksjs/iconify-humbleicons

Humbleicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-humbleicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-humbleicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-humbleicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 269 icons from Humbleicons.

## License

MIT

License: https://github.com/zraly/humbleicons/blob/master/license

## Credits

- Icons: Jiří Zralý (https://github.com/zraly/humbleicons)
- Iconify: https://iconify.design/
