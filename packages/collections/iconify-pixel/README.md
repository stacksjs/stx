# @stx/iconify-pixel

Pixel Icon icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-pixel
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-pixel'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-pixel'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 450 icons from Pixel Icon.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: HackerNoon (https://github.com/hackernoon/pixel-icon-library)
- Iconify: https://iconify.design/
