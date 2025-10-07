# @stx/iconify-game-icons

Game Icons icons for stx from Iconify.

## Installation

```bash
bun add @stx/iconify-game-icons
```

## Usage

### In stx templates

```html
<script>
  import { home } from '@stx/iconify-game-icons'
  import { renderIcon } from '@stx/iconify-core'

  export const homeIcon = renderIcon(home, { size: 24, color: 'currentColor' })
</script>

<div class="icon">
  {!! homeIcon !!}
</div>
```

### In TypeScript/JavaScript

```typescript
import { home, account, settings } from '@stx/iconify-game-icons'
import { renderIcon } from '@stx/iconify-core'

const svg = renderIcon(home, {
  size: 24,
  color: '#000000',
})
```

## Available Icons

This package contains 4123 icons from Game Icons.

## License

CC BY 3.0

License: https://github.com/game-icons/icons/blob/master/license.txt

## Credits

- Icons: GameIcons (https://github.com/game-icons/icons)
- Iconify: https://iconify.design/
