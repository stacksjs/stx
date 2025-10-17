# @stacksjs/iconify-marketeq

Marketeq icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-marketeq
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-marketeq'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-marketeq'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 590 icons from Marketeq.

## License

MIT



## Credits

- Icons: Marketeq
- Iconify: https://iconify.design/
