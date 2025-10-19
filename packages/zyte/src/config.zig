const std = @import("std");

pub const WindowConfig = struct {
    title: []const u8 = "Zyte App",
    width: u32 = 1200,
    height: u32 = 800,
    resizable: bool = true,
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
};

pub const WebViewConfig = struct {
    dev_tools: bool = true,
    user_agent: ?[]const u8 = null,
};

pub const Config = struct {
    window: WindowConfig = .{},
    webview: WebViewConfig = .{},

    const Self = @This();

    pub fn loadFromFile(allocator: std.mem.Allocator, path: []const u8) !Self {
        const file = try std.fs.cwd().openFile(path, .{});
        defer file.close();

        const content = try file.readToEndAlloc(allocator, 1024 * 1024);
        defer allocator.free(content);

        return try parseToml(allocator, content);
    }

    fn parseToml(allocator: std.mem.Allocator, content: []const u8) !Self {
        _ = allocator;
        var config = Config{};

        // Simple TOML parser (line-by-line)
        var lines = std.mem.splitScalar(u8, content, '\n');
        var current_section: ?[]const u8 = null;

        while (lines.next()) |line| {
            const trimmed = std.mem.trim(u8, line, &std.ascii.whitespace);

            // Skip empty lines and comments
            if (trimmed.len == 0 or trimmed[0] == '#') continue;

            // Section header
            if (trimmed[0] == '[' and trimmed[trimmed.len - 1] == ']') {
                current_section = trimmed[1 .. trimmed.len - 1];
                continue;
            }

            // Key-value pair
            if (std.mem.indexOf(u8, trimmed, "=")) |eq_pos| {
                const key = std.mem.trim(u8, trimmed[0..eq_pos], &std.ascii.whitespace);
                const value = std.mem.trim(u8, trimmed[eq_pos + 1 ..], &std.ascii.whitespace);

                if (current_section) |section| {
                    if (std.mem.eql(u8, section, "window")) {
                        try parseWindowConfig(&config.window, key, value);
                    } else if (std.mem.eql(u8, section, "webview")) {
                        try parseWebViewConfig(&config.webview, key, value);
                    }
                }
            }
        }

        return config;
    }

    fn parseWindowConfig(window: *WindowConfig, key: []const u8, value: []const u8) !void {
        if (std.mem.eql(u8, key, "title")) {
            // Remove quotes
            if (value.len >= 2 and value[0] == '"' and value[value.len - 1] == '"') {
                window.title = value[1 .. value.len - 1];
            }
        } else if (std.mem.eql(u8, key, "width")) {
            window.width = try std.fmt.parseInt(u32, value, 10);
        } else if (std.mem.eql(u8, key, "height")) {
            window.height = try std.fmt.parseInt(u32, value, 10);
        } else if (std.mem.eql(u8, key, "resizable")) {
            window.resizable = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "frameless")) {
            window.frameless = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "transparent")) {
            window.transparent = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "always_on_top")) {
            window.always_on_top = std.mem.eql(u8, value, "true");
        }
    }

    fn parseWebViewConfig(webview: *WebViewConfig, key: []const u8, value: []const u8) !void {
        if (std.mem.eql(u8, key, "dev_tools")) {
            webview.dev_tools = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "user_agent")) {
            if (value.len >= 2 and value[0] == '"' and value[value.len - 1] == '"') {
                webview.user_agent = value[1 .. value.len - 1];
            }
        }
    }

    pub fn saveToFile(self: Self, path: []const u8) !void {
        const file = try std.fs.cwd().createFile(path, .{});
        defer file.close();

        const writer = file.writer();

        try writer.writeAll("# Zyte Configuration File\n\n");

        try writer.writeAll("[window]\n");
        try writer.print("title = \"{s}\"\n", .{self.window.title});
        try writer.print("width = {d}\n", .{self.window.width});
        try writer.print("height = {d}\n", .{self.window.height});
        try writer.print("resizable = {}\n", .{self.window.resizable});
        try writer.print("frameless = {}\n", .{self.window.frameless});
        try writer.print("transparent = {}\n", .{self.window.transparent});
        try writer.print("always_on_top = {}\n\n", .{self.window.always_on_top});

        try writer.writeAll("[webview]\n");
        try writer.print("dev_tools = {}\n", .{self.webview.dev_tools});
        if (self.webview.user_agent) |ua| {
            try writer.print("user_agent = \"{s}\"\n", .{ua});
        }
    }
};
