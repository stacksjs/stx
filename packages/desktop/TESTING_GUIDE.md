# Testing Guide for @stacksjs/desktop

This guide covers testing the desktop package with craft integration for native window support.

## Prerequisites

- Bun installed (v1.3.1+)
- craft repository cloned at `/Users/mac/repos/stacks-org/craft`
- craft binary built (`zig build` in craft repo)
- ts-craft linked to desktop package

## Quick Test

The fastest way to test the native window functionality:

```bash
# From stx repository root
bun packages/stx/bin/cli.ts dev examples/homepage.stx --native
```

**Expected Result:**
- ✅ Dev server starts
- ✅ System tray icon appears in menubar labeled "stx Development"
- ✅ Clicking the icon shows/hides the native window
- ✅ Window displays the homepage at http://localhost:3000/

## Setup craft Integration

### 1. Clone and Build craft

```bash
# Clone craft (if not already cloned)
cd /Users/mac/repos/stacks-org
git clone https://github.com/stacksjs/craft
cd craft

# Install dependencies
bun install

# Build the Zig binary
zig build

# Verify binary exists
ls packages/zig/zig-out/bin/craft-minimal
```

### 2. Link ts-craft Package

```bash
# In craft repository, link the TypeScript package
cd packages/typescript
bun link

# In stx repository, link ts-craft to desktop package
cd /Users/mac/repos/stacks-org/stx/packages/desktop
bun link ts-craft

# Verify the link
ls -la node_modules/ts-craft
# Should show: node_modules/ts-craft -> ../../../../craft/packages/typescript
```

## Unit Tests

Run the automated test suite:

```bash
cd packages/desktop
bun test
```

**Expected Results:**
- ✅ All tests pass
- ✅ High coverage maintained
- ✅ No TypeScript errors

### Run Tests with Coverage

```bash
bun test --coverage
```

Expected coverage:
- Functions: 100%
- Lines: >95%

## Manual Testing

### Test 1: Basic Window Creation

Create `/tmp/test-window.ts`:

```typescript
import { createApp } from 'ts-craft'

const app = createApp({
  url: 'https://github.com/stacksjs/stx',
  craftPath: '/Users/mac/repos/stacks-org/craft/packages/zig/zig-out/bin/craft-minimal',
  window: {
    title: 'STX on GitHub',
    width: 1200,
    height: 800,
    systemTray: true,
    darkMode: true,
  },
})

await app.show()
console.log('✓ Window created - check your menubar for "STX on GitHub"')
```

Run:
```bash
bun /tmp/test-window.ts
```

**Expected:**
- ✅ Menubar icon appears with title "STX on GitHub"
- ✅ Clicking icon shows native window
- ✅ Window loads GitHub page
- ✅ Dark mode is applied

### Test 2: HTML Content

Create `/tmp/test-html.ts`:

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
      color: white;
      font-family: system-ui;
      font-size: 48px;
    }
  </style>
</head>
<body>
  <h1>⚡ craft + stx</h1>
</body>
</html>
`

await show(html, {
  title: 'HTML Test',
  width: 600,
  height: 400,
})
```

Run:
```bash
bun /tmp/test-html.ts
```

**Expected:**
- ✅ Window appears with gradient background
- ✅ Displays "⚡ craft + stx" centered
- ✅ Uses system font

### Test 3: Integration with stx Dev Server

```bash
# Start dev server with native window
cd /Users/mac/repos/stacks-org/stx
bun packages/stx/bin/cli.ts dev examples/homepage.stx --native
```

**Test checklist:**
- [ ] Dev server starts on port 3000 (or 3001 if busy)
- [ ] Console shows "⚡ Opening native window..."
- [ ] Console shows "✓ Native window opened at http://localhost:3000/"
- [ ] Menubar icon appears labeled "stx Development"
- [ ] Clicking icon shows window with homepage
- [ ] Hot reload works (edit homepage.stx and see changes)
- [ ] DevTools accessible (right-click > Inspect Element)

### Test 4: Window Options

Test different window configurations:

