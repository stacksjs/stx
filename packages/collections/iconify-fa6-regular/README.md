# @stacksjs/iconify-fa6-regular

Font Awesome 6 Regular icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-fa6-regular
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-fa6-regular'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-fa6-regular'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 164 icons from Font Awesome 6 Regular.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Dave Gandy (https://github.com/FortAwesome/Font-Awesome)
- Iconify: https://iconify.design/
