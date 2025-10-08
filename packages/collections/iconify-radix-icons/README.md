# @stacksjs/iconify-radix-icons

Radix Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-radix-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-radix-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-radix-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 342 icons from Radix Icons.

## License

MIT

License: https://github.com/radix-ui/icons/blob/master/LICENSE

## Credits

- Icons: WorkOS (https://github.com/radix-ui/icons)
- Iconify: https://iconify.design/
