const std = @import("std");
const zyte = @import("zyte");
const cli = @import("cli.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Parse CLI arguments
    const options = cli.parseArgs(allocator) catch |err| {
        switch (err) {
            cli.CliError.InvalidArgument => std.debug.print("Error: Invalid argument\n", .{}),
            cli.CliError.MissingValue => std.debug.print("Error: Missing value for argument\n", .{}),
            cli.CliError.InvalidNumber => std.debug.print("Error: Invalid number format\n", .{}),
            else => std.debug.print("Error: {}\n", .{err}),
        }
        std.process.exit(1);
    };

    var app = zyte.App.init(allocator);
    defer app.deinit();

    // Determine what to load
    if (options.url) |url| {
        // Load URL directly (no iframe!)
        std.debug.print("\n⚡ Loading URL in native window: {s}\n", .{url});
        std.debug.print("   Title: {s}\n", .{options.title});
        std.debug.print("   Size: {d}x{d}\n", .{ options.width, options.height});
        if (options.frameless) std.debug.print("   Style: Frameless\n", .{});
        if (options.transparent) std.debug.print("   Style: Transparent\n", .{});
        if (options.always_on_top) std.debug.print("   Style: Always on top\n", .{});
        if (options.dev_tools) std.debug.print("   DevTools: Enabled (Right-click > Inspect Element)\n", .{});
        std.debug.print("\n", .{});

        _ = try app.createWindowWithURL(
            options.title,
            options.width,
            options.height,
            url,
            .{
                .frameless = options.frameless,
                .transparent = options.transparent,
                .always_on_top = options.always_on_top,
                .resizable = options.resizable,
            },
        );
    } else if (options.html) |html| {
        // Load HTML content
        std.debug.print("\n⚡ Loading HTML content in native window\n", .{});
        std.debug.print("   Title: {s}\n", .{options.title});
        std.debug.print("   Size: {d}x{d}\n\n", .{ options.width, options.height });

        _ = try app.createWindow(options.title, options.width, options.height, html);
    } else {
        // Show default demo app
        std.debug.print("\n⚡ Launching Zyte demo app\n", .{});
        std.debug.print("   Run with --help to see available options\n\n", .{});

        const demo_html =
            \\<!DOCTYPE html>
            \\<html>
            \\<head>
            \\    <meta charset="UTF-8">
            \\    <title>Zyte Demo</title>
            \\    <style>
            \\        * {
            \\            margin: 0;
            \\            padding: 0;
            \\            box-sizing: border-box;
            \\        }
            \\        body {
            \\            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            \\            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            \\            height: 100vh;
            \\            display: flex;
            \\            justify-content: center;
            \\            align-items: center;
            \\            color: white;
            \\        }
            \\        .container {
            \\            text-align: center;
            \\            padding: 3rem;
            \\            background: rgba(255, 255, 255, 0.1);
            \\            border-radius: 20px;
            \\            backdrop-filter: blur(10px);
            \\            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            \\        }
            \\        h1 {
            \\            font-size: 4rem;
            \\            margin-bottom: 1rem;
            \\            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            \\        }
            \\        p {
            \\            font-size: 1.5rem;
            \\            opacity: 0.9;
            \\        }
            \\        .emoji {
            \\            font-size: 6rem;
            \\            margin-bottom: 1rem;
            \\            animation: bounce 2s infinite;
            \\        }
            \\        @keyframes bounce {
            \\            0%, 100% { transform: translateY(0); }
            \\            50% { transform: translateY(-20px); }
            \\        }
            \\        code {
            \\            background: rgba(0, 0, 0, 0.3);
            \\            padding: 0.2rem 0.5rem;
            \\            border-radius: 4px;
            \\            font-family: monospace;
            \\        }
            \\    </style>
            \\</head>
            \\<body>
            \\    <div class="container">
            \\        <div class="emoji">⚡</div>
            \\        <h1>Zyte</h1>
            \\        <p>Desktop apps with web languages</p>
            \\        <p style="margin-top: 2rem; font-size: 1rem; opacity: 0.7;">
            \\            Try: <code>zyte --help</code>
            \\        </p>
            \\    </div>
            \\</body>
            \\</html>
        ;

        _ = try app.createWindow("Zyte - Demo", 600, 400, demo_html);
    }

    try app.run();
}
