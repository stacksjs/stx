# @stx/iconify-lets-icons

Lets Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-lets-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-lets-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-lets-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1544 icons from Lets Icons.

## License

CC BY 4.0

License: https://creativecommons.org/licenses/by/4.0/

## Credits

- Icons: Leonid Tsvetkov (https://www.figma.com/community/file/886554014393250663)
- Iconify: https://iconify.design/
