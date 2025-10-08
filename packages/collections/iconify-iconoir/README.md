# @stacksjs/iconify-iconoir

Iconoir icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-iconoir
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-iconoir'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-iconoir'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1682 icons from Iconoir.

## License

MIT

License: https://github.com/iconoir-icons/iconoir/blob/main/LICENSE

## Credits

- Icons: Luca Burgio (https://github.com/iconoir-icons/iconoir)
- Iconify: https://iconify.design/
