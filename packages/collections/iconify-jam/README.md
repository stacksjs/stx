# @stacksjs/iconify-jam

Jam Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-jam
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-jam'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-jam'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 940 icons from Jam Icons.

## License

MIT

License: https://github.com/cyberalien/jam-backup/blob/main/LICENSE

## Credits

- Icons: Michael Amprimo (https://github.com/michaelampr)
- Iconify: https://iconify.design/
