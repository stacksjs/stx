# Command Palette Component

A searchable command menu for quick actions and navigation.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script>
export let open = false
export let query = ''

const commands = [
  { name: 'Create new file', action: () => console.log('create') },
  { name: 'Open settings', action: () => console.log('settings') }
]

export const filtered = query === ''
  ? commands
  : commands.filter(cmd => cmd.name.toLowerCase().includes(query.toLowerCase()))
</script>

@component('CommandPalette', { open, onClose: () => open = false, query, onQueryChange: (q) => query = q })
  @foreach(command in filtered)
    @component('CommandPaletteItem', { onClick: command.action })
      {{ command.name }}
    @endcomponent
  @endforeach
@endcomponent
```

## Features

- Searchable
- Keyboard navigation
- Dark mode support
- Accessible
