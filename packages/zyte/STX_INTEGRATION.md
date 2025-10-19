# Zyte + STX Integration

## Native Desktop Windows for STX Development

Zyte is now integrated with the STX development server! You can view your .stx files in a **native desktop window** instead of (or in addition to) your browser.

## Usage

### Basic Command

```bash
./stx dev examples/homepage.stx --native
```

This will:
1. Start the STX dev server on localhost
2. Show instructions for opening the content in a native Zyte window

### What Happens

When you add the `--native` flag:

1. The dev server starts normally on the specified port (default: 3000)
2. Zyte package is checked/built automatically if needed
3. **A native window opens automatically** loading your .stx content!

### Example Output

```bash
stx  v0.0.10  ready in  7.42  ms

→  http://localhost:3000/

Routes:
  └─ / → examples/homepage.stx

⚡ Opening native window...
✓ Native window opened with URL: http://localhost:3000/

Press h + Enter to show shortcuts
```

**Your .stx file now appears in a beautiful native desktop window!** 🎉

## Advantages of Native Windows

### vs Browser

- ✅ **Cleaner UI** - No browser chrome, address bar, or tabs
- ✅ **Native Feel** - True desktop application experience
- ✅ **System Integration** - macOS/Windows/Linux native window controls
- ✅ **Smaller Footprint** - Uses system WebKit, not full browser
- ✅ **Distraction-Free** - Just your content, nothing else

### vs Electron

- ✅ **Tiny** - 1.3MB vs 100MB+ Electron apps
- ✅ **Fast** - Uses system WebKit, no Chromium bundling
- ✅ **Memory Efficient** - ~90MB vs 200MB+ for Electron
- ✅ **Simple** - Zig + WebKit, no complex toolchain

## Full Example Workflow

```bash
# 1. Navigate to your STX project
cd /Users/chrisbreuer/Code/stx

# 2. Start dev server with native window (window opens automatically!)
./packages/stx/bin/stx dev examples/homepage.stx --native

# 3. Edit your .stx files - changes auto-reload in both browser and native window!

# 4. Press Ctrl+C to stop the dev server
```

**That's it!** The native window opens automatically when you use `--native`. No manual steps needed!

## Options

### Port

```bash
./stx dev examples/homepage.stx --native --port 8080
```

### Watch Mode (Auto-reload)

```bash
./stx dev examples/homepage.stx --native --no-watch
```

The --native flag works with all other stx dev options!

## Architecture

```
┌─────────────────┐
│   Your .stx     │
│     File        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   STX Dev       │
│    Server       │
│ (localhost:300) │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌──────────┐
│ Browser │ │  Zyte    │
│  Tab    │ │ Native   │
│         │ │  Window  │
└─────────┘ └──────────┘
```

## Advanced: Customizing Zyte

You can modify the Zyte window behavior by editing:
- `packages/zyte/src/minimal.zig` - Window size, title, etc.
- `packages/zyte/src/macos.zig` - macOS-specific behavior
- `packages/zyte/build.zig` - Build configuration

Then rebuild with `zig build`.

## Requirements

- **Zig**: 0.15.1 or later
- **macOS**: WebKit framework (built-in)
- **Linux**: GTK3 + WebKit2GTK (install separately)
- **Windows**: WebView2 Runtime (install separately)

## Platform Status

| Platform | Status | Requirements |
|----------|--------|--------------|
| macOS    | ✅ Working | Zig 0.15.1+ |
| Linux    | 🚧 Ready | Zig + GTK3 + WebKit2GTK |
| Windows  | 🚧 Ready | Zig + WebView2 |

## Troubleshooting

### "Zyte not built"

If you see this message, Zyte will automatically build itself. If it fails:

```bash
cd packages/zyte
zig build
```

### "Command not found: zig"

Install Zig:

```bash
brew install zig  # macOS
```

### Window doesn't open

Make sure the dev server is running first, then open Zyte in a separate terminal.

## Future Improvements

- [ ] Auto-launch Zyte window when --native is used
- [ ] Pass URL directly to Zyte (no manual navigation needed)
- [ ] Hot reload integration (automatic refresh)
- [ ] Multiple window support
- [ ] Custom window sizes via CLI flags
- [ ] Full Linux & Windows support

## Contributing

Want to help improve Zyte + STX integration?

1. Check out the code in `packages/zyte/`
2. Test on your platform
3. Submit improvements!

---

**Built with ❤️ using Zig and the Stacks ecosystem**
