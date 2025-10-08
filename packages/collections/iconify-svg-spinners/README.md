# @stacksjs/iconify-svg-spinners

SVG Spinners icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-svg-spinners
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-svg-spinners'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-svg-spinners'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 46 icons from SVG Spinners.

## License

MIT

License: https://github.com/n3r4zzurr0/svg-spinners/blob/main/LICENSE

## Credits

- Icons: Utkarsh Verma (https://github.com/n3r4zzurr0/svg-spinners)
- Iconify: https://iconify.design/
