# @stx/iconify-uiw

uiw icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-uiw
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-uiw'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-uiw'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 214 icons from uiw icons.

## License

MIT

License: https://github.com/uiwjs/icons/blob/master/LICENSE

## Credits

- Icons: liwen0526 (https://github.com/uiwjs/icons)
- Iconify: https://iconify.design/
