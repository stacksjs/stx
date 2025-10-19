const std = @import("std");
const memory = @import("../src/memory.zig");
const log = @import("../src/log.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize logging
    try log.init(.{ .min_level = .Debug });
    defer log.deinit();

    log.info("=== Memory Management Examples ===", .{});

    // Example 1: Using arena allocator
    {
        log.info("Example 1: Arena Allocator", .{});
        var pool = memory.MemoryPool.init(allocator);
        defer pool.deinit();

        const arena_alloc = pool.allocator();
        const str1 = try arena_alloc.dupe(u8, "Hello");
        const str2 = try arena_alloc.dupe(u8, "World");
        
        log.debug("Allocated: '{s}' and '{s}'", .{ str1, str2 });
        
        // All memory freed at once when pool.deinit() is called
        log.info("Arena will free all memory on deinit", .{});
    }

    // Example 2: Tracking allocator
    {
        log.info("Example 2: Tracking Allocator", .{});
        var tracker = memory.TrackingAllocator.init(allocator);
        const tracked_alloc = tracker.allocator();

        const data1 = try tracked_alloc.alloc(u8, 100);
        defer tracked_alloc.free(data1);
        
        const data2 = try tracked_alloc.alloc(u32, 50);
        defer tracked_alloc.free(data2);

        log.info("Memory statistics:", .{});
        tracker.printStats();
    }

    // Example 3: Temp allocator for short-lived allocations
    {
        log.info("Example 3: Temporary Stack-Based Allocator", .{});
        var buffer: [4096]u8 = undefined;
        var temp = memory.TempAllocator.init(&buffer);
        const temp_alloc = temp.allocator();

        const temp_data = try temp_alloc.alloc(u8, 256);
        @memset(temp_data, 'A');
        
        log.debug("Temp data created on stack", .{});
        
        // Reset for reuse
        temp.reset();
        log.info("Temp allocator reset for reuse", .{});
    }

    log.info("=== All examples complete ===", .{});
}
