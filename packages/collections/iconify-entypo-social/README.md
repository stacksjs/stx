# @stacksjs/iconify-entypo-social

Entypo+ Social icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-entypo-social
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-entypo-social'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-entypo-social'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 76 icons from Entypo+ Social.

## License

CC BY-SA 4.0

License: https://creativecommons.org/licenses/by-sa/4.0/

## Credits

- Icons: Daniel Bruce (https://github.com/chancancode/entypo-plus)
- Iconify: https://iconify.design/
