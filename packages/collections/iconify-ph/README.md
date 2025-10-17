# @stacksjs/iconify-ph

Phosphor icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-ph
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-ph'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-ph'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 9161 icons from Phosphor.

## License

MIT

License: https://github.com/phosphor-icons/core/blob/main/LICENSE

## Credits

- Icons: Phosphor Icons (https://github.com/phosphor-icons/core)
- Iconify: https://iconify.design/
