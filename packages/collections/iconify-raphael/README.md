# @stacksjs/iconify-raphael

Raphael icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-raphael
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-raphael'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-raphael'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 266 icons from Raphael.

## License

MIT



## Credits

- Icons: Dmitry Baranovskiy (https://github.com/dmitrybaranovskiy/raphael)
- Iconify: https://iconify.design/
