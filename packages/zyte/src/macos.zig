const std = @import("std");

// Import Objective-C runtime
const objc = @cImport({
    @cDefine("OBJC_OLD_DISPATCH_PROTOTYPES", "1");
    @cInclude("objc/message.h");
    @cInclude("objc/runtime.h");
});

pub const NSRect = extern struct {
    origin: NSPoint,
    size: NSSize,
};

pub const NSPoint = extern struct {
    x: f64,
    y: f64,
};

pub const NSSize = extern struct {
    width: f64,
    height: f64,
};

// Window style options
pub const WindowStyle = struct {
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    resizable: bool = true,
    closable: bool = true,
    miniaturizable: bool = true,
    fullscreen: bool = false,
    x: ?i32 = null,  // Window x position (null = center)
    y: ?i32 = null,  // Window y position (null = center)
};

// Helper functions for Objective-C runtime
fn getClass(name: [*:0]const u8) objc.Class {
    return objc.objc_getClass(name);
}

fn sel(name: [*:0]const u8) objc.SEL {
    return objc.sel_registerName(name);
}

// Simple message send wrappers
fn msgSend0(target: anytype, selector: [*:0]const u8) objc.id {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector));
}

fn msgSend1(target: anytype, selector: [*:0]const u8, arg1: anytype) objc.id {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL, @TypeOf(arg1)) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector), arg1);
}

fn msgSend2(target: anytype, selector: [*:0]const u8, arg1: anytype, arg2: anytype) objc.id {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL, @TypeOf(arg1), @TypeOf(arg2)) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector), arg1, arg2);
}

fn msgSend4(target: anytype, selector: [*:0]const u8, arg1: anytype, arg2: anytype, arg3: anytype, arg4: anytype) objc.id {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL, @TypeOf(arg1), @TypeOf(arg2), @TypeOf(arg3), @TypeOf(arg4)) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector), arg1, arg2, arg3, arg4);
}

fn msgSendVoid0(target: anytype, selector: [*:0]const u8) void {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL) callconv(.c) void, @ptrCast(&objc.objc_msgSend));
    msg(target, sel(selector));
}

fn msgSendVoid1(target: anytype, selector: [*:0]const u8, arg1: anytype) void {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL, @TypeOf(arg1)) callconv(.c) void, @ptrCast(&objc.objc_msgSend));
    msg(target, sel(selector), arg1);
}

fn msgSendVoid2(target: anytype, selector: [*:0]const u8, arg1: anytype, arg2: anytype) void {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL, @TypeOf(arg1), @TypeOf(arg2)) callconv(.c) void, @ptrCast(&objc.objc_msgSend));
    msg(target, sel(selector), arg1, arg2);
}

pub fn createWindow(title: []const u8, width: u32, height: u32, html: []const u8) !objc.id {
    return createWindowWithStyle(title, width, height, html, null, .{});
}

pub fn createWindowWithURL(title: []const u8, width: u32, height: u32, url: []const u8, style: WindowStyle) !objc.id {
    return createWindowWithStyle(title, width, height, null, url, style);
}

