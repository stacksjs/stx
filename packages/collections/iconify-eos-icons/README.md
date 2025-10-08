# @stacksjs/iconify-eos-icons

EOS Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-eos-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-eos-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-eos-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 253 icons from EOS Icons.

## License

MIT

License: https://gitlab.com/SUSE-UIUX/eos-icons/-/blob/master/LICENSE

## Credits

- Icons: SUSE UX/UI team (https://gitlab.com/SUSE-UIUX/eos-icons)
- Iconify: https://iconify.design/
