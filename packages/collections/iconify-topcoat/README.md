# @stx/iconify-topcoat

TopCoat Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-topcoat
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-topcoat'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-topcoat'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 89 icons from TopCoat Icons.

## License

Apache 2.0

License: https://github.com/topcoat/icons/blob/master/LICENSE

## Credits

- Icons: TopCoat (https://github.com/topcoat/icons)
- Iconify: https://iconify.design/
