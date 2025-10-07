# @stx/iconify-duo-icons

Duoicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-duo-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-duo-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-duo-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 91 icons from Duoicons.

## License

MIT

License: https://github.com/fazdiu/duo-icons/blob/master/LICENSE

## Credits

- Icons: fernandcf (https://github.com/fazdiu/duo-icons)
- Iconify: https://iconify.design/
