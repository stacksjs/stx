const std = @import("std");
const builtin = @import("builtin");
const macos = if (builtin.os.tag == .macos) @import("macos.zig") else struct {};

// Re-export platform types
pub const WindowStyle = if (builtin.os.tag == .macos) macos.WindowStyle else struct {
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    resizable: bool = true,
    closable: bool = true,
    miniaturizable: bool = true,
    fullscreen: bool = false,
    x: ?i32 = null,
    y: ?i32 = null,
};

pub const Window = struct {
    title: []const u8,
    width: u32,
    height: u32,
    html: []const u8,
    native_handle: ?*anyopaque = null,

    const Self = @This();

    pub fn init(title: []const u8, width: u32, height: u32, html: []const u8) Self {
        return .{
            .title = title,
            .width = width,
            .height = height,
            .html = html,
        };
    }

    pub fn show(self: *Self) !void {
        switch (builtin.os.tag) {
            .macos => try self.showMacOS(),
            .linux => try self.showLinux(),
            .windows => try self.showWindows(),
            else => return error.UnsupportedPlatform,
        }
    }

    fn showMacOS(self: *Self) !void {
        if (builtin.os.tag == .macos) {
            const window = try macos.createWindow(self.title, self.width, self.height, self.html);
            self.native_handle = @ptrCast(window);
        } else {
            return error.UnsupportedPlatform;
        }
    }

    fn showLinux(self: *Self) !void {
        // Linux implementation using GTK and WebKit2GTK
        _ = self;
        @panic("Linux implementation requires GTK bindings");
    }

    fn showWindows(self: *Self) !void {
        // Windows implementation using WebView2
        _ = self;
        @panic("Windows implementation requires WebView2 bindings");
    }

    pub fn setHtml(self: *Self, html: []const u8) void {
        self.html = html;
    }

    pub fn eval(self: *Self, js: []const u8) !void {
        _ = self;
        _ = js;
        return error.NotImplemented;
    }

    pub fn deinit(self: *Self) void {
        if (self.native_handle) |handle| {
            // Platform-specific cleanup
            _ = handle;
        }
    }
};

pub const App = struct {
    allocator: std.mem.Allocator,
    windows: std.ArrayList(*Window),

    const Self = @This();

    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .allocator = allocator,
            .windows = .{},
        };
    }

    pub fn createWindow(self: *Self, title: []const u8, width: u32, height: u32, html: []const u8) !*Window {
        const window = try self.allocator.create(Window);
        window.* = Window.init(title, width, height, html);
        try self.windows.append(self.allocator, window);
        return window;
    }

    pub fn createWindowWithURL(self: *Self, title: []const u8, width: u32, height: u32, url: []const u8, style: WindowStyle) !*Window {
        if (builtin.os.tag == .macos) {
            const native_window = try macos.createWindowWithURL(title, width, height, url, style);
            const window = try self.allocator.create(Window);
            window.* = Window.init(title, width, height, "");
            window.native_handle = @ptrCast(native_window);
            try self.windows.append(self.allocator, window);
            return window;
        } else {
            return error.UnsupportedPlatform;
        }
    }

    pub fn run(self: *Self) !void {
        if (self.windows.items.len == 0) {
            return error.NoWindows;
        }

        // Show all windows
        for (self.windows.items) |window| {
            try window.show();
        }

        // Platform-specific event loop
        switch (builtin.os.tag) {
            .macos => try self.runMacOS(),
            .linux => try self.runLinux(),
            .windows => try self.runWindows(),
            else => return error.UnsupportedPlatform,
        }
    }

    fn runMacOS(self: *Self) !void {
        _ = self;
        if (builtin.os.tag == .macos) {
            macos.runApp();
        }
    }

    fn runLinux(self: *Self) !void {
        _ = self;
        std.debug.print("Linux event loop (not yet implemented)\n", .{});
    }

    fn runWindows(self: *Self) !void {
        _ = self;
        std.debug.print("Windows event loop (not yet implemented)\n", .{});
    }

    pub fn deinit(self: *Self) void {
        for (self.windows.items) |window| {
            window.deinit();
            self.allocator.destroy(window);
        }
        self.windows.deinit(self.allocator);
    }
};

test "create window" {
    const allocator = std.testing.allocator;
    var app = App.init(allocator);
    defer app.deinit();

    const window = try app.createWindow("Test Window", 800, 600, "<h1>Hello, World!</h1>");
    try std.testing.expectEqualStrings("Test Window", window.title);
    try std.testing.expect(window.width == 800);
    try std.testing.expect(window.height == 600);
}

test "set html" {
    const allocator = std.testing.allocator;
    var app = App.init(allocator);
    defer app.deinit();

    const window = try app.createWindow("Test", 800, 600, "<h1>Initial</h1>");
    window.setHtml("<h1>Updated</h1>");
    try std.testing.expectEqualStrings("<h1>Updated</h1>", window.html);
}