pub fn createWindowWithStyle(title: []const u8, width: u32, height: u32, html: ?[]const u8, url: ?[]const u8, style: WindowStyle) !objc.id {
    // Get classes
    const NSApplication = getClass("NSApplication");
    const NSWindow = getClass("NSWindow");
    const NSString = getClass("NSString");
    const NSURL = getClass("NSURL");
    const NSURLRequest = getClass("NSURLRequest");
    const WKWebView = getClass("WKWebView");
    const WKPreferences = getClass("WKPreferences");
    const WKWebViewConfiguration = getClass("WKWebViewConfiguration");

    // Get shared application
    const app = msgSend0(NSApplication, "sharedApplication");

    // Set activation policy
    const NSApplicationActivationPolicyRegular: c_long = 0;
    _ = msgSend1(app, "setActivationPolicy:", NSApplicationActivationPolicyRegular);

    // Create window frame
    const frame = NSRect{
        .origin = .{
            .x = if (style.x) |x| @as(f64, @floatFromInt(x)) else 100,
            .y = if (style.y) |y| @as(f64, @floatFromInt(y)) else 100,
        },
        .size = .{ .width = @as(f64, @floatFromInt(width)), .height = @as(f64, @floatFromInt(height)) },
    };

    // Build style mask based on options
    var styleMask: c_ulong = 1; // NSTitledWindowMask
    if (!style.frameless) {
        if (style.closable) styleMask |= 2; // NSClosableWindowMask
        if (style.miniaturizable) styleMask |= 4; // NSMiniaturizableWindowMask
        if (style.resizable) styleMask |= 8; // NSResizableWindowMask
    } else {
        styleMask = 0; // Borderless
    }

    const backing: c_ulong = 2; // NSBackingStoreBuffered
    const defer_flag: bool = false;

    // Allocate and initialize window
    const window_alloc = msgSend0(NSWindow, "alloc");
    const window = msgSend4(window_alloc, "initWithContentRect:styleMask:backing:defer:", frame, styleMask, backing, defer_flag);

    // Create title NSString
    const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
    defer std.heap.c_allocator.free(title_cstr);
    const title_str_alloc = msgSend0(NSString, "alloc");
    const title_str = msgSend1(title_str_alloc, "initWithUTF8String:", title_cstr.ptr);

    // Set window title
    _ = msgSend1(window, "setTitle:", title_str);

    // Configure transparency
    if (style.transparent) {
        _ = msgSend1(window, "setOpaque:", false);
        _ = msgSend1(window, "setBackgroundColor:", msgSend0(getClass("NSColor"), "clearColor"));
    }

    // Configure always on top
    if (style.always_on_top) {
        const NSFloatingWindowLevel: c_int = 3;
        _ = msgSend1(window, "setLevel:", NSFloatingWindowLevel);
    }

    // Create WebView configuration with DevTools enabled
    const config_alloc = msgSend0(WKWebViewConfiguration, "alloc");
    const config = msgSend0(config_alloc, "init");

    const prefs_alloc = msgSend0(WKPreferences, "alloc");
    const prefs = msgSend0(prefs_alloc, "init");

    // Enable developer extras (DevTools)
    const key_str = createNSString("developerExtrasEnabled");
    const value_obj = msgSend1(msgSend0(getClass("NSNumber"), "alloc"), "initWithBool:", true);
    msgSendVoid2(prefs, "setValue:forKey:", value_obj, key_str);
    _ = msgSend1(config, "setPreferences:", prefs);

    // Create WKWebView with configuration
    const webview_alloc = msgSend0(WKWebView, "alloc");
    const webview = msgSend2(webview_alloc, "initWithFrame:configuration:", frame, config);

    // Load content - either URL or HTML
    if (url) |u| {
        // Load URL directly (no iframe!)
        const url_cstr = try std.heap.c_allocator.dupeZ(u8, u);
        defer std.heap.c_allocator.free(url_cstr);
        const url_str_alloc = msgSend0(NSString, "alloc");
        const url_str = msgSend1(url_str_alloc, "initWithUTF8String:", url_cstr.ptr);

        const nsurl = msgSend1(NSURL, "URLWithString:", url_str);
        const request = msgSend1(NSURLRequest, "requestWithURL:", nsurl);
        _ = msgSend1(webview, "loadRequest:", request);
    } else if (html) |h| {
        // Load HTML string
        const html_cstr = try std.heap.c_allocator.dupeZ(u8, h);
        defer std.heap.c_allocator.free(html_cstr);
        const html_str_alloc = msgSend0(NSString, "alloc");
        const html_str = msgSend1(html_str_alloc, "initWithUTF8String:", html_cstr.ptr);

        const base_url: ?*anyopaque = null;
        _ = msgSend2(webview, "loadHTMLString:baseURL:", html_str, base_url);
    }

    // Set webview as content view
    _ = msgSend1(window, "setContentView:", webview);

    // Center window if no custom position specified
    if (style.x == null or style.y == null) {
        msgSendVoid0(window, "center");
    }

    // Enter fullscreen if requested
    if (style.fullscreen) {
        msgSendVoid0(window, "toggleFullScreen:");
    }

    // Show window
    _ = msgSend1(window, "makeKeyAndOrderFront:", @as(?*anyopaque, null));

    return window;
}

