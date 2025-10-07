# @stx/iconify-basil

Basil icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-basil
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-basil'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-basil'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 496 icons from Basil.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Craftwork (https://www.figma.com/community/file/931906394678748246)
- Iconify: https://iconify.design/
