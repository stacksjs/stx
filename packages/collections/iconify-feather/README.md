# @stacksjs/iconify-feather

Feather Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-feather
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-feather'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-feather'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 286 icons from Feather Icons.

## License

MIT

License: https://github.com/feathericons/feather/blob/master/LICENSE

## Credits

- Icons: Cole Bemis (https://github.com/feathericons/feather)
- Iconify: https://iconify.design/
