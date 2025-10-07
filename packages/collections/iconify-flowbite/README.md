# @stx/iconify-flowbite

Flowbite Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-flowbite
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-flowbite'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-flowbite'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 804 icons from Flowbite Icons.

## License

MIT

License: https://github.com/themesberg/flowbite-icons/blob/main/LICENSE

## Credits

- Icons: Themesberg (https://github.com/themesberg/flowbite-icons)
- Iconify: https://iconify.design/
