# @stx/iconify-akar-icons

Akar Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-akar-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-akar-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-akar-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 458 icons from Akar Icons.

## License

MIT

License: https://github.com/artcoholic/akar-icons/blob/master/LICENSE

## Credits

- Icons: Arturo Wibawa (https://github.com/artcoholic/akar-icons)
- Iconify: https://iconify.design/
