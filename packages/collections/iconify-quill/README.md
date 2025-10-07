# @stx/iconify-quill

Quill Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-quill
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-quill'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-quill'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 141 icons from Quill Icons.

## License

MIT

License: https://github.com/yourtempo/tempo-quill-icons/blob/main/LICENSE

## Credits

- Icons: Casper Lourens (https://www.figma.com/community/file/1034432054377533052/Quill-Iconset)
- Iconify: https://iconify.design/
