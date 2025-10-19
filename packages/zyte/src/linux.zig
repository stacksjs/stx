const std = @import("std");

// Linux implementation using GTK4 and WebKit2GTK
// Requires: libgtk-4-dev, libwebkit2gtk-4.1-dev

// GTK and WebKit C bindings
pub extern "c" fn gtk_init() void;
pub extern "c" fn gtk_application_new(application_id: [*:0]const u8, flags: c_int) ?*anyopaque;
pub extern "c" fn g_application_run(app: *anyopaque, argc: c_int, argv: [*c][*c]u8) c_int;
pub extern "c" fn gtk_application_window_new(app: *anyopaque) *anyopaque;
pub extern "c" fn gtk_window_set_title(window: *anyopaque, title: [*:0]const u8) void;
pub extern "c" fn gtk_window_set_default_size(window: *anyopaque, width: c_int, height: c_int) void;
pub extern "c" fn gtk_window_present(window: *anyopaque) void;
pub extern "c" fn gtk_window_close(window: *anyopaque) void;
pub extern "c" fn gtk_window_set_decorated(window: *anyopaque, decorated: c_int) void;
pub extern "c" fn gtk_window_set_resizable(window: *anyopaque, resizable: c_int) void;
pub extern "c" fn gtk_window_fullscreen(window: *anyopaque) void;
pub extern "c" fn gtk_window_unfullscreen(window: *anyopaque) void;
pub extern "c" fn gtk_window_maximize(window: *anyopaque) void;
pub extern "c" fn gtk_window_unmaximize(window: *anyopaque) void;
pub extern "c" fn gtk_window_minimize(window: *anyopaque) void;
pub extern "c" fn gtk_widget_hide(widget: *anyopaque) void;
pub extern "c" fn gtk_widget_show(widget: *anyopaque) void;
pub extern "c" fn gtk_window_set_position(window: *anyopaque, x: c_int, y: c_int) void;

pub extern "c" fn webkit_web_view_new() *anyopaque;
pub extern "c" fn webkit_web_view_load_uri(webview: *anyopaque, uri: [*:0]const u8) void;
pub extern "c" fn webkit_web_view_load_html(webview: *anyopaque, html: [*:0]const u8, base_uri: [*:0]const u8) void;
pub extern "c" fn webkit_web_view_get_settings(webview: *anyopaque) *anyopaque;
pub extern "c" fn webkit_settings_set_enable_developer_extras(settings: *anyopaque, enabled: c_int) void;
pub extern "c" fn webkit_settings_set_enable_webgl(settings: *anyopaque, enabled: c_int) void;
pub extern "c" fn webkit_settings_set_javascript_can_access_clipboard(settings: *anyopaque, enabled: c_int) void;

pub extern "c" fn gtk_window_set_child(window: *anyopaque, child: *anyopaque) void;

pub extern "c" fn g_signal_connect_data(
    instance: *anyopaque,
    detailed_signal: [*:0]const u8,
    c_handler: *const fn (*anyopaque, *anyopaque) callconv(.C) void,
    data: ?*anyopaque,
    destroy_data: ?*anyopaque,
    connect_flags: c_int,
) c_ulong;

// Application state
var app_instance: ?*anyopaque = null;
var current_window: ?*anyopaque = null;

pub const WindowStyle = struct {
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    resizable: bool = true,
    closable: bool = true,
    miniaturizable: bool = true,
    fullscreen: bool = false,
    x: ?i32 = null,
    y: ?i32 = null,
    dark_mode: ?bool = null,
    enable_hot_reload: bool = false,
    dev_tools: bool = true,
};

