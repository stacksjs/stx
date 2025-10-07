# @stx/iconify-grommet-icons

Grommet Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-grommet-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-grommet-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-grommet-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 635 icons from Grommet Icons.

## License

Apache 2.0

License: https://www.apache.org/licenses/LICENSE-2.0

## Credits

- Icons: Grommet (https://github.com/grommet/grommet-icons)
- Iconify: https://iconify.design/
