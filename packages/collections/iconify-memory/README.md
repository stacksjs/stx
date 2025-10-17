# @stacksjs/iconify-memory

Memory Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-memory
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-memory'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-memory'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 651 icons from Memory Icons.

## License

Apache 2.0

License: https://github.com/Pictogrammers/Memory/blob/main/LICENSE

## Credits

- Icons: Pictogrammers (https://github.com/Pictogrammers/Memory)
- Iconify: https://iconify.design/
