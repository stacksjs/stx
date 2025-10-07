# @stx/iconify-lucide

Lucide icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-lucide
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-lucide'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-lucide'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 3 icons from Lucide.

## License

ISC

License: https://github.com/lucide-icons/lucide/blob/main/LICENSE

## Credits

- Icons: Lucide Contributors (https://github.com/lucide-icons/lucide)
- Iconify: https://iconify.design/
