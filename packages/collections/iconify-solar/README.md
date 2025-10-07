# @stx/iconify-solar

Solar icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-solar
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-solar'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-solar'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 7404 icons from Solar.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: 480 Design (https://www.figma.com/community/file/1166831539721848736)
- Iconify: https://iconify.design/
