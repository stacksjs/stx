# @stx/iconify-nrk

NRK Core Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-nrk
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-nrk'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-nrk'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 241 icons from NRK Core Icons.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Norsk rikskringkasting (https://github.com/nrkno/core-icons)
- Iconify: https://iconify.design/
