# @stacksjs/iconify-entypo

Entypo+ icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-entypo
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-entypo'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-entypo'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 321 icons from Entypo+.

## License

CC BY-SA 4.0

License: https://creativecommons.org/licenses/by-sa/4.0/

## Credits

- Icons: Daniel Bruce (https://github.com/chancancode/entypo-plus)
- Iconify: https://iconify.design/
