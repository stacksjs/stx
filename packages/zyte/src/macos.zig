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
    dark_mode: ?bool = null,  // null = system default, true = dark, false = light
    enable_hot_reload: bool = false,  // Enable hot reload support
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

    // Store webview reference globally
    setGlobalWebView(webview);

    // Apply dark mode if specified
    if (style.dark_mode) |is_dark| {
        setAppearance(window, is_dark);
    }

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

// Hot reload - reload URL in webview
pub fn reloadWindow(webview: objc.id) void {
    msgSendVoid0(webview, "reload:");
}

pub fn reloadWindowIgnoringCache(webview: objc.id) void {
    msgSendVoid0(webview, "reloadFromOrigin:");
}

// System tray integration
pub const SystemTray = struct {
    status_item: objc.id,

    pub fn create(title: []const u8) !SystemTray {
        const NSStatusBar = getClass("NSStatusBar");
        const status_bar = msgSend0(NSStatusBar, "systemStatusBar");

        const status_item = msgSend1(status_bar, "statusItemWithLength:", -1.0);

        // Set title
        const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
        defer std.heap.c_allocator.free(title_cstr);
        const title_str_alloc = msgSend0(getClass("NSString"), "alloc");
        const title_str = msgSend1(title_str_alloc, "initWithUTF8String:", title_cstr.ptr);

        const button = msgSend0(status_item, "button");
        _ = msgSend1(button, "setTitle:", title_str);

        return .{ .status_item = status_item };
    }

    pub fn setTitle(self: SystemTray, title: []const u8) !void {
        const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
        defer std.heap.c_allocator.free(title_cstr);
        const title_str_alloc = msgSend0(getClass("NSString"), "alloc");
        const title_str = msgSend1(title_str_alloc, "initWithUTF8String:", title_cstr.ptr);

        const button = msgSend0(self.status_item, "button");
        _ = msgSend1(button, "setTitle:", title_str);
    }

    pub fn remove(self: SystemTray) void {
        const NSStatusBar = getClass("NSStatusBar");
        const status_bar = msgSend0(NSStatusBar, "systemStatusBar");
        msgSendVoid1(status_bar, "removeStatusItem:", self.status_item);
    }
};

// Keyboard shortcuts/hotkeys
pub fn registerGlobalHotkey(key_code: u16, modifiers: u32) void {
    // This would require NSEvent monitoring
    // For now, we'll provide the structure
    _ = key_code;
    _ = modifiers;
}

// Multi-monitor awareness
pub const Monitor = struct {
    frame: NSRect,
    visible_frame: NSRect,
    name: []const u8,
};

pub fn getAllMonitors(allocator: std.mem.Allocator) ![]Monitor {
    const NSScreen = getClass("NSScreen");
    const screens = msgSend0(NSScreen, "screens");
    const count_obj = msgSend0(screens, "count");
    const count = @as(usize, @intCast(@as(i64, @bitCast(count_obj))));

    var monitors = try allocator.alloc(Monitor, count);

    for (0..count) |i| {
        const screen = msgSend1(screens, "objectAtIndex:", i);
        const frame = msgSend0(screen, "frame");
        const visible_frame = msgSend0(screen, "visibleFrame");

        monitors[i] = .{
            .frame = @as(NSRect, @bitCast(frame)),
            .visible_frame = @as(NSRect, @bitCast(visible_frame)),
            .name = "", // Would need to get from screen description
        };
    }

    return monitors;
}

pub fn getMainMonitor() Monitor {
    const NSScreen = getClass("NSScreen");
    const main_screen = msgSend0(NSScreen, "mainScreen");
    const frame = msgSend0(main_screen, "frame");
    const visible_frame = msgSend0(main_screen, "visibleFrame");

    return .{
        .frame = @as(NSRect, @bitCast(frame)),
        .visible_frame = @as(NSRect, @bitCast(visible_frame)),
        .name = "Main",
    };
}

