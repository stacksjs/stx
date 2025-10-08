# @stacksjs/iconify-emojione-monotone

Emoji One (Monotone) icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-emojione-monotone
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-emojione-monotone'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-emojione-monotone'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1403 icons from Emoji One (Monotone).

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Emoji One (https://github.com/EmojiTwo/emojitwo)
- Iconify: https://iconify.design/
