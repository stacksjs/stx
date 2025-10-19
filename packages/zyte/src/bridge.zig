const std = @import("std");
const builtin = @import("builtin");

/// JavaScript bridge for Zig <-> Web communication
/// Allows JavaScript to call Zig functions and Zig to evaluate JavaScript

pub const MessageHandler = *const fn (message: []const u8) anyerror![]const u8;

pub const Bridge = struct {
    allocator: std.mem.Allocator,
    handlers: std.StringHashMap(MessageHandler),

    const Self = @This();

    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .allocator = allocator,
            .handlers = std.StringHashMap(MessageHandler).init(allocator),
        };
    }

    pub fn deinit(self: *Self) void {
        self.handlers.deinit();
    }

    /// Register a handler for messages from JavaScript
    pub fn registerHandler(self: *Self, name: []const u8, handler: MessageHandler) !void {
        try self.handlers.put(name, handler);
    }

    /// Handle a message from JavaScript
    pub fn handleMessage(self: *Self, name: []const u8, message: []const u8) ![]const u8 {
        const handler = self.handlers.get(name) orelse return error.HandlerNotFound;
        return try handler(message);
    }

    /// Generate JavaScript code to inject into the WebView
    pub fn generateInjectionScript(self: *Self) ![]const u8 {
        _ = self;
        return
            \\window.zyte = {
            \\    // Send a message to Zig
            \\    send: function(name, data) {
            \\        return new Promise((resolve, reject) => {
            \\            const message = JSON.stringify({ name: name, data: data });
            \\            window.webkit.messageHandlers.zyte.postMessage(message)
            \\                .then(resolve)
            \\                .catch(reject);
            \\        });
            \\    },
            \\
            \\    // Convenience methods
            \\    notify: function(message) {
            \\        return this.send('notify', { message: message });
            \\    },
            \\
            \\    readFile: function(path) {
            \\        return this.send('readFile', { path: path });
            \\    },
            \\
            \\    writeFile: function(path, content) {
            \\        return this.send('writeFile', { path: path, content: content });
            \\    },
            \\
            \\    openDialog: function(options) {
            \\        return this.send('openDialog', options);
            \\    },
            \\
            \\    getClipboard: function() {
            \\        return this.send('getClipboard', {});
            \\    },
            \\
            \\    setClipboard: function(text) {
            \\        return this.send('setClipboard', { text: text });
            \\    },
            \\
            \\    // Platform info
            \\    platform: 'macos',
            \\    version: '0.2.0'
            \\};
            \\
            \\// Emit ready event
            \\window.dispatchEvent(new CustomEvent('zyte:ready'));
        ;
    }
};

// Example handler functions
pub fn notifyHandler(message: []const u8) ![]const u8 {
    std.debug.print("Notification from web: {s}\n", .{message});
    return "OK";
}

pub fn readFileHandler(message: []const u8) ![]const u8 {
    // Parse JSON to get file path
    // Read file
    // Return contents
    _ = message;
    return "File contents here";
}

pub fn writeFileHandler(message: []const u8) ![]const u8 {
    // Parse JSON to get path and content
    // Write file
    // Return success
    _ = message;
    return "OK";
}
