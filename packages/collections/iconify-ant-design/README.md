# @stacksjs/iconify-ant-design

Ant Design Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-ant-design
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-ant-design'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-ant-design'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 830 icons from Ant Design Icons.

## License

MIT

License: https://github.com/ant-design/ant-design-icons/blob/master/LICENSE

## Credits

- Icons: HeskeyBaozi (https://github.com/ant-design/ant-design-icons)
- Iconify: https://iconify.design/
