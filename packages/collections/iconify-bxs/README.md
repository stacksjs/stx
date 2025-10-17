# @stacksjs/iconify-bxs

BoxIcons Solid icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-bxs
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-bxs'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-bxs'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 665 icons from BoxIcons Solid.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Atisa (https://github.com/atisawd/boxicons)
- Iconify: https://iconify.design/
