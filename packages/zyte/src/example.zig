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
        \\    <meta charset="UTF-8">
        \\    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        \\    <title>Zyte Example</title>
        \\    <style>
        \\        body {
        \\            margin: 0;
        \\            padding: 0;
        \\            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        \\            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        \\            display: flex;
        \\            justify-content: center;
        \\            align-items: center;
        \\            height: 100vh;
        \\            color: white;
        \\        }
        \\        .container {
        \\            text-align: center;
        \\            padding: 2rem;
        \\        }
        \\        h1 {
        \\            font-size: 3rem;
        \\            margin: 0 0 1rem 0;
        \\            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        \\        }
        \\        p {
        \\            font-size: 1.2rem;
        \\            opacity: 0.9;
        \\        }
        \\        .features {
        \\            margin-top: 2rem;
        \\            display: flex;
        \\            gap: 1rem;
        \\            justify-content: center;
        \\        }
        \\        .feature {
        \\            background: rgba(255, 255, 255, 0.1);
        \\            padding: 1rem;
        \\            border-radius: 8px;
        \\            backdrop-filter: blur(10px);
        \\        }
        \\    </style>
        \\</head>
        \\<body>
        \\    <div class="container">
        \\        <h1>Welcome to Zyte!</h1>
        \\        <p>Build desktop apps with web languages, powered by Zig</p>
        \\        <div class="features">
        \\            <div class="feature">⚡ Fast</div>
        \\            <div class="feature">🎨 Beautiful</div>
        \\            <div class="feature">🚀 Native</div>
        \\        </div>
        \\    </div>
        \\</body>
        \\</html>
    ;

    const window = try app.createWindow("Zyte Example App", 800, 600, html);
    _ = window;

    std.debug.print("Starting Zyte desktop app...\n", .{});
    std.debug.print("Note: Full webview implementation requires platform-specific bindings.\n", .{});
    std.debug.print("This example demonstrates the API structure.\n", .{});

    // try app.run();
}