// Helper to create NSString
fn createNSString(str: []const u8) objc.id {
    const NSString = getClass("NSString");
    const str_alloc = msgSend0(NSString, "alloc");
    const cstr = std.heap.c_allocator.dupeZ(u8, str) catch unreachable;
    defer std.heap.c_allocator.free(cstr);
    return msgSend1(str_alloc, "initWithUTF8String:", cstr.ptr);
}

// Clipboard functions
pub fn setClipboard(text: []const u8) !void {
    const NSPasteboard = getClass("NSPasteboard");
    const NSString = getClass("NSString");

    const pasteboard = msgSend0(NSPasteboard, "generalPasteboard");
    msgSendVoid0(pasteboard, "clearContents");

    const text_cstr = try std.heap.c_allocator.dupeZ(u8, text);
    defer std.heap.c_allocator.free(text_cstr);
    const text_str_alloc = msgSend0(NSString, "alloc");
    const text_str = msgSend1(text_str_alloc, "initWithUTF8String:", text_cstr.ptr);

    _ = msgSend1(pasteboard, "setString:forType:", text_str);
}

pub fn getClipboard(allocator: std.mem.Allocator) ![]const u8 {
    const NSPasteboard = getClass("NSPasteboard");
    const pasteboard = msgSend0(NSPasteboard, "generalPasteboard");
    const str = msgSend0(pasteboard, "stringForType:");

    if (str == null) return error.NoClipboardContent;

    const cstr: [*:0]const u8 = @ptrCast(msgSend0(str, "UTF8String"));
    return allocator.dupe(u8, std.mem.span(cstr));
}

// Native dialog support
pub fn showOpenDialog(title: []const u8, allow_multiple: bool) !?[]const u8 {
    const NSOpenPanel = getClass("NSOpenPanel");
    const panel = msgSend0(NSOpenPanel, "openPanel");

    // Set title
    const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
    defer std.heap.c_allocator.free(title_cstr);
    const title_str_alloc = msgSend0(getClass("NSString"), "alloc");
    const title_str = msgSend1(title_str_alloc, "initWithUTF8String:", title_cstr.ptr);
    _ = msgSend1(panel, "setTitle:", title_str);

    // Set options
    _ = msgSend1(panel, "setCanChooseFiles:", true);
    _ = msgSend1(panel, "setCanChooseDirectories:", false);
    _ = msgSend1(panel, "setAllowsMultipleSelection:", allow_multiple);

    // Run modal
    const result = msgSend0(panel, "runModal");
    const NSModalResponseOK: c_long = 1;

    if (@as(c_long, @intCast(@intFromPtr(result))) != NSModalResponseOK) {
        return null;
    }

    // Get selected URL
    const urls = msgSend0(panel, "URLs");
    const count = @as(usize, @intCast(@intFromPtr(msgSend0(urls, "count"))));

    if (count == 0) return null;

    const url = msgSend1(urls, "objectAtIndex:", @as(c_ulong, 0));
    const path = msgSend0(url, "path");
    const cstr: [*:0]const u8 = @ptrCast(msgSend0(path, "UTF8String"));

    return std.heap.c_allocator.dupe(u8, std.mem.span(cstr));
}

