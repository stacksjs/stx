const std = @import("std");

pub const EventType = enum {
    // Window events
    window_created,
    window_closed,
    window_resized,
    window_moved,
    window_focused,
    window_blurred,
    window_minimized,
    window_maximized,
    window_restored,
    
    // Application events
    app_started,
    app_stopped,
    app_paused,
    app_resumed,
    
    // WebView events
    webview_loaded,
    webview_failed,
    webview_navigating,
    
    // Custom events
    custom,
};

pub const Event = struct {
    event_type: EventType,
    timestamp: i64,
    data: ?*anyopaque = null,
    custom_name: ?[]const u8 = null,
};

pub const EventCallback = *const fn (event: Event) void;

pub const EventEmitter = struct {
    listeners: std.StringHashMap(std.ArrayList(EventCallback)),
    allocator: std.mem.Allocator,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .listeners = std.StringHashMap(std.ArrayList(EventCallback)).init(allocator),
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *Self) void {
        var it = self.listeners.iterator();
        while (it.next()) |entry| {
            entry.value_ptr.deinit();
        }
        self.listeners.deinit();
    }
    
    pub fn on(self: *Self, event_name: []const u8, callback: EventCallback) !void {
        const result = try self.listeners.getOrPut(event_name);
        if (!result.found_existing) {
            result.value_ptr.* = std.ArrayList(EventCallback).init(self.allocator);
        }
        try result.value_ptr.append(callback);
    }
    
    pub fn off(self: *Self, event_name: []const u8, callback: EventCallback) bool {
        if (self.listeners.getPtr(event_name)) |callbacks| {
            var i: usize = 0;
            while (i < callbacks.items.len) {
                if (callbacks.items[i] == callback) {
                    _ = callbacks.swapRemove(i);
                    return true;
                }
                i += 1;
            }
        }
        return false;
    }
    
    pub fn emit(self: *Self, event: Event) void {
        const event_name = if (event.event_type == .custom)
            event.custom_name orelse return
        else
            @tagName(event.event_type);
            
        if (self.listeners.get(event_name)) |callbacks| {
            for (callbacks.items) |callback| {
                callback(event);
            }
        }
    }
    
    pub fn once(self: *Self, event_name: []const u8, callback: EventCallback) !void {
        const wrapper = struct {
            var emitter: ?*EventEmitter = null;
            var original_callback: ?EventCallback = null;
            var name: ?[]const u8 = null;
            
            fn onceCallback(event: Event) void {
                if (original_callback) |cb| {
                    cb(event);
                }
                if (emitter) |em| {
                    if (name) |n| {
                        _ = em.off(n, onceCallback);
                    }
                }
            }
        };
        
        wrapper.emitter = self;
        wrapper.original_callback = callback;
        wrapper.name = event_name;
        
        try self.on(event_name, wrapper.onceCallback);
    }
};

// Global event emitter
var global_emitter: ?EventEmitter = null;

pub fn initGlobalEmitter(allocator: std.mem.Allocator) void {
    global_emitter = EventEmitter.init(allocator);
}

pub fn deinitGlobalEmitter() void {
    if (global_emitter) |*emitter| {
        emitter.deinit();
        global_emitter = null;
    }
}

pub fn on(event_name: []const u8, callback: EventCallback) !void {
    if (global_emitter) |*emitter| {
        try emitter.on(event_name, callback);
    }
}

pub fn off(event_name: []const u8, callback: EventCallback) bool {
    if (global_emitter) |*emitter| {
        return emitter.off(event_name, callback);
    }
    return false;
}

pub fn emit(event: Event) void {
    if (global_emitter) |*emitter| {
        emitter.emit(event);
    }
}

pub fn once(event_name: []const u8, callback: EventCallback) !void {
    if (global_emitter) |*emitter| {
        try emitter.once(event_name, callback);
    }
}
