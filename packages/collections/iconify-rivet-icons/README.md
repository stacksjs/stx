# @stacksjs/iconify-rivet-icons

Rivet Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-rivet-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-rivet-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-rivet-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 210 icons from Rivet Icons.

## License

BSD 3-Clause

License: https://github.com/indiana-university/rivet-icons/blob/develop/LICENSE

## Credits

- Icons: Indiana University (https://github.com/indiana-university/rivet-icons)
- Iconify: https://iconify.design/
