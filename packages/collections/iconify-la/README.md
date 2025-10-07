# @stx/iconify-la

Line Awesome icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-la
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-la'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-la'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1544 icons from Line Awesome.

## License

Apache 2.0

License: https://www.apache.org/licenses/LICENSE-2.0

## Credits

- Icons: Icons8 (https://github.com/icons8/line-awesome)
- Iconify: https://iconify.design/
