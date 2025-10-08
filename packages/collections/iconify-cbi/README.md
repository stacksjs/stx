# @stacksjs/iconify-cbi

Custom Brand Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-cbi
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-cbi'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-cbi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1490 icons from Custom Brand Icons.

## License

CC BY-NC-SA 4.0

License: https://github.com/elax46/custom-brand-icons/blob/main/LICENSE

## Credits

- Icons: Emanuele & rchiileea (https://github.com/elax46/custom-brand-icons)
- Iconify: https://iconify.design/
