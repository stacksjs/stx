# @stacksjs/iconify-logos

SVG Logos icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-logos
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-logos'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-logos'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2063 icons from SVG Logos.

## License

CC0

License: https://raw.githubusercontent.com/gilbarbara/logos/master/LICENSE.txt

## Credits

- Icons: Gil Barbara (https://github.com/gilbarbara/logos)
- Iconify: https://iconify.design/
