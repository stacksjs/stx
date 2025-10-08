# @stacksjs/iconify-line-md

Material Line Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-line-md
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-line-md'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-line-md'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 1093 icons from Material Line Icons.

## License

MIT

License: https://github.com/cyberalien/line-md/blob/master/license.txt

## Credits

- Icons: Vjacheslav Trushkin (https://github.com/cyberalien/line-md)
- Iconify: https://iconify.design/
