# @stacksjs/iconify-mynaui

Myna UI Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-mynaui
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-mynaui'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-mynaui'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2562 icons from Myna UI Icons.

## License

MIT

License: https://github.com/praveenjuge/mynaui-icons/blob/main/LICENSE

## Credits

- Icons: Praveen Juge (https://github.com/praveenjuge/mynaui-icons)
- Iconify: https://iconify.design/
