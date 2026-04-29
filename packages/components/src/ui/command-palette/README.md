# Command Palette Component

A searchable command menu for quick actions and navigation.

## Installation

```bash
bun add @stacksjs/components
```

## Usage

```stx
<script server>
let open = false
let query = ''

const commands = [
  { name: 'Create new file', action: () => console.log('create') },
  { name: 'Open settings', action: () => console.log('settings') }
]

const filtered = query === ''
  ? commands
  : commands.filter(cmd => cmd.name.toLowerCase().includes(query.toLowerCase()))
</script>

<CommandPalette :open="open" :onClose="() => open = false" :query="query" :onQueryChange="(q) => query = q">
  @foreach(command in filtered)
    <CommandPaletteItem :onClick="command.action">
      {{ command.name }}
    </CommandPaletteItem>
  @endforeach
</CommandPalette>
```

## Features

- Searchable
- Keyboard navigation
- Dark mode support
- Accessible
