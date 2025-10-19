# ⚡ Zyte

**Build lightning-fast desktop apps with web languages**

A lightweight, Zig-powered framework for creating native desktop applications using HTML, CSS, and JavaScript. Think Electron or Tauri, but **100x smaller** and **blazingly fast**.

## ✨ Features

### Core
- 🪶 **Tiny**: 1.3MB binaries (vs 100MB+ Electron)
- ⚡ **Fast**: Native WebKit, instant startup
- 🎯 **Simple**: Clean, intuitive Zig API
- 🌐 **Cross-platform**: macOS ✅ | Linux 🚧 | Windows 🚧

### Advanced
- 🔗 **JavaScript Bridge**: Seamless Zig ↔ Web communication
- 🎨 **Custom Windows**: Frameless, transparent, always-on-top
- 🛠️ **DevTools**: Built-in WebKit Inspector
- 📋 **Native Dialogs**: File open/save, clipboard access
- ⚙️ **Configuration**: TOML-based config files
- 📊 **Logging**: Color-coded, level-based logging system

## 🚀 Quick Start

### Installation

```bash
# Clone or add as dependency
git clone https://github.com/stacksjs/stx
cd stx/packages/zyte

# Build
zig build

# Run example
./zig-out/bin/zyte-minimal http://localhost:3000
```

### Basic Example

```zig
const std = @import("std");
const zyte = @import("zyte");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    var app = zyte.App.init(gpa.allocator());
    defer app.deinit();

    // Load a URL directly (no iframe!)
    _ = try app.createWindowWithURL(
        "My App",
        1200,
        800,
        "http://localhost:3000",
        .{ .frameless = false },
    );

    try app.run();
}
```

## 📚 Documentation

- **[API Reference](API_REFERENCE.md)** - Complete API documentation
- **[Improvements](IMPROVEMENTS.md)** - v0.2.0 changelog
- **[Getting Started](GETTING_STARTED.md)** - Detailed setup guide
- **[Quick Start](QUICK_START.md)** - 5-minute tutorial

## 🎯 CLI Usage

```bash
# Show help
zyte --help

# Load URL
zyte http://localhost:3000

# Custom window
zyte --url http://example.com \
     --title "My App" \
     --width 1200 \
     --height 800 \
     --frameless

# Load HTML directly
zyte --html "<h1>Hello, World!</h1>"

# Transparent overlay
zyte http://localhost:3000 \
     --transparent \
     --always-on-top \
     --frameless
```

## 🌟 JavaScript Bridge

Zyte automatically injects a powerful API into your web pages:

```javascript
// Listen for ready event
window.addEventListener('zyte:ready', async () => {
    console.log('Zyte version:', window.zyte.version);

    // Call native functions
    await window.zyte.notify('Hello from JavaScript!');

    // File operations
    const content = await window.zyte.readFile('/path/to/file.txt');
    await window.zyte.writeFile('/path/to/output.txt', 'Hello!');

    // Clipboard
    await window.zyte.setClipboard('Copied text!');
    const text = await window.zyte.getClipboard();

    // Dialogs
    const path = await window.zyte.openDialog({ title: 'Select file' });
});
```

## ⚙️ Configuration

Create a `zyte.toml` file:

```toml
[window]
title = "My App"
width = 1200
height = 800
resizable = true
frameless = false
transparent = false

[webview]
dev_tools = true
```

## 🔧 Build Modes

```bash
# Debug (default) - fast compilation
zig build

# Release Safe - optimized with safety checks
zig build -Doptimize=ReleaseSafe

# Release Fast - maximum performance
zig build -Doptimize=ReleaseFast

# Release Small - smallest binary (< 1MB!)
zig build -Doptimize=ReleaseSmall
```

## 📊 Comparison

|  | Zyte | Electron | Tauri |
|--|------|----------|-------|
| **Binary Size** | 1.3MB | 100MB+ | 3-10MB |
| **Memory** | ~92MB | ~200MB | ~90MB |
| **Startup** | Instant | Slow | Fast |
| **Language** | Zig | JavaScript | Rust |
| **Browser** | System WebKit | Bundled Chromium | System WebView |
| **DevTools** | ✅ Built-in | ✅ Built-in | ✅ Via config |

## 🛠️ Platform Support

| Feature | macOS | Linux | Windows |
|---------|-------|-------|---------|
| Window Creation | ✅ | 🚧 | 🚧 |
| WebView | ✅ | 🚧 | 🚧 |
| DevTools | ✅ | 🚧 | 🚧 |
| Dialogs | ✅ | ❌ | ❌ |
| Clipboard | ✅ | ❌ | ❌ |
| JS Bridge | ✅ | 🚧 | 🚧 |
| Menu Bar | 🚧 | ❌ | ❌ |
| System Tray | ❌ | ❌ | ❌ |

✅ Working | 🚧 Ready | ❌ Not yet

## 📦 What's New in v0.2.0

- ✅ Direct URL loading (no iframe!)
- ✅ Comprehensive CLI with 10+ flags
- ✅ Custom window styles (frameless, transparent, etc.)
- ✅ WebKit DevTools integration
- ✅ JavaScript ↔ Zig bridge
- ✅ Native file dialogs
- ✅ Clipboard access
- ✅ Configuration file support
- ✅ Color-coded logging system

See [IMPROVEMENTS.md](IMPROVEMENTS.md) for full details.

## 🎯 Use Cases

- **Dev Tools**: Create custom development environments
- **Dashboards**: Build system monitoring apps
- **Utilities**: Small, focused desktop tools
- **Prototypes**: Rapid UI development
- **Internal Tools**: Company-specific applications
- **Cross-platform Apps**: Write once, run anywhere

## 🤝 Contributing

Contributions welcome! Areas of focus:

- Linux support (GTK + WebKit2GTK)
- Windows support (WebView2)
- Hot reload functionality
- System tray integration
- Additional examples

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Built with [Zig](https://ziglang.org/) 0.15.1
- Part of the [Stacks](https://github.com/stacksjs/stacks) ecosystem
- Inspired by Electron, Tauri, and Wails

---

**⚡ Built with Zig. Lightning fast. Incredibly small.**
