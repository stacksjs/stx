# @stx/iconify-maki

Maki icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-maki
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-maki'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-maki'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 418 icons from Maki.

## License

CC0

License: https://creativecommons.org/publicdomain/zero/1.0/

## Credits

- Icons: Mapbox (https://github.com/mapbox/maki)
- Iconify: https://iconify.design/
