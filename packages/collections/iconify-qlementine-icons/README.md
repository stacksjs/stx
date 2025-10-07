# @stx/iconify-qlementine-icons

Qlementine Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-qlementine-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-qlementine-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-qlementine-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 757 icons from Qlementine Icons.

## License

MIT

License: https://github.com/oclero/qlementine-icons/blob/master/LICENSE

## Credits

- Icons: Olivier Cléro (https://github.com/oclero/qlementine-icons)
- Iconify: https://iconify.design/
