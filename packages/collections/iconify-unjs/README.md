# @stacksjs/iconify-unjs

UnJS Logos icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-unjs
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-unjs'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-unjs'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 63 icons from UnJS Logos.

## License

Apache 2.0



## Credits

- Icons: UnJS (https://github.com/unjs)
- Iconify: https://iconify.design/
