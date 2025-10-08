# @stacksjs/iconify-foundation

Foundation icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-foundation
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-foundation'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-foundation'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 283 icons from Foundation.

## License

MIT



## Credits

- Icons: Zurb (https://github.com/zurb/foundation-icon-fonts)
- Iconify: https://iconify.design/