pub const Window = struct {
    gtk_window: *anyopaque,
    webview: *anyopaque,
    title: []const u8,
    width: u32,
    height: u32,
    x: i32,
    y: i32,

    pub fn create(options: @import("api.zig").WindowOptions) !Window {
        // Initialize GTK if not already done
        if (app_instance == null) {
            gtk_init();
            app_instance = gtk_application_new("com.zyte.app", 0);
        }

        const window = gtk_application_window_new(app_instance.?);
        current_window = window;

        // Create WebView
        const webview = webkit_web_view_new();

        // Configure WebView settings
        const settings = webkit_web_view_get_settings(webview);
        webkit_settings_set_enable_developer_extras(settings, if (options.dev_tools) 1 else 0);
        webkit_settings_set_enable_webgl(settings, 1);
        webkit_settings_set_javascript_can_access_clipboard(settings, 1);

        // Set window properties
        const title_z = try std.heap.c_allocator.dupeZ(u8, options.title);
        defer std.heap.c_allocator.free(title_z);
        gtk_window_set_title(window, title_z);

        gtk_window_set_default_size(window, @intCast(options.width), @intCast(options.height));

        // Apply window style
        if (!options.frameless) {
            gtk_window_set_decorated(window, 1);
        } else {
            gtk_window_set_decorated(window, 0);
        }

        gtk_window_set_resizable(window, if (options.resizable) 1 else 0);

        if (options.fullscreen) {
            gtk_window_fullscreen(window);
        }

        // Position window if specified
        const x: i32 = options.x orelse 100;
        const y: i32 = options.y orelse 100;
        if (options.x != null and options.y != null) {
            gtk_window_set_position(window, @intCast(x), @intCast(y));
        }

        // Add WebView to window
        gtk_window_set_child(window, webview);

        return Window{
            .gtk_window = window,
            .webview = webview,
            .title = options.title,
            .width = options.width,
            .height = options.height,
            .x = x,
            .y = y,
        };
    }

    pub fn show(self: *Window) void {
        gtk_widget_show(self.gtk_window);
        gtk_window_present(self.gtk_window);
    }

    pub fn hide(self: *Window) void {
        gtk_widget_hide(self.gtk_window);
    }

    pub fn close(self: *Window) void {
        gtk_window_close(self.gtk_window);
    }

    pub fn setSize(self: *Window, width: u32, height: u32) void {
        gtk_window_set_default_size(self.gtk_window, @intCast(width), @intCast(height));
    }

    pub fn setPosition(self: *Window, x: i32, y: i32) void {
        gtk_window_set_position(self.gtk_window, @intCast(x), @intCast(y));
    }

    pub fn setTitle(self: *Window, title: []const u8) void {
        const title_z = std.heap.c_allocator.dupeZ(u8, title) catch return;
        defer std.heap.c_allocator.free(title_z);
        gtk_window_set_title(self.gtk_window, title_z);
    }

    pub fn loadURL(self: *Window, url: []const u8) !void {
        const url_z = try std.heap.c_allocator.dupeZ(u8, url);
        defer std.heap.c_allocator.free(url_z);
        webkit_web_view_load_uri(self.webview, url_z);
    }

    pub fn loadHTML(self: *Window, html: []const u8) !void {
        const html_z = try std.heap.c_allocator.dupeZ(u8, html);
        defer std.heap.c_allocator.free(html_z);
        webkit_web_view_load_html(self.webview, html_z, "");
    }

    pub fn maximize(self: *Window) void {
        gtk_window_maximize(self.gtk_window);
    }

    pub fn minimize(self: *Window) void {
        gtk_window_minimize(self.gtk_window);
    }

    pub fn setFullscreen(self: *Window, fullscreen: bool) void {
        if (fullscreen) {
            gtk_window_fullscreen(self.gtk_window);
        } else {
            gtk_window_unfullscreen(self.gtk_window);
        }
    }
};

pub const App = struct {
    pub fn run() !void {
        if (app_instance) |app| {
            _ = g_application_run(app, 0, undefined);
        }
    }

    pub fn quit() void {
        // GTK will handle quit via signal
    }
};

// Legacy API compatibility
pub fn createWindow(title: []const u8, width: u32, height: u32, html: []const u8) !*anyopaque {
    var window = try Window.create(.{
        .title = title,
        .width = width,
        .height = height,
    });
    try window.loadHTML(html);
    window.show();
    return window.gtk_window;
}

pub fn createWindowWithURL(title: []const u8, width: u32, height: u32, url: []const u8, style: WindowStyle) !*anyopaque {
    var window = try Window.create(.{
        .title = title,
        .width = width,
        .height = height,
        .x = style.x,
        .y = style.y,
        .resizable = style.resizable,
        .frameless = style.frameless,
        .transparent = style.transparent,
        .fullscreen = style.fullscreen,
        .dark_mode = style.dark_mode,
        .dev_tools = style.dev_tools,
    });
    try window.loadURL(url);
    window.show();
    return window.gtk_window;
}

pub fn runApp() void {
    App.run() catch |err| {
        std.debug.print("Error running GTK app: {}\n", .{err});
    };
}

// Notifications using libnotify
pub extern "c" fn notify_init(app_name: [*:0]const u8) c_int;
pub extern "c" fn notify_notification_new(summary: [*c]const u8, body: [*c]const u8, icon: [*c]const u8) *anyopaque;
pub extern "c" fn notify_notification_show(notification: *anyopaque, error: ?*anyopaque) c_int;

pub fn showNotification(title: []const u8, message: []const u8) !void {
    const title_z = try std.heap.c_allocator.dupeZ(u8, title);
    defer std.heap.c_allocator.free(title_z);
    const message_z = try std.heap.c_allocator.dupeZ(u8, message);
    defer std.heap.c_allocator.free(message_z);

    _ = notify_init("Zyte");
    const notification = notify_notification_new(title_z, message_z, "");
    _ = notify_notification_show(notification, null);
}

// Clipboard using GDK
pub extern "c" fn gdk_display_get_default() *anyopaque;
pub extern "c" fn gdk_display_get_clipboard(display: *anyopaque) *anyopaque;
pub extern "c" fn gdk_clipboard_set_text(clipboard: *anyopaque, text: [*:0]const u8) void;
pub extern "c" fn gdk_clipboard_read_text_async(
    clipboard: *anyopaque,
    cancellable: ?*anyopaque,
    callback: *const fn (*anyopaque, *anyopaque, ?*anyopaque) callconv(.C) void,
    user_data: ?*anyopaque,
) void;

pub fn setClipboard(text: []const u8) !void {
    const text_z = try std.heap.c_allocator.dupeZ(u8, text);
    defer std.heap.c_allocator.free(text_z);

    const display = gdk_display_get_default();
    const clipboard = gdk_display_get_clipboard(display);
    gdk_clipboard_set_text(clipboard, text_z);
}

pub fn getClipboard(allocator: std.mem.Allocator) ![]u8 {
    _ = allocator;
    // TODO: Implement async clipboard read
    return "";
}
