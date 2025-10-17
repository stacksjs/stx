# @stacksjs/iconify-gis

Font-GIS icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-gis
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-gis'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-gis'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 367 icons from Font-GIS.

## License

CC BY 4.0

License: https://github.com/Viglino/font-gis/blob/main/LICENSE-CC-BY.md

## Credits

- Icons: Jean-Marc Viglino (https://github.com/viglino/font-gis)
- Iconify: https://iconify.design/
