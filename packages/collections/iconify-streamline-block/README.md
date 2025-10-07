# @stx/iconify-streamline-block

Streamline Block icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-streamline-block
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-streamline-block'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-streamline-block'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 300 icons from Streamline Block.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Streamline (https://github.com/webalys-hq/streamline-vectors)
- Iconify: https://iconify.design/
