# @stacksjs/iconify-weui

WeUI Icon icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-weui
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-weui'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-weui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 162 icons from WeUI Icon.

## License

MIT



## Credits

- Icons: WeUI (https://github.com/weui/weui-icon)
- Iconify: https://iconify.design/
