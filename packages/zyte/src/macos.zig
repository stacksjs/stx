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
    const msg = @as(*const fn (objc.id, objc.SEL, @TypeOf(arg1)) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector), arg1);
}

fn msgSend2(target: anytype, selector: [*:0]const u8, arg1: anytype, arg2: anytype) objc.id {
    const msg = @as(*const fn (objc.id, objc.SEL, @TypeOf(arg1), @TypeOf(arg2)) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector), arg1, arg2);
}

fn msgSend4(target: anytype, selector: [*:0]const u8, arg1: anytype, arg2: anytype, arg3: anytype, arg4: anytype) objc.id {
    const msg = @as(*const fn (objc.id, objc.SEL, @TypeOf(arg1), @TypeOf(arg2), @TypeOf(arg3), @TypeOf(arg4)) callconv(.c) objc.id, @ptrCast(&objc.objc_msgSend));
    return msg(target, sel(selector), arg1, arg2, arg3, arg4);
}

fn msgSendVoid0(target: anytype, selector: [*:0]const u8) void {
    const msg = @as(*const fn (@TypeOf(target), objc.SEL) callconv(.c) void, @ptrCast(&objc.objc_msgSend));
    msg(target, sel(selector));
}

pub fn createWindow(title: []const u8, width: u32, height: u32, html: []const u8) !objc.id {
    // Get classes
    const NSApplication = getClass("NSApplication");
    const NSWindow = getClass("NSWindow");
    const NSString = getClass("NSString");
    const WKWebView = getClass("WKWebView");

    // Get shared application
    const app = msgSend0(NSApplication, "sharedApplication");

    // Set activation policy
    const NSApplicationActivationPolicyRegular: c_long = 0;
    _ = msgSend1(app, "setActivationPolicy:", NSApplicationActivationPolicyRegular);

    // Create window frame
    const frame = NSRect{
        .origin = .{ .x = 100, .y = 100 },
        .size = .{ .width = @as(f64, @floatFromInt(width)), .height = @as(f64, @floatFromInt(height)) },
    };

    const styleMask: c_ulong = 15; // Titled | Closable | Miniaturizable | Resizable
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

    // Create WKWebView
    const webview_alloc = msgSend0(WKWebView, "alloc");
    const webview = msgSend1(webview_alloc, "initWithFrame:", frame);

    // Create HTML NSString
    const html_cstr = try std.heap.c_allocator.dupeZ(u8, html);
    defer std.heap.c_allocator.free(html_cstr);
    const html_str_alloc = msgSend0(NSString, "alloc");
    const html_str = msgSend1(html_str_alloc, "initWithUTF8String:", html_cstr.ptr);

    // Load HTML
    const base_url: ?*anyopaque = null;
    _ = msgSend2(webview, "loadHTMLString:baseURL:", html_str, base_url);

    // Set webview as content view
    _ = msgSend1(window, "setContentView:", webview);

    // Center and show window
    msgSendVoid0(window, "center");
    _ = msgSend1(window, "makeKeyAndOrderFront:", @as(?*anyopaque, null));

    return window;
}

pub fn runApp() void {
    const NSApplication = getClass("NSApplication");
    const app = msgSend0(NSApplication, "sharedApplication");

    // Activate app
    _ = msgSend1(app, "activateIgnoringOtherApps:", true);

    // Run event loop
    msgSendVoid0(app, "run");
}
