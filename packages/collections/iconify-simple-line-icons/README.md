# @stacksjs/iconify-simple-line-icons

Simple line icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-simple-line-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-simple-line-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-simple-line-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 194 icons from Simple line icons.

## License

MIT

License: https://github.com/thesabbir/simple-line-icons/blob/master/LICENSE.md

## Credits

- Icons: Sabbir Ahmed (https://github.com/thesabbir/simple-line-icons)
- Iconify: https://iconify.design/
