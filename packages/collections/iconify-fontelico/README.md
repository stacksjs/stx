# @stacksjs/iconify-fontelico

Fontelico icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-fontelico
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-fontelico'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-fontelico'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 34 icons from Fontelico.

## License

CC BY SA

License: https://creativecommons.org/licenses/by-sa/3.0/

## Credits

- Icons: Fontello (https://github.com/fontello/fontelico.font)
- Iconify: https://iconify.design/
