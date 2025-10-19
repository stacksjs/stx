const std = @import("std");
const c = @cImport({
    @cDefine("OBJC_OLD_DISPATCH_PROTOTYPES", "1");
    @cInclude("objc/message.h");
    @cInclude("objc/runtime.h");
});

// Objective-C runtime helpers
const Class = c.Class;
const SEL = c.SEL;
const id = c.id;

pub const objc = struct {
    pub inline fn getClass(name: [*:0]const u8) Class {
        return c.objc_getClass(name);
    }

    pub inline fn sel(name: [*:0]const u8) SEL {
        return c.sel_registerName(name);
    }

    pub inline fn msgSend(obj: anytype, selector: SEL, args: anytype) id {
        const T = @TypeOf(obj);
        if (T == Class) {
            return @call(.auto, @as(*const fn (Class, SEL, ...) callconv(.C) id, @ptrCast(&c.objc_msgSend)), .{ obj, selector } ++ args);
        } else {
            return @call(.auto, @as(*const fn (id, SEL, ...) callconv(.C) id, @ptrCast(&c.objc_msgSend)), .{ obj, selector } ++ args);
        }
    }

    pub inline fn msgSendVoid(obj: anytype, selector: SEL) void {
        const T = @TypeOf(obj);
        if (T == Class) {
            @call(.auto, @as(*const fn (Class, SEL) callconv(.C) void, @ptrCast(&c.objc_msgSend)), .{ obj, selector });
        } else {
            @call(.auto, @as(*const fn (id, SEL) callconv(.C) void, @ptrCast(&c.objc_msgSend)), .{ obj, selector });
        }
    }
};

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

pub fn createWindow(title: []const u8, width: u32, height: u32, html: []const u8) !id {
    const NSApplication = objc.getClass("NSApplication");
    const NSWindow = objc.getClass("NSWindow");
    const NSString = objc.getClass("NSString");
    const WKWebView = objc.getClass("WKWebView");

    // Get shared application
    const app = objc.msgSend(NSApplication, objc.sel("sharedApplication"), .{});

    // Set activation policy to regular app
    const NSApplicationActivationPolicyRegular: c_long = 0;
    _ = objc.msgSend(app, objc.sel("setActivationPolicy:"), .{NSApplicationActivationPolicyRegular});

    // Create window
    const frame = NSRect{
        .origin = .{ .x = 100, .y = 100 },
        .size = .{ .width = @as(f64, @floatFromInt(width)), .height = @as(f64, @floatFromInt(height)) },
    };

    const styleMask: c_ulong = 15; // Titled, Closable, Miniaturizable, Resizable
    const backing: c_ulong = 2; // NSBackingStoreBuffered
    const defer_flag: bool = false;

    const window = objc.msgSend(NSWindow, objc.sel("alloc"), .{});
    _ = objc.msgSend(window, objc.sel("initWithContentRect:styleMask:backing:defer:"), .{ frame, styleMask, backing, defer_flag });

    // Create NSString for title
    const title_str = objc.msgSend(NSString, objc.sel("alloc"), .{});
    const title_cstr = try std.heap.c_allocator.dupeZ(u8, title);
    defer std.heap.c_allocator.free(title_cstr);
    _ = objc.msgSend(title_str, objc.sel("initWithUTF8String:"), .{title_cstr.ptr});

    // Set window title
    objc.msgSendVoid(window, objc.sel("setTitle:"));
    _ = objc.msgSend(window, objc.sel("setTitle:"), .{title_str});

    // Create WKWebView
    const webview = objc.msgSend(WKWebView, objc.sel("alloc"), .{});
    _ = objc.msgSend(webview, objc.sel("initWithFrame:"), .{frame});

    // Create NSString for HTML
    const html_str = objc.msgSend(NSString, objc.sel("alloc"), .{});
    const html_cstr = try std.heap.c_allocator.dupeZ(u8, html);
    defer std.heap.c_allocator.free(html_cstr);
    _ = objc.msgSend(html_str, objc.sel("initWithUTF8String:"), .{html_cstr.ptr});

    // Load HTML
    const base_url: id = null;
    _ = objc.msgSend(webview, objc.sel("loadHTMLString:baseURL:"), .{ html_str, base_url });

    // Set webview as content view
    _ = objc.msgSend(window, objc.sel("setContentView:"), .{webview});

    // Center and show window
    objc.msgSendVoid(window, objc.sel("center"));
    objc.msgSendVoid(window, objc.sel("makeKeyAndOrderFront:"));
    _ = objc.msgSend(window, objc.sel("makeKeyAndOrderFront:"), .{@as(?*anyopaque, null)});

    return window;
}

pub fn runApp() void {
    const NSApplication = objc.getClass("NSApplication");
    const app = objc.msgSend(NSApplication, objc.sel("sharedApplication"), .{});

    // Activate app
    const activate_ignoring: bool = true;
    _ = objc.msgSend(app, objc.sel("activateIgnoringOtherApps:"), .{activate_ignoring});

    // Run event loop
    objc.msgSendVoid(app, objc.sel("run"));
}
