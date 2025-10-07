# @stx/iconify-flagpack

Flagpack icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-flagpack
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-flagpack'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-flagpack'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 256 icons from Flagpack.

## License

MIT

License: https://github.com/Yummygum/flagpack-core/blob/main/LICENSE

## Credits

- Icons: Yummygum (https://github.com/Yummygum/flagpack-core)
- Iconify: https://iconify.design/
