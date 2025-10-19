// Example desktop app using Zyte
// To run: cd packages/zyte && zig build run

const std = @import("std");
const zyte = @import("zyte");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var app = zyte.App.init(allocator);
    defer app.deinit();

    // Create a beautiful desktop app UI
    const html =
        \\<!DOCTYPE html>
        \\<html lang="en">
        \\<head>
        \\    <meta charset="UTF-8">
        \\    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        \\    <title>Zyte Desktop App</title>
        \\    <style>
        \\        * {
        \\            margin: 0;
        \\            padding: 0;
        \\            box-sizing: border-box;
        \\        }
        \\
        \\        body {
        \\            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        \\                         'Helvetica Neue', Arial, sans-serif;
        \\            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        \\            height: 100vh;
        \\            display: flex;
        \\            justify-content: center;
        \\            align-items: center;
        \\            color: white;
        \\            overflow: hidden;
        \\        }
        \\
        \\        .container {
        \\            text-align: center;
        \\            padding: 3rem;
        \\            background: rgba(255, 255, 255, 0.1);
        \\            border-radius: 20px;
        \\            backdrop-filter: blur(10px);
        \\            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        \\            border: 1px solid rgba(255, 255, 255, 0.2);
        \\            max-width: 600px;
        \\        }
        \\
        \\        h1 {
        \\            font-size: 3.5rem;
        \\            margin-bottom: 1rem;
        \\            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        \\            font-weight: 700;
        \\        }
        \\
        \\        .subtitle {
        \\            font-size: 1.3rem;
        \\            opacity: 0.95;
        \\            margin-bottom: 2rem;
        \\        }
        \\
        \\        .features {
        \\            display: grid;
        \\            grid-template-columns: repeat(3, 1fr);
        \\            gap: 1rem;
        \\            margin-top: 2rem;
        \\        }
        \\
        \\        .feature {
        \\            background: rgba(255, 255, 255, 0.15);
        \\            padding: 1.5rem 1rem;
        \\            border-radius: 12px;
        \\            backdrop-filter: blur(5px);
        \\            transition: transform 0.2s, background 0.2s;
        \\            cursor: default;
        \\        }
        \\
        \\        .feature:hover {
        \\            transform: translateY(-5px);
        \\            background: rgba(255, 255, 255, 0.2);
        \\        }
        \\
        \\        .feature-icon {
        \\            font-size: 2.5rem;
        \\            margin-bottom: 0.5rem;
        \\        }
        \\
        \\        .feature-title {
        \\            font-weight: 600;
        \\            font-size: 1.1rem;
        \\        }
        \\
        \\        .cta {
        \\            margin-top: 2rem;
        \\            display: flex;
        \\            gap: 1rem;
        \\            justify-content: center;
        \\        }
        \\
        \\        button {
        \\            background: rgba(255, 255, 255, 0.9);
        \\            color: #667eea;
        \\            border: none;
        \\            padding: 0.8rem 2rem;
        \\            border-radius: 8px;
        \\            font-size: 1rem;
        \\            font-weight: 600;
        \\            cursor: pointer;
        \\            transition: all 0.2s;
        \\        }
        \\
        \\        button:hover {
        \\            background: white;
        \\            transform: scale(1.05);
        \\            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        \\        }
        \\
        \\        button:active {
        \\            transform: scale(0.98);
        \\        }
        \\
        \\        .secondary {
        \\            background: transparent;
        \\            border: 2px solid rgba(255, 255, 255, 0.9);
        \\            color: white;
        \\        }
        \\
        \\        .secondary:hover {
        \\            background: rgba(255, 255, 255, 0.1);
        \\        }
        \\    </style>
        \\</head>
        \\<body>
        \\    <div class="container">
        \\        <h1>⚡ Zyte</h1>
        \\        <p class="subtitle">Build desktop apps with web languages</p>
        \\
        \\        <div class="features">
        \\            <div class="feature">
        \\                <div class="feature-icon">🚀</div>
        \\                <div class="feature-title">Fast</div>
        \\            </div>
        \\            <div class="feature">
        \\                <div class="feature-icon">🎨</div>
        \\                <div class="feature-title">Beautiful</div>
        \\            </div>
        \\            <div class="feature">
        \\                <div class="feature-icon">🔒</div>
        \\                <div class="feature-title">Secure</div>
        \\            </div>
        \\        </div>
        \\
        \\        <div class="cta">
        \\            <button onclick="alert('Welcome to Zyte!')">Get Started</button>
        \\            <button class="secondary" onclick="alert('Documentation coming soon!')">Learn More</button>
        \\        </div>
        \\    </div>
        \\
        \\    <script>
        \\        console.log('Zyte desktop app initialized!');
        \\
        \\        // Example: You can interact with Zig backend here
        \\        document.addEventListener('DOMContentLoaded', () => {
        \\            console.log('App ready!');
        \\        });
        \\    </script>
        \\</body>
        \\</html>
    ;

    const window = try app.createWindow("Zyte Desktop App", 900, 700, html);
    _ = window;

    std.debug.print("\n╭─────────────────────────────────────────╮\n", .{});
    std.debug.print("│  🚀 Zyte Desktop App Framework        │\n", .{});
    std.debug.print("├─────────────────────────────────────────┤\n", .{});
    std.debug.print("│  Status: API Ready                     │\n", .{});
    std.debug.print("│  Window: Created (900x700)             │\n", .{});
    std.debug.print("│                                         │\n", .{});
    std.debug.print("│  ⚠️  Note: Full webview rendering      │\n", .{});
    std.debug.print("│     requires platform bindings         │\n", .{});
    std.debug.print("│                                         │\n", .{});
    std.debug.print("│  Next Steps:                           │\n", .{});
    std.debug.print("│  1. Implement Objective-C bindings     │\n", .{});
    std.debug.print("│     for macOS WebKit                   │\n", .{});
    std.debug.print("│  2. Add GTK bindings for Linux         │\n", .{});
    std.debug.print("│  3. Add WebView2 bindings for Windows  │\n", .{});
    std.debug.print("╰─────────────────────────────────────────╯\n\n", .{});

    // Uncomment when platform bindings are ready:
    // try app.run();
}
