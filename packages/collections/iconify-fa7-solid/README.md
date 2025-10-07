# @stx/iconify-fa7-solid

Font Awesome Solid icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fa7-solid
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fa7-solid'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fa7-solid'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1983 icons from Font Awesome Solid.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Dave Gandy (https://github.com/FortAwesome/Font-Awesome)
- Iconify: https://iconify.design/
