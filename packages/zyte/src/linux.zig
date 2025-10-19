const std = @import("std");

// Linux implementation using GTK and WebKit2GTK
// This is a foundation - would require actual GTK bindings

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
};

pub fn createWindow(title: []const u8, width: u32, height: u32, html: []const u8) !*anyopaque {
    _ = title;
    _ = width;
    _ = height;
    _ = html;
    // Would use GTK4 + WebKit2GTK
    return error.NotImplemented;
}

pub fn createWindowWithURL(title: []const u8, width: u32, height: u32, url: []const u8, style: WindowStyle) !*anyopaque {
    _ = title;
    _ = width;
    _ = height;
    _ = url;
    _ = style;
    // Would use gtk_window_new() + webkit_web_view_new()
    return error.NotImplemented;
}

pub fn runApp() void {
    // Would use gtk_main()
    std.debug.print("Linux GTK event loop not yet implemented\n", .{});
}

pub fn showNotification(title: []const u8, message: []const u8) !void {
    _ = title;
    _ = message;
    // Would use libnotify
}

pub fn setClipboard(text: []const u8) !void {
    _ = text;
    // Would use GtkClipboard
}

pub fn getClipboard(allocator: std.mem.Allocator) ![]u8 {
    _ = allocator;
    // Would use GtkClipboard
    return "";
}
