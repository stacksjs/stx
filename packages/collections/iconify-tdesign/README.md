# @stacksjs/iconify-tdesign

TDesign Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-tdesign
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-tdesign'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-tdesign'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 2138 icons from TDesign Icons.

## License

MIT

License: https://github.com/Tencent/tdesign-icons/blob/main/LICENSE

## Credits

- Icons: TDesign (https://github.com/Tencent/tdesign-icons)
- Iconify: https://iconify.design/
