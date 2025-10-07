# @stx/iconify-ix

Siemens Industrial Experience Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-ix
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-ix'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-ix'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1418 icons from Siemens Industrial Experience Icons.

## License

MIT

License: https://github.com/siemens/ix-icons/blob/main/LICENSE.md

## Credits

- Icons: Siemens AG (https://github.com/siemens/ix-icons)
- Iconify: https://iconify.design/
