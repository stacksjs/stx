# @stx/iconify-brandico

Brandico icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-brandico
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-brandico'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-brandico'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 45 icons from Brandico.

## License

CC BY SA

License: https://creativecommons.org/licenses/by-sa/3.0/

## Credits

- Icons: Fontello (https://github.com/fontello/brandico.font)
- Iconify: https://iconify.design/
