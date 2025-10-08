# @stacksjs/iconify-cib

CoreUI Brands icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-cib
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-cib'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-cib'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 830 icons from CoreUI Brands.

## License

CC0 1.0

License: https://creativecommons.org/publicdomain/zero/1.0/

## Credits

- Icons: creativeLabs Łukasz Holeczek (https://github.com/coreui/coreui-icons)
- Iconify: https://iconify.design/
