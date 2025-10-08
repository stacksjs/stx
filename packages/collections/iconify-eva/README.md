# @stacksjs/iconify-eva

Eva Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-eva
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-eva'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-eva'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 490 icons from Eva Icons.

## License

MIT

License: https://github.com/akveo/eva-icons/blob/master/LICENSE.txt

## Credits

- Icons: Akveo (https://github.com/akveo/eva-icons/)
- Iconify: https://iconify.design/
