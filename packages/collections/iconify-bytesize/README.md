# @stx/iconify-bytesize

Bytesize Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-bytesize
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-bytesize'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-bytesize'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 102 icons from Bytesize Icons.

## License

MIT

License: https://github.com/danklammer/bytesize-icons/blob/master/LICENSE.md

## Credits

- Icons: Dan Klammer (https://github.com/danklammer/bytesize-icons)
- Iconify: https://iconify.design/
