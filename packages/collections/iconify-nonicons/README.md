# @stacksjs/iconify-nonicons

Nonicons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-nonicons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-nonicons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-nonicons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 69 icons from Nonicons.

## License

MIT

License: https://github.com/yamatsum/nonicons/blob/master/LICENSE

## Credits

- Icons: yamatsum (https://github.com/yamatsum/nonicons)
- Iconify: https://iconify.design/
