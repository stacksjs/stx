# @stx/iconify-dashicons

Dashicons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-dashicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-dashicons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-dashicons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 345 icons from Dashicons.

## License

GPL

License: https://github.com/WordPress/dashicons/blob/master/gpl.txt

## Credits

- Icons: WordPress (https://github.com/WordPress/dashicons)
- Iconify: https://iconify.design/
