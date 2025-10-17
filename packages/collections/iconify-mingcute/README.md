# @stacksjs/iconify-mingcute

MingCute Icon icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-mingcute
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-mingcute'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-mingcute'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 3098 icons from MingCute Icon.

## License

Apache 2.0

License: https://github.com/Richard9394/MingCute/blob/main/LICENSE

## Credits

- Icons: MingCute Design (https://github.com/Richard9394/MingCute)
- Iconify: https://iconify.design/
