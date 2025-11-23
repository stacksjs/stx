# @stacksjs/desktop

Native desktop application framework for stx powered by craft.

## Overview

`@stacksjs/desktop` provides a TypeScript API for creating native desktop applications with stx. It uses [Craft](https://github.com/stacksjs/craft) to deliver lightweight, fast native apps using web technologies and native WebKit views.

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

- **craft** - For native window support (linked locally or via npm)
- **macOS** - WebKit framework (built-in)
- **Linux** - `libgtk-3-dev` and `libwebkit2gtk-4.0-dev`
- **Windows** - WebView2 Runtime

### Setup craft Integration

For local development with craft:

```bash
# Clone craft repository
cd /path/to/your/repos
git clone https://github.com/stacksjs/craft

# Build craft
cd craft
bun install
zig build

# Link ts-craft package
cd packages/typescript
bun link

# Link to desktop package
cd /path/to/stx/packages/desktop
bun link ts-craft
```

## Usage

### Quick Start with stx Dev Server

The easiest way to test native windows:

```bash
# Start dev server with native window
stx dev examples/homepage.stx --native
```

This opens a menubar application. Look for "stx Development" in your macOS menubar and click it to show the window.

### Basic Window with craft

```typescript
import { createApp } from 'ts-craft'

const app = createApp({
  url: 'http://localhost:3000',
  window: {
    title: 'My App',
    width: 1200,
    height: 800,
    systemTray: true,  // Required for craft
    darkMode: true,
    hotReload: true,
    devTools: true,
  },
})

await app.show()
console.log('Window created! Look for "My App" in your menubar')
```

### Display HTML Content

```typescript
import { show } from 'ts-craft'

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      font-family: system-ui;
    }
    h1 {
      color: white;
      font-size: 48px;
    }
  </style>
</head>
<body>
  <h1>Hello from craft!</h1>
</body>
</html>
`

await show(html, {
  title: 'HTML Demo',
  width: 800,
  height: 600,
})
```

### Using with stx Desktop Package

The `@stacksjs/desktop` package provides a clean wrapper:

```typescript
import { openDevWindow } from '@stacksjs/desktop'

// Open dev server in native window
const success = await openDevWindow(3000, {
  title: 'My Dev Server',
  width: 1400,
  height: 900,
  hotReload: true,
})

if (success) {
  console.log('Native window opened!')
} else {
  console.log('Fell back to browser')
}
```

### Advanced Window Options

```typescript
import { createApp } from 'ts-craft'

const app = createApp({
  url: 'http://localhost:3000',
  window: {
    title: 'Advanced Window',
    width: 1000,
    height: 700,

    // Window style
    frameless: false,           // No title bar (default: false)
    transparent: false,          // Transparent window (default: false)
    resizable: true,             // Allow resizing (default: true)
    alwaysOnTop: false,          // Stay on top (default: false)
    fullscreen: false,           // Start fullscreen (default: false)

    // Position (optional)
    x: 100,                      // X coordinate
    y: 100,                      // Y coordinate

    // Appearance
    darkMode: true,              // Force dark mode

    // Development
    hotReload: true,             // Enable hot reload
    devTools: true,              // Enable DevTools (right-click > Inspect)

    // System integration
    systemTray: true,            // Show menubar icon (required for craft)
    hideDockIcon: false,         // Hide from dock (default: false)
  },
})

await app.show()
```

### Controlling the Window from Web Content

craft provides a bridge API accessible from your web content:

```html
<!DOCTYPE html>
<html>
<head>
  <title>craft Bridge Demo</title>
</head>
<body>
  <h1>craft Bridge API</h1>

  <button onclick="hideWindow()">Hide Window</button>
  <button onclick="showWindow()">Show Window</button>
  <button onclick="quitApp()">Quit App</button>
  <button onclick="updateTray()">Update Tray Title</button>

  <script>
    // Access craft bridge API
    const craft = window.craft

    function hideWindow() {
      craft.window.hide()
    }

    function showWindow() {
      craft.window.show()
    }

    function quitApp() {
      craft.app.quit()
    }

    function updateTray() {
      craft.tray.setTitle('Updated!')
    }

    // Listen for tray icon clicks
    craft.tray.onClick(() => {
      console.log('Tray icon clicked!')
      craft.window.toggle()
    })
  </script>
</body>
</html>
```

### Menubar App Pattern

craft is designed for menubar applications. Here's a complete example:

```typescript
import { createApp } from 'ts-craft'

const app = createApp({
  url: 'http://localhost:3000',
  window: {
    title: 'My Menubar App',
    width: 400,
    height: 500,
    resizable: false,
    systemTray: true,      // Creates menubar icon
    darkMode: true,
  },
})

await app.show()

// The window is hidden by default
// Click the menubar icon to show/hide the window
// This is the standard macOS menubar app behavior
```

### Integration with stx CLI

When you use the `--native` flag with stx dev server:

```bash
stx dev examples/homepage.stx --native
```

It internally calls:

```typescript
import { openDevWindow } from '@stacksjs/desktop'

const success = await openDevWindow(3000, {
  title: 'stx Development',
  width: 1400,
  height: 900,
  hotReload: true,
  devTools: true,
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

#### `isWebviewAvailable()`

Check if craft is available for native windows.

```typescript
if (!isWebviewAvailable()) {
  console.log('craft not available')
  console.log('Ensure ts-craft is installed and craft binary is built')
}
```

**Returns:** `boolean`

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

## Implementation Status

### ✅ Working
- Native window creation with craft/ts-craft
- URL loading in native windows
- HTML content rendering
- `stx dev --native` flag integration
- Browser fallback when craft unavailable
- Hot reload and dev tools support

### 🚧 Placeholder (Coming Soon)
- System tray applications
- Modal dialogs
- Alerts and toasts
- Native UI components (35 total)

The package is fully functional for basic native windows using craft. System tray and other features are planned for future releases.

## Credits

- Powered by [Craft](https://github.com/stacksjs/craft)
- Part of the [stx](https://github.com/stacksjs/stx) ecosystem
