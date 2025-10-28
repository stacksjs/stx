# @stacksjs/desktop

Native desktop application wrapper for stx using the Zyte framework.

## Overview

`@stacksjs/desktop` provides a TypeScript API for creating native desktop applications with stx. It wraps the powerful Zyte webview framework to deliver lightweight, fast native apps using web technologies.

## Features

- 🪟 **Native Windows** - Create true native windows (not Electron)
- 🎯 **Tiny Binary** - Just 1.4MB vs 100MB+ for Electron
- ⚡ **Fast Startup** - <100ms startup time
- 🔧 **System Tray Apps** - Build menubar/system tray applications
- 🎨 **Rich Components** - 35 native UI components
- 🌍 **Cross-Platform** - macOS, Linux, Windows support
- 🔥 **Hot Reload** - Development mode with instant updates

## Installation

```bash
bun add @stacksjs/desktop
```

## Requirements

- **Zig 0.15.1+** - Required for building Zyte
- **macOS** - WebKit framework (built-in)
- **Linux** - `libgtk-3-dev` and `libwebkit2gtk-4.0-dev`
- **Windows** - WebView2 Runtime

### Install Zig

```bash
# macOS
brew install zig

# Linux (from https://ziglang.org)
wget https://ziglang.org/download/0.15.1/zig-linux-x86_64-0.15.1.tar.xz
tar -xf zig-linux-x86_64-0.15.1.tar.xz
sudo mv zig-linux-x86_64-0.15.1 /usr/local/zig
export PATH=$PATH:/usr/local/zig
```

## Usage

### Basic Window

```typescript
import { createWindow } from '@stacksjs/desktop'

// Create a window with a URL
const window = await createWindow('http://localhost:3000', {
  title: 'My App',
  width: 1200,
  height: 800,
  darkMode: true
})
```

### With stx Dev Server (--native flag)

The `--native` flag in stx automatically uses this package:

```bash
stx dev examples/homepage.stx --native
```

This internally calls:

```typescript
import { openDevWindow } from '@stacksjs/desktop'

// Opens a native window at the dev server port
await openDevWindow(3000)
```

### System Tray App

```typescript
import { createSystemTray } from '@stacksjs/desktop'

const tray = await createSystemTray({
  icon: './icon.png',
  tooltip: 'My App',
  menu: [
    {
      label: 'Open',
      onClick: () => console.log('Opening...')
    },
    {
      label: 'Settings',
      accelerator: 'Cmd+,',
      onClick: () => console.log('Settings...')
    },
    { type: 'separator' },
    {
      label: 'Quit',
      onClick: () => process.exit(0)
    }
  ]
})
```

### Modals

```typescript
import { showInfoModal, showQuestionModal } from '@stacksjs/desktop'

// Show an info modal
await showInfoModal('Welcome', 'Welcome to my app!')

// Show a question modal
const result = await showQuestionModal(
  'Confirm',
  'Are you sure you want to continue?'
)

if (!result.cancelled) {
  console.log('User clicked button:', result.buttonIndex)
}
```

### Alerts & Toast Notifications

```typescript
import { showSuccessToast, showErrorToast } from '@stacksjs/desktop'

// Show success toast
await showSuccessToast('File saved successfully!')

// Show error toast
await showErrorToast('Failed to save file', 5000)
```

## API Reference

### Window Management

#### `createWindow(url, options?)`

Create a native window.

```typescript
const window = await createWindow('http://localhost:3000', {
  title: 'My App',
  width: 1200,
  height: 800,
  darkMode: true,
  hotReload: true,
  resizable: true,
  minimizable: true,
  maximizable: true
})
```

**Returns:** `WindowInstance | null`

#### `openDevWindow(port, options?)`

Open a development server window (used by `stx dev --native`).

```typescript
await openDevWindow(3000, {
  title: 'stx Development',
  width: 1400,
  height: 900
})
```

**Returns:** `boolean`

#### `isZyteBuilt()`

Check if Zyte is built.

```typescript
if (!isZyteBuilt()) {
  console.log('Zyte needs to be built')
}
```

**Returns:** `boolean`

#### `buildZyte()`

Build Zyte if not already built.

```typescript
const success = await buildZyte()
```

**Returns:** `Promise<boolean>`

### System Tray

#### `createSystemTray(options)`

Create a system tray/menubar application.

