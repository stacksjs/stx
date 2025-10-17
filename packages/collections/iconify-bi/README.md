# @stacksjs/iconify-bi

Bootstrap Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-bi
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-bi'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-bi'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2084 icons from Bootstrap Icons.

## License

MIT

License: https://github.com/twbs/icons/blob/main/LICENSE.md

## Credits

- Icons: The Bootstrap Authors (https://github.com/twbs/icons)
- Iconify: https://iconify.design/
