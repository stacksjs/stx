# @stx/iconify-fontisto

Fontisto icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-fontisto
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-fontisto'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-fontisto'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 615 icons from Fontisto.

## License

MIT

License: https://github.com/kenangundogan/fontisto/blob/master/LICENSE

## Credits

- Icons: Kenan Gündoğan (https://github.com/kenangundogan/fontisto)
- Iconify: https://iconify.design/