```typescript
import { createApp } from 'ts-craft'

const craftPath = '/Users/mac/repos/stacks-org/craft/packages/zig/zig-out/bin/craft-minimal'

// Test 1: Frameless window
const frameless = createApp({
  url: 'http://localhost:3000',
  craftPath,
  window: {
    title: 'Frameless',
    width: 400,
    height: 300,
    frameless: true,
    systemTray: true,
  },
})

// Test 2: Always on top
const alwaysOnTop = createApp({
  url: 'http://localhost:3000',
  craftPath,
  window: {
    title: 'Always On Top',
    width: 400,
    height: 300,
    alwaysOnTop: true,
    systemTray: true,
  },
})

// Test 3: Non-resizable
const fixed = createApp({
  url: 'http://localhost:3000',
  craftPath,
  window: {
    title: 'Fixed Size',
    width: 600,
    height: 400,
    resizable: false,
    systemTray: true,
  },
})
```

## Troubleshooting

### Issue: "craft-minimal not found"

**Solution:**
```bash
cd /Users/mac/repos/stacks-org/craft
zig build
ls packages/zig/zig-out/bin/craft-minimal
```

### Issue: "Unknown option --url"

**Cause:** craft TypeScript wrapper not finding the correct binary

**Solution:**
```bash
# Ensure ts-craft is properly linked
cd /Users/mac/repos/stacks-org/stx/packages/desktop
bun unlink ts-craft
cd /Users/mac/repos/stacks-org/craft/packages/typescript
bun link
cd /Users/mac/repos/stacks-org/stx/packages/desktop
bun link ts-craft
```

### Issue: "No menubar icon appears"

**Cause:** System tray might not be enabled

**Solution:**
Check that `systemTray: true` in window options:
```typescript
window: {
  systemTray: true,  // Required for craft windows
  // ... other options
}
```

### Issue: "Window created but not visible"

**Cause:** craft requires system tray mode to function

**Solution:**
craft is designed for menubar applications. The window appears when you click the menubar icon. This is expected behavior.

### Issue: Linting errors

**Solution:**
```bash
cd packages/desktop
bunx eslint src/window.ts --fix
```

## Performance Testing

### Startup Time

Test how fast the window appears:

```bash
time bun packages/stx/bin/cli.ts dev examples/homepage.stx --native
```

Expected: <3 seconds to menubar icon appearance

### Memory Usage

Check memory footprint:

```bash
# Start the window
bun packages/stx/bin/cli.ts dev examples/homepage.stx --native

# In another terminal, check memory
ps aux | grep craft-minimal
```

Expected: <100MB for simple pages

## Automated Testing

The desktop package includes comprehensive automated tests:

```bash
cd packages/desktop

# Run all tests
bun test

# Run specific test file
bun test test/window.test.ts

# Run with watch mode
bun test --watch

# Generate coverage report
bun test --coverage
```

### Test Files

- `test/window.test.ts` - Window management tests
- `test/system-tray.test.ts` - System tray tests (placeholders)
- `test/modals.test.ts` - Modal dialog tests (placeholders)
- `test/alerts.test.ts` - Alert/toast tests (placeholders)
- `test/components.test.ts` - UI component tests (placeholders)

## Sign-off Checklist

Before considering the implementation complete:

- [ ] craft binary built successfully
- [ ] ts-craft linked to desktop package
- [ ] All unit tests passing
- [ ] Linting passes with no errors
- [ ] `stx dev --native` opens menubar window
- [ ] Window displays content correctly
- [ ] Hot reload works in dev mode
- [ ] DevTools accessible
- [ ] Window can be shown/hidden via menubar icon
- [ ] App quits cleanly (Cmd+Q or menubar > Quit)
- [ ] Documentation updated
- [ ] Examples run successfully

## Next Steps

Once all tests pass:

1. Consider additional craft features:
   - Custom menubar icons
   - Menu item actions
   - Keyboard shortcuts
   - Window positioning

2. Explore craft bridge API:
   - `window.craft.tray` - System tray control from web content
   - `window.craft.window` - Window control from web content
   - `window.craft.app` - App control from web content

3. Build production-ready features:
   - Packaging for distribution
   - Auto-updates
   - Crash reporting

## Resources

- [craft GitHub](https://github.com/stacksjs/craft)
- [craft Documentation](https://github.com/stacksjs/craft/blob/main/README.md)
- [WebKit Documentation](https://webkit.org/documentation/)
- [stx Documentation](../../README.md)