pub fn showSaveDialog(title: []const u8, default_name: ?[]const u8) !?[]const u8 {
    const NSSavePanel = getClass("NSSavePanel");
    const panel = msgSend0(NSSavePanel, "savePanel");

    // Set title
    const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
    defer std.heap.c_allocator.free(title_cstr);
    const title_str_alloc = msgSend0(getClass("NSString"), "alloc");
    const title_str = msgSend1(title_str_alloc, "initWithUTF8String:", title_cstr.ptr);
    _ = msgSend1(panel, "setTitle:", title_str);

    // Set default name if provided
    if (default_name) |name| {
        const name_cstr = try std.heap.c_allocator.dupeZ(u8, name);
        defer std.heap.c_allocator.free(name_cstr);
        const name_str_alloc = msgSend0(getClass("NSString"), "alloc");
        const name_str = msgSend1(name_str_alloc, "initWithUTF8String:", name_cstr.ptr);
        _ = msgSend1(panel, "setNameFieldStringValue:", name_str);
    }

    // Run modal
    const result = msgSend0(panel, "runModal");
    const NSModalResponseOK: c_long = 1;

    if (@as(c_long, @intCast(@intFromPtr(result))) != NSModalResponseOK) {
        return null;
    }

    // Get selected URL
    const url = msgSend0(panel, "URL");
    const path = msgSend0(url, "path");
    const cstr: [*:0]const u8 = @ptrCast(msgSend0(path, "UTF8String"));

    return std.heap.c_allocator.dupe(u8, std.mem.span(cstr));
}

// Window control functions
pub fn minimizeWindow(window: objc.id) void {
    msgSendVoid0(window, "miniaturize:");
}

pub fn maximizeWindow(window: objc.id) void {
    msgSendVoid0(window, "zoom:");
}

pub fn toggleFullscreen(window: objc.id) void {
    msgSendVoid0(window, "toggleFullScreen:");
}

pub fn closeWindow(window: objc.id) void {
    msgSendVoid0(window, "close");
}

pub fn hideWindow(window: objc.id) void {
    msgSendVoid0(window, "orderOut:");
}

pub fn showWindow(window: objc.id) void {
    _ = msgSend1(window, "makeKeyAndOrderFront:", @as(?*anyopaque, null));
}

pub fn setWindowPosition(window: objc.id, x: i32, y: i32) void {
    const point = NSPoint{ .x = @as(f64, @floatFromInt(x)), .y = @as(f64, @floatFromInt(y)) };
    msgSendVoid1(window, "setFrameTopLeftPoint:", point);
}

pub fn setWindowSize(window: objc.id, width: u32, height: u32) void {
    const frame = msgSend0(window, "frame");
    var new_frame = @as(NSRect, @bitCast(frame));
    new_frame.size.width = @as(f64, @floatFromInt(width));
    new_frame.size.height = @as(f64, @floatFromInt(height));
    msgSendVoid2(window, "setFrame:display:", new_frame, true);
}

// Notification support
pub fn showNotification(title: []const u8, message: []const u8) !void {
    const NSUserNotification = getClass("NSUserNotification");
    const NSUserNotificationCenter = getClass("NSUserNotificationCenter");

    const notification = msgSend0(msgSend0(NSUserNotification, "alloc"), "init");

    // Set title
    const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
    defer std.heap.c_allocator.free(title_cstr);
    const title_str_alloc = msgSend0(getClass("NSString"), "alloc");
    const title_str = msgSend1(title_str_alloc, "initWithUTF8String:", title_cstr.ptr);
    _ = msgSend1(notification, "setTitle:", title_str);

    // Set message
    const msg_cstr = try std.heap.c_allocator.dupeZ(u8, message);
    defer std.heap.c_allocator.free(msg_cstr);
    const msg_str_alloc = msgSend0(getClass("NSString"), "alloc");
    const msg_str = msgSend1(msg_str_alloc, "initWithUTF8String:", msg_cstr.ptr);
    _ = msgSend1(notification, "setInformativeText:", msg_str);

    // Deliver notification
    const center = msgSend0(NSUserNotificationCenter, "defaultUserNotificationCenter");
    msgSendVoid1(center, "deliverNotification:", notification);
}

pub fn runApp() void {
    const NSApplication = getClass("NSApplication");
    const app = msgSend0(NSApplication, "sharedApplication");

    // Activate app
    _ = msgSend1(app, "activateIgnoringOtherApps:", true);

    // Run event loop
    msgSendVoid0(app, "run");
}
