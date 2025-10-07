# @stx/iconify-token-branded

Web3 Icons Branded icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-token-branded
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-token-branded'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-token-branded'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2085 icons from Web3 Icons Branded.

## License

MIT

License: https://github.com/0xa3k5/web3icons/blob/main/LICENCE

## Credits

- Icons: 0xa3k5 (https://github.com/0xa3k5/web3icons)
- Iconify: https://iconify.design/
