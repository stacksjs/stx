# @stacksjs/iconify-cil

CoreUI Free icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-cil
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-cil'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-cil'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 562 icons from CoreUI Free.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: creativeLabs Łukasz Holeczek (https://github.com/coreui/coreui-icons)
- Iconify: https://iconify.design/
