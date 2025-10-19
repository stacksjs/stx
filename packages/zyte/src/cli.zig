const std = @import("std");

pub const WindowOptions = struct {
    url: ?[]const u8 = null,
    html: ?[]const u8 = null,
    title: []const u8 = "Zyte App",
    width: u32 = 1200,
    height: u32 = 800,
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    resizable: bool = true,
    dev_tools: bool = true,
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
        } else if (std.mem.eql(u8, arg, "--frameless")) {
            options.frameless = true;
        } else if (std.mem.eql(u8, arg, "--transparent")) {
            options.transparent = true;
        } else if (std.mem.eql(u8, arg, "--always-on-top")) {
            options.always_on_top = true;
        } else if (std.mem.eql(u8, arg, "--no-resize")) {
            options.resizable = false;
        } else if (std.mem.eql(u8, arg, "--no-devtools")) {
            options.dev_tools = false;
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
        \\Options:
        \\  -u, --url <URL>          Load URL in the window
        \\      --html <HTML>        Load HTML content directly
        \\  -t, --title <TITLE>      Window title (default: "Zyte App")
        \\  -w, --width <WIDTH>      Window width (default: 1200)
        \\      --height <HEIGHT>    Window height (default: 800)
        \\      --frameless          Create frameless window
        \\      --transparent        Make window transparent
        \\      --always-on-top      Keep window always on top
        \\      --no-resize          Disable window resizing
        \\      --no-devtools        Disable WebKit DevTools
        \\  -h, --help               Show this help message
        \\  -v, --version            Show version information
        \\
        \\Examples:
        \\  zyte http://localhost:3000
        \\  zyte --url http://example.com --width 800 --height 600
        \\  zyte --url http://localhost:3000 --title "My App" --frameless
        \\  zyte --html "<h1>Hello, World!</h1>" --width 400 --height 300
        \\
        \\For more information, visit: https://github.com/stacksjs/zyte
        \\
        \\
    , .{});
}

fn printVersion() void {
    std.debug.print(
        \\zyte version 0.1.0
        \\Built with Zig 0.15.1
        \\
        \\
    , .{});
}
