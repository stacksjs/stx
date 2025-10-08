# @stacksjs/iconify-ep

Element Plus icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-ep
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-ep'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-ep'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 293 icons from Element Plus.

## License

MIT

License: https://github.com/element-plus/element-plus-icons/blob/main/packages/svg/package.json

## Credits

- Icons: Element Plus (https://github.com/element-plus/element-plus-icons)
- Iconify: https://iconify.design/
