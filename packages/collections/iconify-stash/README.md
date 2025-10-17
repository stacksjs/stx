# @stacksjs/iconify-stash

Stash Icons icons for stx from Iconify.

## Installation

```bash
bun add @stacksjs/iconify-stash
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stacksjs/iconify-stash'
  import { renderIcon } from '@stacksjs/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stacksjs/iconify-stash'
import { renderIcon } from '@stacksjs/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 982 icons from Stash Icons.

## License

MIT

License: https://github.com/stash-ui/icons/blob/master/LICENSE

## Credits

- Icons: Pingback LLC (https://github.com/stash-ui/icons)
- Iconify: https://iconify.design/
