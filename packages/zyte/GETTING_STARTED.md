# Getting Started with Zyte

## Installation

### 1. Install Zig

First, you need to install Zig. Visit [ziglang.org](https://ziglang.org/download/) or use a package manager:

**macOS (Homebrew):**

```bash
brew install zig
```

**Linux (Snap):**

```bash
snap install zig --classic --beta
```

**Windows (Chocolatey):**

```bash
choco install zig
```

**Or download directly:**
Visit <https://ziglang.org/download/> and download the binary for your platform.

### 2. Verify Installation

```bash
zig version
# Should show: 0.13.0 or later
```

## Building Zyte

Navigate to the zyte package directory:

```bash
cd packages/zyte
```

Build the library:

```bash
zig build
```

Run tests:

```bash
zig build test
```

Run the example app:

```bash
zig build run
```

## Creating Your First App

### Basic Example

Create a new file `my-app.zig`:

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
        \\    <title>My First Zyte App</title>
        \\    <style>
        \\        body {
        \\            font-family: system-ui;
        \\            display: flex;
        \\            justify-content: center;
        \\            align-items: center;
        \\            height: 100vh;
        \\            margin: 0;
        \\            background: #f0f0f0;
        \\        }
        \\        h1 { color: #333; }
        \\    </style>
        \\</head>
        \\<body>
        \\    <h1>Hello, Zyte!</h1>
        \\</body>
        \\</html>
    ;

    _ = try app.createWindow("My First App", 800, 600, html);
    try app.run();
}
```

### Building Your App

Create a `build.zig` file:

```zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const zyte_module = b.dependency("zyte", .{
        .target = target,
        .optimize = optimize,
    }).module("zyte");

    const exe = b.addExecutable(.{
        .name = "my-app",
        .root_source_file = b.path("my-app.zig"),
        .target = target,
        .optimize = optimize,
    });

    exe.root_module.addImport("zyte", zyte_module);
    b.installArtifact(exe);

    const run_cmd = b.addRunArtifact(exe);
    const run_step = b.step("run", "Run the app");
    run_step.dependOn(&run_cmd.step);
}
```

Then build and run:

```bash
zig build run
```

## Platform-Specific Setup

### macOS

On macOS, Zyte uses WebKit framework which is included by default. No additional dependencies needed.

### Linux

Install required dependencies:

**Ubuntu/Debian:**

```bash
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev
```

**Fedora:**

```bash
sudo dnf install gtk3-devel webkit2gtk3-devel
```

**Arch:**

```bash
sudo pacman -S gtk3 webkit2gtk
```

### Windows

On Windows, you need WebView2 Runtime:

1. Download from [Microsoft Edge WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/)
2. Install the Evergreen Runtime

## Project Structure

A typical Zyte project:

```
my-zyte-app/
├── build.zig          # Build configuration
├── src/
│   └── main.zig       # Your app code
├── assets/            # Static files (optional)
│   ├── index.html
│   ├── style.css
│   └── app.js
└── zig-out/           # Build output (generated)
```

## Next Steps

1. Check out the [examples](../../examples/desktop-app.zig)
2. Read the [API documentation](./README.md#api-reference)
3. Join the Stacks community

## Troubleshooting

### "command not found: zig"

Make sure Zig is installed and in your PATH. Try:

```bash
which zig  # macOS/Linux
where zig  # Windows
```

### Build errors on Linux

Make sure you have the required development libraries:

```bash
# Ubuntu/Debian
sudo apt-get install build-essential libgtk-3-dev libwebkit2gtk-4.0-dev
```

### WebView not showing on Windows

Install WebView2 Runtime from Microsoft's website.

## Development Status

⚠️ **Note**: Zyte is in early development. The core API is ready, but platform-specific webview implementations are still being developed. Currently, the framework:

- ✅ Has a clean, working API
- ✅ Compiles successfully
- ✅ Passes tests
- 🚧 Needs platform-specific webview bindings (in progress)

You can use Zyte today to design your app structure and UI, and full webview rendering will be available as platform bindings are completed.
