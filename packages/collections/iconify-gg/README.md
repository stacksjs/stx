# @stx/iconify-gg

css.gg icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-gg
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-gg'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-gg'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 704 icons from css.gg.

## License

MIT

License: https://github.com/astrit/css.gg/blob/master/LICENSE

## Credits

- Icons: Astrit (https://github.com/astrit/css.gg)
- Iconify: https://iconify.design/
