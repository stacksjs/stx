const std = @import("std");

pub const WindowOptions = struct {
    url: ?[]const u8 = null,
    html: ?[]const u8 = null,
    title: []const u8 = "Zyte App",
    width: u32 = 1200,
    height: u32 = 800,
    x: ?i32 = null,
    y: ?i32 = null,
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    resizable: bool = true,
    fullscreen: bool = false,
    dev_tools: bool = true,
    dark_mode: ?bool = null,
    hot_reload: bool = false,
    system_tray: bool = false,
};

pub const CliError = error{
    InvalidArgument,
    MissingValue,
    InvalidNumber,
};

pub fn parseArgs(allocator: std.mem.Allocator) !WindowOptions {
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    var options = WindowOptions{};
    var i: usize = 1; // Skip program name

    while (i < args.len) : (i += 1) {
        const arg = args[i];

        if (std.mem.eql(u8, arg, "--help") or std.mem.eql(u8, arg, "-h")) {
            printHelp();
            std.process.exit(0);
        } else if (std.mem.eql(u8, arg, "--version") or std.mem.eql(u8, arg, "-v")) {
            printVersion();
            std.process.exit(0);
        } else if (std.mem.eql(u8, arg, "--url") or std.mem.eql(u8, arg, "-u")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.url = try allocator.dupe(u8, args[i]);
        } else if (std.mem.eql(u8, arg, "--html")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.html = try allocator.dupe(u8, args[i]);
        } else if (std.mem.eql(u8, arg, "--title") or std.mem.eql(u8, arg, "-t")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.title = try allocator.dupe(u8, args[i]);
        } else if (std.mem.eql(u8, arg, "--width") or std.mem.eql(u8, arg, "-w")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.width = std.fmt.parseInt(u32, args[i], 10) catch return CliError.InvalidNumber;
        } else if (std.mem.eql(u8, arg, "--height")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.height = std.fmt.parseInt(u32, args[i], 10) catch return CliError.InvalidNumber;
        } else if (std.mem.eql(u8, arg, "--x") or std.mem.eql(u8, arg, "-x")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.x = std.fmt.parseInt(i32, args[i], 10) catch return CliError.InvalidNumber;
        } else if (std.mem.eql(u8, arg, "--y") or std.mem.eql(u8, arg, "-y")) {
            i += 1;
            if (i >= args.len) return CliError.MissingValue;
            options.y = std.fmt.parseInt(i32, args[i], 10) catch return CliError.InvalidNumber;
        } else if (std.mem.eql(u8, arg, "--frameless")) {
            options.frameless = true;
        } else if (std.mem.eql(u8, arg, "--transparent")) {
            options.transparent = true;
        } else if (std.mem.eql(u8, arg, "--always-on-top")) {
            options.always_on_top = true;
        } else if (std.mem.eql(u8, arg, "--fullscreen") or std.mem.eql(u8, arg, "-f")) {
            options.fullscreen = true;
        } else if (std.mem.eql(u8, arg, "--no-resize")) {
            options.resizable = false;
        } else if (std.mem.eql(u8, arg, "--no-devtools")) {
            options.dev_tools = false;
        } else if (std.mem.eql(u8, arg, "--dark")) {
            options.dark_mode = true;
        } else if (std.mem.eql(u8, arg, "--light")) {
            options.dark_mode = false;
        } else if (std.mem.eql(u8, arg, "--hot-reload")) {
            options.hot_reload = true;
        } else if (std.mem.eql(u8, arg, "--system-tray")) {
            options.system_tray = true;
        } else if (!std.mem.startsWith(u8, arg, "--")) {
            // Treat as positional URL argument
            if (options.url == null) {
                options.url = try allocator.dupe(u8, arg);
            }
        }
    }

    return options;
}

fn printHelp() void {
    std.debug.print(
        \\
        \\⚡ Zyte - Build desktop apps with web languages
        \\
        \\Usage: zyte [OPTIONS] [URL]
        \\
        \\Window Content:
        \\  -u, --url <URL>          Load URL in the window
        \\      --html <HTML>        Load HTML content directly
        \\
        \\Window Appearance:
        \\  -t, --title <TITLE>      Window title (default: "Zyte App")
        \\  -w, --width <WIDTH>      Window width (default: 1200)
        \\      --height <HEIGHT>    Window height (default: 800)
        \\  -x, --x <X>              Window x position (default: centered)
        \\  -y, --y <Y>              Window y position (default: centered)
        \\
        \\Window Style:
        \\      --frameless          Create frameless window
        \\      --transparent        Make window transparent
        \\      --always-on-top      Keep window always on top
        \\  -f, --fullscreen         Start in fullscreen mode
        \\      --no-resize          Disable window resizing
        \\
        \\Theme:
        \\      --dark               Force dark mode
        \\      --light              Force light mode
        \\
        \\Features:
        \\      --hot-reload         Enable hot reload support
        \\      --system-tray        Show system tray icon
        \\      --no-devtools        Disable WebKit DevTools
        \\
        \\Information:
        \\  -h, --help               Show this help message
        \\  -v, --version            Show version information
        \\
        \\Examples:
        \\  zyte http://localhost:3000
        \\  zyte --url http://example.com --width 800 --height 600
        \\  zyte --url http://localhost:3000 --title "My App" --frameless
        \\  zyte --html "<h1>Hello, World!</h1>" --width 400 --height 300
        \\  zyte http://localhost:3000 --x 100 --y 100 --fullscreen
        \\  zyte http://localhost:3000 --transparent --always-on-top
        \\  zyte http://localhost:3000 --dark --hot-reload
        \\  zyte http://localhost:3000 --system-tray --light
        \\
        \\For more information, visit: https://github.com/stacksjs/zyte
        \\
        \\
    , .{});
}

fn printVersion() void {
    std.debug.print(
        \\zyte version 0.7.0
        \\Built with Zig 0.15.1
        \\
        \\
    , .{});
}
