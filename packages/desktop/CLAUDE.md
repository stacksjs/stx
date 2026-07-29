# Desktop Applications (`@stacksjs/desktop`)

The `@stacksjs/desktop` package provides native desktop application support. This file loads only when working under `packages/desktop/`.

## Architecture

```
@stacksjs/desktop (TypeScript API)
    ↓
Craft (~/Code/craft - Zig webview implementation)
    ↓
Native APIs (WebKit/GTK/WebView2)
```

**Note**: The desktop package uses Craft for native webview rendering. Craft source lives at `~/Code/craft` (an external dependency — a Zig-based native webview framework for desktop/mobile apps).

## Usage

```bash
# Open native window with dev server
stx dev examples/homepage.stx --native
```

This internally calls `openDevWindow()` from the desktop package, which uses Craft to create a lightweight native window.

## Key Features

- **Window Management**: Create and control native windows
- **System Tray**: Build menubar applications
- **Modals & Alerts**: Native dialogs and notifications
- **35 UI Components**: Documented component library
- **Hot Reload**: Development mode support
- **100% Test Coverage**: 132 tests, 96.77% line coverage

## Implementation Location

- `packages/desktop/src/window.ts` - Window management (fully implemented)
- `packages/desktop/src/system-tray.ts` - System tray with Craft bridge + web simulation (fully implemented)
- `packages/desktop/src/modals.ts` - Modal dialogs with native + web fallback (fully implemented)
- `packages/desktop/src/alerts.ts` - Toast notifications with native + web fallback (fully implemented)
- `packages/desktop/src/components.ts` - 35+ UI components with HTML rendering (fully implemented)
- `packages/desktop/src/types.ts` - Complete type definitions
- `packages/desktop/test/` - Comprehensive test suite
- `packages/desktop/examples/` - Working examples

## Integration with stx CLI

The `--native` flag in `stx dev` is implemented via the dev-server module. `dev-server.ts` is now a 7-line re-export hub delegating to:
- `dev-server/serve-markdown.ts` — markdown file serving
- `dev-server/serve-file.ts` — single `.stx` file serving
- `dev-server/serve-multi.ts` — multi-file routing
- `dev-server/serve-app.ts` — full app serving with file-based routing

Native window integration example:

```typescript
import { openDevWindow } from '@stacksjs/desktop'

async function openNativeWindow(port: number) {
  return await openDevWindow(port, {
    title: 'stx Development',
    width: 1400,
    height: 900,
    darkMode: true,
    hotReload: true,
  })
}
```

## Testing

Run desktop package tests:
```bash
cd packages/desktop
bun test              # Run all tests
bun test --coverage   # With coverage report
```

All desktop functionality is fully tested. The package uses Craft (`~/Code/craft`) for native rendering.
