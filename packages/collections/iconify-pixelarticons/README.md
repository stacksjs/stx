# @stacksjs/iconify-pixelarticons

Pixelarticons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-pixelarticons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-pixelarticons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-pixelarticons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 486 icons from Pixelarticons.

## License

MIT

License: https://github.com/halfmage/pixelarticons/blob/master/LICENSE

## Credits

- Icons: Gerrit Halfmann (https://github.com/halfmage/pixelarticons)
- Iconify: https://iconify.design/
