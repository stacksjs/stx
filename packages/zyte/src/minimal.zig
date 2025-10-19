const std = @import("std");
const zyte = @import("zyte");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var app = zyte.App.init(allocator);
    defer app.deinit();

    // Check if URL was provided as argument
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    const url = if (args.len > 1) args[1] else null;

    var html_buffer: [4096]u8 = undefined;
    const html = if (url) |u| blk: {
        // Create HTML that loads the URL in an iframe
        const formatted = try std.fmt.bufPrint(&html_buffer,
            \\<!DOCTYPE html>
            \\<html>
            \\<head>
            \\    <meta charset="UTF-8">
            \\    <title>Zyte - {s}</title>
            \\    <style>
            \\        * {{
            \\            margin: 0;
            \\            padding: 0;
            \\            box-sizing: border-box;
            \\        }}
            \\        html, body {{
            \\            width: 100%;
            \\            height: 100%;
            \\            overflow: hidden;
            \\        }}
            \\        iframe {{
            \\            width: 100%;
            \\            height: 100%;
            \\            border: none;
            \\            display: block;
            \\        }}
            \\    </style>
            \\</head>
            \\<body>
            \\    <iframe src="{s}"></iframe>
            \\</body>
            \\</html>
        , .{ u, u });
        break :blk formatted;
    } else
        \\<!DOCTYPE html>
        \\<html>
        \\<head>
        \\    <meta charset="UTF-8">
        \\    <title>Minimal Zyte App</title>
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
        \\    </style>
        \\</head>
        \\<body>
        \\    <div class="container">
        \\        <div class="emoji">⚡</div>
        \\        <h1>Zyte</h1>
        \\        <p>Desktop apps with web languages</p>
        \\        <p style="margin-top: 2rem; font-size: 1rem; opacity: 0.7;">
        \\            Usage: zyte-minimal &lt;url&gt;
        \\        </p>
        \\    </div>
        \\</body>
        \\</html>
    ;

    if (url) |u| {
        std.debug.print("\n🚀 Loading URL in native window: {s}\n\n", .{u});
    } else {
        std.debug.print("\n🚀 Launching Zyte minimal app...\n\n", .{});
    }

    const title = if (url) |_| "Zyte - STX Dev Server" else "Zyte - Minimal App";
    const width: u32 = if (url) |_| 1200 else 600;
    const height: u32 = if (url) |_| 800 else 400;

    _ = try app.createWindow(title, width, height, html);
    try app.run();
}
