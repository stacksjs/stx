# @stacksjs/iconify-bitcoin-icons

Bitcoin Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-bitcoin-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-bitcoin-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-bitcoin-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 250 icons from Bitcoin Icons.

## License

MIT

License: https://github.com/BitcoinDesign/Bitcoin-Icons/blob/main/LICENSE-MIT

## Credits

- Icons: Bitcoin Design Community (https://github.com/BitcoinDesign/Bitcoin-Icons)
- Iconify: https://iconify.design/
