const std = @import("std");
const zyte = @import("zyte");
const lifecycle = @import("../src/lifecycle.zig");
const log = @import("../src/log.zig");

fn onAppStart() !void {
    log.info("Application starting up...", .{});
    // Initialize resources
}

fn onAppStop() !void {
    log.info("Application shutting down...", .{});
    // Cleanup resources
}

fn beforeStart() !void {
    log.debug("Preparing to start...", .{});
}

fn afterStart() !void {
    log.info("Application fully started!", .{});
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize logging
    try log.init(.{
        .min_level = .Debug,
        .enable_colors = true,
        .enable_timestamps = true,
    });
    defer log.deinit();

    // Create lifecycle manager
    var lc = lifecycle.Lifecycle.init(allocator);
    defer lc.deinit();

    // Register lifecycle hooks
    try lc.beforeStart(beforeStart);
    try lc.onStart(onAppStart);
    try lc.afterStart(afterStart);
    try lc.onStop(onAppStop);

    // Start the application
    try lc.start();

    // Create window
    var app = zyte.App.init(allocator);
    defer app.deinit();

    _ = try app.createWindowWithURL(
        "Lifecycle Example",
        1000,
        700,
        "http://localhost:3000",
        .{
            .dark_mode = true,
        },
    );

    log.info("Window created, running application...", .{});
    
    // This would normally run the event loop
    // try app.run();

    // Stop the application
    try lc.stop();
}
