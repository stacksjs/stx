# @stacksjs/iconify-fxemoji

Firefox OS Emoji icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-fxemoji
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-fxemoji'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-fxemoji'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1034 icons from Firefox OS Emoji.

## License

Apache 2.0

License: https://mozilla.github.io/fxemoji/LICENSE.md

## Credits

- Icons: Mozilla (https://github.com/mozilla/fxemoji)
- Iconify: https://iconify.design/
