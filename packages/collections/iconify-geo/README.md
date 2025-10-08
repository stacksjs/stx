# @stacksjs/iconify-geo

GeoGlyphs icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-geo
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-geo'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-geo'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 30 icons from GeoGlyphs.

## License

MIT

License: https://github.com/cugos/geoglyphs/blob/main/LICENSE.md

## Credits

- Icons: Sam Matthews (https://github.com/cugos/geoglyphs)
- Iconify: https://iconify.design/
