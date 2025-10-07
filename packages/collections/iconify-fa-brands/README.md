# @stx/iconify-fa-brands

Font Awesome 5 Brands icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fa-brands
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fa-brands'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fa-brands'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 460 icons from Font Awesome 5 Brands.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Dave Gandy (https://github.com/FortAwesome/Font-Awesome)
- Iconify: https://iconify.design/
