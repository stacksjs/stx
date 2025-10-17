# @stacksjs/iconify-meteor-icons

Meteor Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-meteor-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-meteor-icons'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-meteor-icons'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 321 icons from Meteor Icons.

## License

MIT

License: https://github.com/zkreations/icons/blob/main/LICENSE

## Credits

- Icons: zkreations (https://github.com/zkreations/icons)
- Iconify: https://iconify.design/
