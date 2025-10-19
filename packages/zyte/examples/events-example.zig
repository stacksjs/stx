const std = @import("std");
const events = @import("../src/events.zig");
const log = @import("../src/log.zig");

fn onWindowCreated(event: events.Event) void {
    log.info("Window created at timestamp: {d}", .{event.timestamp});
}

fn onWindowClosed(event: events.Event) void {
    log.info("Window closed at timestamp: {d}", .{event.timestamp});
}

fn onCustomEvent(event: events.Event) void {
    if (event.custom_name) |name| {
        log.info("Custom event received: {s}", .{name});
    }
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize logging
    try log.init(.{ .min_level = .Info });
    defer log.deinit();

    log.info("=== Event System Examples ===", .{});

    // Initialize global event emitter
    events.initGlobalEmitter(allocator);
    defer events.deinitGlobalEmitter();

    // Register event listeners
    try events.on("window_created", onWindowCreated);
    try events.on("window_closed", onWindowClosed);
    try events.on("my_custom_event", onCustomEvent);

    // Emit events
    events.emit(.{
        .event_type = .window_created,
        .timestamp = std.time.timestamp(),
    });

    events.emit(.{
        .event_type = .window_closed,
        .timestamp = std.time.timestamp(),
    });

    events.emit(.{
        .event_type = .custom,
        .custom_name = "my_custom_event",
        .timestamp = std.time.timestamp(),
    });

    // Example of once() - runs only one time
    try events.once("window_resized", onCustomEvent);
    
    log.info("=== Events example complete ===", .{});
}