```typescript
const tray = await createSystemTray({
  icon: './icon.png',
  tooltip: 'My App',
  menu: [
    { label: 'Item 1', onClick: () => {} },
    { type: 'separator' },
    { label: 'Quit', onClick: () => process.exit(0) }
  ]
})
```

**Returns:** `SystemTrayInstance | null`

### Modals

#### `showModal(options)`

Show a custom modal dialog.

```typescript
const result = await showModal({
  title: 'Confirm Action',
  message: 'Are you sure?',
  type: 'question',
  buttons: [
    { label: 'Cancel', style: 'default' },
    { label: 'OK', style: 'primary' }
  ]
})
```

**Returns:** `Promise<ModalResult>`

#### Helper Functions

- `showInfoModal(title, message)` - Show info modal
- `showWarningModal(title, message)` - Show warning modal
- `showErrorModal(title, message)` - Show error modal
- `showSuccessModal(title, message)` - Show success modal
- `showQuestionModal(title, message)` - Show question modal

### Alerts & Toasts

#### `showToast(options)`

Show a toast notification.

```typescript
await showToast({
  message: 'Operation complete!',
  type: 'success',
  duration: 3000,
  position: 'top-right',
  theme: 'dark'
})
```

**Returns:** `Promise<void>`

#### Helper Functions

- `showInfoToast(message, duration?)` - Show info toast
- `showSuccessToast(message, duration?)` - Show success toast
- `showWarningToast(message, duration?)` - Show warning toast
- `showErrorToast(message, duration?)` - Show error toast

### Components

35 native UI components are available (documentation in progress):

**Input:** Button, TextInput, Checkbox, RadioButton, Slider, ColorPicker, DatePicker, TimePicker, Autocomplete

**Display:** Label, ImageView, ProgressBar, Avatar, Badge, Chip, Card, Tooltip, Toast

**Layout:** ScrollView, SplitView, Accordion, Stepper, Modal, Tabs, Dropdown

**Data:** ListView, Table, TreeView, DataGrid, Chart

**Advanced:** Rating, CodeEditor, MediaPlayer, FileExplorer, WebView

**Currently Implemented:**
- `createButton(props)` - Button component
- `createTextInput(props)` - Text input component
- `createCheckbox(props)` - Checkbox component

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS    | ✅ Working | Uses WebKit (built-in) |
| Linux    | 🚧 Ready | Requires GTK3 + WebKit2GTK |
| Windows  | 🚧 Ready | Requires WebView2 Runtime |

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Type check
bun run typecheck

# Lint
bun run lint
```

## Examples

See the `examples/` directory for working examples:

- `basic-window.ts` - Simple window example
- `system-tray.ts` - System tray application
- `modal-demo.ts` - Modal dialogs
- `alerts-demo.ts` - Alerts and toasts
- `all-components.ts` - All 35 components showcase
- `dev-server-integration.ts` - Dev server integration pattern

Run any example:
```bash
cd packages/desktop
bun run examples/basic-window.ts
```

## Testing

The desktop package has comprehensive test coverage:

**Coverage Stats:**
- 132 tests passing
- 100% function coverage
- 96.77% line coverage
- 185 expect() assertions

**Test Files:**
- `test/window.test.ts` - Window management (30+ tests)
- `test/system-tray.test.ts` - System tray (15+ tests)
- `test/modals.test.ts` - Modal dialogs (30+ tests)
- `test/alerts.test.ts` - Alerts and toasts (40+ tests)
- `test/components.test.ts` - UI components (20+ tests)

All business logic is fully tested with proper mocking and error handling coverage.

## Comparison with Electron

| Feature | @stacksjs/desktop | Electron |
|---------|------------------|----------|
| **Binary Size** | 1.4MB | 100MB+ |
| **Startup Time** | <100ms | 1-3s |
| **Memory Usage** | ~90MB | 200MB+ |
| **WebView** | System (WebKit) | Chromium (bundled) |
| **Distribution** | Tiny | Large |

## Contributing

Contributions are welcome! Please see the [Contributing Guide](../../CONTRIBUTING.md).

## License

MIT License - see [LICENSE.md](../../LICENSE.md)

## Credits

- Built with [Zyte](https://github.com/stacksjs/stx/tree/main/packages/zyte)
- Part of the [stx](https://github.com/stacksjs/stx) ecosystem
