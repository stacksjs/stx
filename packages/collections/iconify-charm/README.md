# @stacksjs/iconify-charm

Charm Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-charm
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-charm'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-charm'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 262 icons from Charm Icons.

## License

MIT

License: https://github.com/jaynewey/charm-icons/blob/main/LICENSE

## Credits

- Icons: Jay Newey (https://github.com/jaynewey/charm-icons)
- Iconify: https://iconify.design/