// Screenshot/capture
pub fn captureWindow(window: objc.id, file_path: []const u8) !void {
    const window_id = msgSend0(window, "windowNumber");
    const CGWindowListCreateImage = @as(*const fn (NSRect, u32, u32, u32) callconv(.c) ?*anyopaque, @ptrFromInt(0)); // Placeholder
    _ = CGWindowListCreateImage;
    _ = window_id;
    _ = file_path;
    // Would need Core Graphics bindings for full implementation
}

pub fn captureScreen(file_path: []const u8) !void {
    _ = file_path;
    // Would need Core Graphics bindings
}

// Print support
pub fn printWindow(webview: objc.id) void {
    // Create print operation
    const print_op = msgSend0(webview, "printOperationWithPrintInfo:");
    msgSendVoid0(print_op, "runOperation");
}

pub fn showPrintDialog(webview: objc.id) void {
    const NSPrintInfo = getClass("NSPrintInfo");
    const print_info = msgSend0(NSPrintInfo, "sharedPrintInfo");

    const print_op_class = getClass("NSPrintOperation");
    const print_op = msgSend2(print_op_class, "printOperationWithView:printInfo:", webview, print_info);
    _ = msgSend1(print_op, "runOperationModalForWindow:delegate:didRunSelector:contextInfo:", @as(?*anyopaque, null));
}

// Download management
pub const Download = struct {
    url: []const u8,
    destination: []const u8,
    progress: f64 = 0.0,
};

pub fn startDownload(url: []const u8, destination: []const u8) !Download {
    return .{
        .url = url,
        .destination = destination,
        .progress = 0.0,
    };
}

// Theme support (dark/light mode)
pub fn setAppearance(window: objc.id, dark_mode: bool) void {
    const NSAppearance = getClass("NSAppearance");
    const appearance_name = if (dark_mode) "NSAppearanceNameDarkAqua" else "NSAppearanceNameAqua";

    const name_cstr: [*:0]const u8 = appearance_name;
    const appearance = msgSend1(NSAppearance, "appearanceNamed:", name_cstr);
    _ = msgSend1(window, "setAppearance:", appearance);
}

pub fn getSystemAppearance() bool {
    const NSApp = getClass("NSApplication");
    const app = msgSend0(NSApp, "sharedApplication");
    const appearance = msgSend0(app, "effectiveAppearance");
    const name = msgSend0(appearance, "name");

    // Check if dark mode
    const dark_name_cstr: [*:0]const u8 = "NSAppearanceNameDarkAqua";
    const dark_str_alloc = msgSend0(getClass("NSString"), "alloc");
    const dark_str = msgSend1(dark_str_alloc, "initWithUTF8String:", dark_name_cstr);

    const is_equal = msgSend1(name, "isEqualToString:", dark_str);
    return @as(i64, @bitCast(is_equal)) != 0;
}

// Performance monitoring
pub const PerformanceMetrics = struct {
    memory_usage_mb: f64,
    cpu_usage_percent: f64,
    fps: f64,
};

pub fn getPerformanceMetrics() PerformanceMetrics {
    // Would need to integrate with task_info and mach APIs
    return .{
        .memory_usage_mb = 0.0,
        .cpu_usage_percent = 0.0,
        .fps = 60.0,
    };
}

// Window events
pub const WindowEventType = enum {
    close,
    resize,
    move,
    focus,
    blur,
    minimize,
    maximize,
};

pub const WindowEvent = struct {
    event_type: WindowEventType,
    window: objc.id,
    data: ?*anyopaque = null,
};

// Window event callback (simplified - would need delegate in real implementation)
pub const WindowEventCallback = *const fn (WindowEvent) void;

// Store webview reference for access by window
var global_webview: ?objc.id = null;

pub fn setGlobalWebView(webview: objc.id) void {
    global_webview = webview;
}

pub fn getGlobalWebView() ?objc.id {
    return global_webview;
}

pub fn runApp() void {
    const NSApplication = getClass("NSApplication");
    const app = msgSend0(NSApplication, "sharedApplication");

    // Activate app
    _ = msgSend1(app, "activateIgnoringOtherApps:", true);

    // Run event loop
    msgSendVoid0(app, "run");
}
