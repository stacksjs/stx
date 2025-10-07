# @stx/iconify-flag

Flag Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-flag
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-flag'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-flag'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 542 icons from Flag Icons.

## License

MIT

License: https://github.com/lipis/flag-icons/blob/main/LICENSE

## Credits

- Icons: Panayiotis Lipiridis (https://github.com/lipis/flag-icons)
- Iconify: https://iconify.design/
