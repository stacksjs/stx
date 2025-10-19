# Zyte

> Build desktop apps with web languages, powered by Zig

Zyte is a lightweight desktop application framework written in Zig that allows you to create native desktop applications using HTML, CSS, and JavaScript - similar to Tauri but implemented in Zig.

## Features

- 🚀 **Native Performance** - Built with Zig for maximum performance and minimal overhead
- 🎨 **Web Technologies** - Use familiar HTML, CSS, and JavaScript for UI
- 📦 **Small Bundle Size** - Leverages system webview, no Chromium bundling
- 🔒 **Secure** - Zig's memory safety combined with sandboxed webviews
- 🌐 **Cross-Platform** - Support for macOS, Linux, and Windows

## Platform Support

| Platform | WebView Technology | Status |
|----------|-------------------|--------|
| macOS | WebKit | 🚧 In Progress |
| Linux | WebKit2GTK | 🚧 In Progress |
| Windows | WebView2 | 🚧 In Progress |

## Quick Start

### Prerequisites

- Zig 0.13.0 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/stacksjs/stx
cd stx/packages/zyte

# Build the library
zig build

# Run the example
zig build run
```

## Usage

```zig
const std = @import("std");
const zyte = @import("zyte");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var app = zyte.App.init(allocator);
    defer app.deinit();

    const html =
        \\<!DOCTYPE html>
        \\<html>
        \\<head>
        \\    <title>My App</title>
        \\</head>
        \\<body>
        \\    <h1>Hello from Zyte!</h1>
        \\    <p>This is a desktop app built with web technologies</p>
        \\</body>
        \\</html>
    ;

    _ = try app.createWindow("My App", 800, 600, html);
    try app.run();
}
```

## API Reference

### App

The main application struct that manages windows and the event loop.

```zig
pub const App = struct {
    pub fn init(allocator: std.mem.Allocator) Self
    pub fn createWindow(self: *Self, title: []const u8, width: u32, height: u32, html: []const u8) !*Window
    pub fn run(self: *Self) !void
    pub fn deinit(self: *Self) void
}
```

### Window

Represents a single application window with a webview.

```zig
pub const Window = struct {
    pub fn init(title: []const u8, width: u32, height: u32, html: []const u8) Self
    pub fn show(self: *Self) !void
    pub fn setHtml(self: *Self, html: []const u8) void
    pub fn eval(self: *Self, js: []const u8) !void
    pub fn deinit(self: *Self) void
}
```

## Architecture

Zyte uses native system webviews for rendering:

- **macOS**: Uses Cocoa's `WKWebView` via the WebKit framework
- **Linux**: Uses GTK3 with `webkit2gtk-4.0`
- **Windows**: Uses Microsoft's WebView2 (Edge Chromium)

This approach keeps binary sizes small since we don't bundle a browser engine.

## Development Status

Zyte is currently in early development. The API structure is in place, but platform-specific webview bindings are still being implemented.

### Roadmap

- [ ] Complete macOS WebKit bindings
- [ ] Complete Linux GTK/WebKit2 bindings
- [ ] Complete Windows WebView2 bindings
- [ ] JavaScript ↔ Zig communication bridge
- [ ] File system access APIs
- [ ] Window customization (frameless, transparency, etc.)
- [ ] System tray support
- [ ] Menu bar integration
- [ ] Multi-window support
- [ ] Developer tools integration

## Building from Source

```bash
# Build library
zig build

# Run tests
zig build test

# Run example
zig build run
```

## Contributing

Contributions are welcome! This is part of the Stacks ecosystem.

## License

MIT

## Acknowledgments

Inspired by:
- [Tauri](https://tauri.app/) - Rust-based desktop framework
- [webview](https://github.com/webview/webview) - C/C++ webview library
- [Neutralinojs](https://neutralino.js.org/) - Lightweight alternative to Electron

---

Part of the [Stacks](https://github.com/stacksjs/stx) ecosystem.
