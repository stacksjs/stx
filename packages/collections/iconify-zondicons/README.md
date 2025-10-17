# @stacksjs/iconify-zondicons

Zondicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-zondicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-zondicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-zondicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 297 icons from Zondicons.

## License

MIT

License: https://github.com/dukestreetstudio/zondicons/blob/master/LICENSE

## Credits

- Icons: Steve Schoger (https://github.com/dukestreetstudio/zondicons)
- Iconify: https://iconify.design/
