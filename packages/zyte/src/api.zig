const std = @import("std");

/// Zyte API Version - Follows Semantic Versioning
pub const Version = struct {
    major: u32 = 1,
    minor: u32 = 0,
    patch: u32 = 0,

    pub fn toString(self: Version, allocator: std.mem.Allocator) ![]const u8 {
        return try std.fmt.allocPrint(allocator, "{d}.{d}.{d}", .{ self.major, self.minor, self.patch });
    }

    pub fn isCompatible(self: Version, other: Version) bool {
        // Major version must match for compatibility
        // Minor version must be >= for forward compatibility
        return self.major == other.major and self.minor >= other.minor;
    }
};

pub const current_version = Version{
    .major = 1,
    .minor = 0,
    .patch = 0,
};

/// Stable Window API
pub const Window = struct {
    handle: *anyopaque,
    title: []const u8,
    width: u32,
    height: u32,
    x: i32,
    y: i32,

    /// Create a new window
    pub fn create(options: WindowOptions) !Window {
        return switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.create(options),
            .linux => @import("linux.zig").Window.create(options),
            .windows => @import("windows.zig").Window.create(options),
            else => error.UnsupportedPlatform,
        };
    }

    /// Show the window
    pub fn show(self: *Window) void {
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.show(self),
            .linux => @import("linux.zig").Window.show(self),
            .windows => @import("windows.zig").Window.show(self),
            else => {},
        }
    }

    /// Hide the window
    pub fn hide(self: *Window) void {
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.hide(self),
            .linux => @import("linux.zig").Window.hide(self),
            .windows => @import("windows.zig").Window.hide(self),
            else => {},
        }
    }

    /// Close the window
    pub fn close(self: *Window) void {
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.close(self),
            .linux => @import("linux.zig").Window.close(self),
            .windows => @import("windows.zig").Window.close(self),
            else => {},
        }
    }

    /// Set window size
    pub fn setSize(self: *Window, width: u32, height: u32) void {
        self.width = width;
        self.height = height;
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.setSize(self, width, height),
            .linux => @import("linux.zig").Window.setSize(self, width, height),
            .windows => @import("windows.zig").Window.setSize(self, width, height),
            else => {},
        }
    }

    /// Set window position
    pub fn setPosition(self: *Window, x: i32, y: i32) void {
        self.x = x;
        self.y = y;
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.setPosition(self, x, y),
            .linux => @import("linux.zig").Window.setPosition(self, x, y),
            .windows => @import("windows.zig").Window.setPosition(self, x, y),
            else => {},
        }
    }

    /// Set window title
    pub fn setTitle(self: *Window, title: []const u8) void {
        self.title = title;
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").Window.setTitle(self, title),
            .linux => @import("linux.zig").Window.setTitle(self, title),
            .windows => @import("windows.zig").Window.setTitle(self, title),
            else => {},
        }
    }
};

/// Window creation options
pub const WindowOptions = struct {
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
    dev_tools: bool = true,
};

/// Stable Application API
pub const App = struct {
    allocator: std.mem.Allocator,
    windows: std.ArrayList(Window),
    running: bool = false,

    pub fn init(allocator: std.mem.Allocator) App {
        return .{
            .allocator = allocator,
            .windows = std.ArrayList(Window).init(allocator),
        };
    }

    pub fn deinit(self: *App) void {
        self.windows.deinit();
    }

    /// Create a window with URL
    pub fn createWindow(self: *App, title: []const u8, width: u32, height: u32, url: []const u8, options: WindowOptions) !*Window {
        var opts = options;
        opts.title = title;
        opts.width = width;
        opts.height = height;

        const window = try Window.create(opts);
        try self.windows.append(window);

        // Load URL in window
        switch (@import("builtin").target.os.tag) {
            .macos => try @import("macos.zig").Window.loadURL(&self.windows.items[self.windows.items.len - 1], url),
            .linux => try @import("linux.zig").Window.loadURL(&self.windows.items[self.windows.items.len - 1], url),
            .windows => try @import("windows.zig").Window.loadURL(&self.windows.items[self.windows.items.len - 1], url),
            else => return error.UnsupportedPlatform,
        }

        return &self.windows.items[self.windows.items.len - 1];
    }

    /// Run the application event loop
    pub fn run(self: *App) !void {
        self.running = true;
        switch (@import("builtin").target.os.tag) {
            .macos => try @import("macos.zig").App.run(),
            .linux => try @import("linux.zig").App.run(),
            .windows => try @import("windows.zig").App.run(),
            else => return error.UnsupportedPlatform,
        }
    }

    /// Quit the application
    pub fn quit(self: *App) void {
        self.running = false;
        switch (@import("builtin").target.os.tag) {
            .macos => @import("macos.zig").App.quit(),
            .linux => @import("linux.zig").App.quit(),
            .windows => @import("windows.zig").App.quit(),
            else => {},
        }
    }
};

/// Platform information
pub const Platform = struct {
    pub fn name() []const u8 {
        return switch (@import("builtin").target.os.tag) {
            .macos => "macOS",
            .linux => "Linux",
            .windows => "Windows",
            else => "Unknown",
        };
    }

    pub fn isSupported() bool {
        return switch (@import("builtin").target.os.tag) {
            .macos, .linux, .windows => true,
            else => false,
        };
    }

    pub fn version() Version {
        return current_version;
    }
};

/// Feature flags - allows checking for platform-specific features
pub const Features = struct {
    pub fn hasWebView() bool {
        return switch (@import("builtin").target.os.tag) {
            .macos => true,
            .linux => true, // With WebKit2GTK
            .windows => true, // With WebView2
            else => false,
        };
    }

    pub fn hasSystemTray() bool {
        return switch (@import("builtin").target.os.tag) {
            .macos => true,
            .linux => true,
            .windows => true,
            else => false,
        };
    }

    pub fn hasNotifications() bool {
        return switch (@import("builtin").target.os.tag) {
            .macos => true,
            .linux => true,
            .windows => true,
            else => false,
        };
    }

    pub fn hasHotReload() bool {
        return true; // Available on all platforms
    }

    pub fn hasDevTools() bool {
        return switch (@import("builtin").target.os.tag) {
            .macos => true,
            .linux => true,
            .windows => true,
            else => false,
        };
    }
};

/// Error types
pub const Error = error{
    UnsupportedPlatform,
    WindowCreationFailed,
    WebViewCreationFailed,
    InvalidURL,
    InitializationFailed,
    FeatureNotAvailable,
};
