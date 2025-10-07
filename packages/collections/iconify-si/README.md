# @stx/iconify-si

Sargam Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-si
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-si'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-si'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1188 icons from Sargam Icons.

## License

MIT

License: https://github.com/planetabhi/sargam-icons/blob/main/LICENSE.txt

## Credits

- Icons: Abhimanyu Rana (https://github.com/planetabhi/sargam-icons)
- Iconify: https://iconify.design/
