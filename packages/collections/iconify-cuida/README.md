# @stx/iconify-cuida

Cuida Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-cuida
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-cuida'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-cuida'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 182 icons from Cuida Icons.

## License

Apache 2.0

License: https://github.com/Sysvale/cuida-icons/blob/main/LICENSE

## Credits

- Icons: Sysvale (https://github.com/Sysvale/cuida-icons)
- Iconify: https://iconify.design/
