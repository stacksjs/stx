# @stacksjs/iconify-icon-park-solid

IconPark Solid icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-icon-park-solid
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-icon-park-solid'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-icon-park-solid'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1970 icons from IconPark Solid.

## License

Apache 2.0

License: https://github.com/bytedance/IconPark/blob/master/LICENSE

## Credits

- Icons: ByteDance (https://github.com/bytedance/IconPark)
- Iconify: https://iconify.design/
