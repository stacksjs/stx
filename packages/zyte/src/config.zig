const std = @import("std");

pub const WindowConfig = struct {
    title: []const u8 = "Zyte App",
    width: u32 = 1200,
    height: u32 = 800,
    x: ?i32 = null,
    y: ?i32 = null,
    resizable: bool = true,
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    fullscreen: bool = false,
    dark_mode: ?bool = null,
};

pub const WebViewConfig = struct {
    dev_tools: bool = true,
    user_agent: ?[]const u8 = null,
};

pub const AppConfig = struct {
    hot_reload: bool = false,
    system_tray: bool = false,
    log_level: []const u8 = "info",
    log_file: ?[]const u8 = null,
};

pub const Config = struct {
    window: WindowConfig = .{},
    webview: WebViewConfig = .{},
    app: AppConfig = .{},

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
                    } else if (std.mem.eql(u8, section, "app")) {
                        try parseAppConfig(&config.app, key, value);
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
        } else if (std.mem.eql(u8, key, "x")) {
            window.x = try std.fmt.parseInt(i32, value, 10);
        } else if (std.mem.eql(u8, key, "y")) {
            window.y = try std.fmt.parseInt(i32, value, 10);
        } else if (std.mem.eql(u8, key, "resizable")) {
            window.resizable = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "frameless")) {
            window.frameless = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "transparent")) {
            window.transparent = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "always_on_top")) {
            window.always_on_top = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "fullscreen")) {
            window.fullscreen = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "dark_mode")) {
            if (std.mem.eql(u8, value, "true")) {
                window.dark_mode = true;
            } else if (std.mem.eql(u8, value, "false")) {
                window.dark_mode = false;
            }
        }
    }

    fn parseAppConfig(app: *AppConfig, key: []const u8, value: []const u8) !void {
        if (std.mem.eql(u8, key, "hot_reload")) {
            app.hot_reload = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "system_tray")) {
            app.system_tray = std.mem.eql(u8, value, "true");
        } else if (std.mem.eql(u8, key, "log_level")) {
            if (value.len >= 2 and value[0] == '"' and value[value.len - 1] == '"') {
                app.log_level = value[1 .. value.len - 1];
            }
        } else if (std.mem.eql(u8, key, "log_file")) {
            if (value.len >= 2 and value[0] == '"' and value[value.len - 1] == '"') {
                app.log_file = value[1 .. value.len - 1];
            }
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

        try writer.writeAll("[app]\n");
        try writer.print("hot_reload = {}\n", .{self.app.hot_reload});
        try writer.print("system_tray = {}\n", .{self.app.system_tray});
        try writer.print("log_level = \"{s}\"\n", .{self.app.log_level});
        if (self.app.log_file) |log_file| {
            try writer.print("log_file = \"{s}\"\n", .{log_file});
        }

        try writer.writeAll("\n[window]\n");
        try writer.print("title = \"{s}\"\n", .{self.window.title});
        try writer.print("width = {d}\n", .{self.window.width});
        try writer.print("height = {d}\n", .{self.window.height});
        if (self.window.x) |x| {
            try writer.print("x = {d}\n", .{x});
        }
        if (self.window.y) |y| {
            try writer.print("y = {d}\n", .{y});
        }
        try writer.print("resizable = {}\n", .{self.window.resizable});
        try writer.print("frameless = {}\n", .{self.window.frameless});
        try writer.print("transparent = {}\n", .{self.window.transparent});
        try writer.print("always_on_top = {}\n", .{self.window.always_on_top});
        try writer.print("fullscreen = {}\n", .{self.window.fullscreen});
        if (self.window.dark_mode) |dark| {
            try writer.print("dark_mode = {}\n", .{dark});
        }

        try writer.writeAll("\n[webview]\n");
        try writer.print("dev_tools = {}\n", .{self.webview.dev_tools});
        if (self.webview.user_agent) |ua| {
            try writer.print("user_agent = \"{s}\"\n", .{ua});
        }
    }
};
