# @stacksjs/iconify-flat-ui

Flat UI Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-flat-ui
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-flat-ui'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-flat-ui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 100 icons from Flat UI Icons.

## License

MIT

License: https://github.com/designmodo/Flat-UI/blob/master/LICENSE

## Credits

- Icons: Designmodo, Inc. (https://github.com/designmodo/Flat-UI)
- Iconify: https://iconify.design/
