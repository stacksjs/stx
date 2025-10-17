# @stacksjs/iconify-noto

Noto Emoji icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-noto
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-noto'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-noto'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 3800 icons from Noto Emoji.

## License

Apache 2.0

License: https://github.com/googlefonts/noto-emoji/blob/main/svg/LICENSE

## Credits

- Icons: Google Inc (https://github.com/googlefonts/noto-emoji)
- Iconify: https://iconify.design/
