const std = @import("std");
const memory = @import("memory.zig");

pub const ProfileEntry = struct {
    name: []const u8,
    start_time: i64,
    end_time: i64,
    duration_ms: f64,
    memory_before: usize,
    memory_after: usize,
};

pub const Profiler = struct {
    entries: std.ArrayList(ProfileEntry),
    active_profiles: std.StringHashMap(i64),
    memory_tracker: ?*memory.TrackingAllocator,
    allocator: std.mem.Allocator,
    enabled: bool = true,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .entries = std.ArrayList(ProfileEntry).init(allocator),
            .active_profiles = std.StringHashMap(i64).init(allocator),
            .memory_tracker = null,
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.entries.deinit();
        self.active_profiles.deinit();
    }
    
    pub fn setMemoryTracker(self: *Self, tracker: *memory.TrackingAllocator) void {
        self.memory_tracker = tracker;
    }
    
    pub fn start(self: *Self, name: []const u8) !void {
        if (!self.enabled) return;
        
        const start_time = std.time.milliTimestamp();
        try self.active_profiles.put(name, start_time);
    }
    
    pub fn end(self: *Self, name: []const u8) !void {
        if (!self.enabled) return;
        
        const end_time = std.time.milliTimestamp();
        const start_time = self.active_profiles.get(name) orelse return;
        _ = self.active_profiles.remove(name);
        
        const duration_ms = @as(f64, @floatFromInt(end_time - start_time));
        
        var memory_before: usize = 0;
        var memory_after: usize = 0;
        
        if (self.memory_tracker) |tracker| {
            const stats = tracker.getStats();
            memory_after = stats.current_memory;
        }
        
        try self.entries.append(.{
            .name = name,
            .start_time = start_time,
            .end_time = end_time,
            .duration_ms = duration_ms,
            .memory_before = memory_before,
            .memory_after = memory_after,
        });
    }
    
    pub fn measure(self: *Self, comptime name: []const u8, comptime func: anytype, args: anytype) !@TypeOf(@call(.auto, func, args)) {
        try self.start(name);
        defer self.end(name) catch {};
        return @call(.auto, func, args);
    }
    
    pub fn getReport(self: Self) ![]const u8 {
        var report = std.ArrayList(u8).init(self.allocator);
        const writer = report.writer();
        
        try writer.writeAll("\n=== Performance Profile Report ===\n\n");
        
        if (self.entries.items.len == 0) {
            try writer.writeAll("No profiling data collected.\n");
            return report.toOwnedSlice();
        }
        
        // Calculate totals and averages
        var total_time: f64 = 0;
        var slowest: ?ProfileEntry = null;
        var fastest: ?ProfileEntry = null;
        
        for (self.entries.items) |entry| {
            total_time += entry.duration_ms;
            
            if (slowest == null or entry.duration_ms > slowest.?.duration_ms) {
                slowest = entry;
            }
            if (fastest == null or entry.duration_ms < fastest.?.duration_ms) {
                fastest = entry;
            }
        }
        
        const avg_time = total_time / @as(f64, @floatFromInt(self.entries.items.len));
        
        try writer.print("Total entries: {d}\n", .{self.entries.items.len});
        try writer.print("Total time: {d:.2}ms\n", .{total_time});
        try writer.print("Average time: {d:.2}ms\n\n", .{avg_time});
        
        if (slowest) |s| {
            try writer.print("Slowest: {s} ({d:.2}ms)\n", .{ s.name, s.duration_ms });
        }
        if (fastest) |f| {
            try writer.print("Fastest: {s} ({d:.2}ms)\n\n", .{ f.name, f.duration_ms });
        }
        
        try writer.writeAll("Individual Entries:\n");
        try writer.writeAll("------------------\n");
        
        for (self.entries.items) |entry| {
            try writer.print("{s:30} {d:8.2}ms", .{ entry.name, entry.duration_ms });
            
            if (entry.memory_after > 0) {
                try writer.print("  (mem: {d} bytes)", .{entry.memory_after});
            }
            
            try writer.writeAll("\n");
        }
        
        return report.toOwnedSlice();
    }
    
    pub fn printReport(self: Self) !void {
        const report = try self.getReport();
        defer self.allocator.free(report);
        std.debug.print("{s}\n", .{report});
    }
    
    pub fn clear(self: *Self) void {
        self.entries.clearRetainingCapacity();
        self.active_profiles.clearRetainingCapacity();
    }
    
    pub fn getHTMLDashboard(self: Self) ![]const u8 {
        var html = std.ArrayList(u8).init(self.allocator);
        const writer = html.writer();
        
        try writer.writeAll(
            \\<!DOCTYPE html>
            \\<html>
            \\<head>
            \\  <meta charset="UTF-8">
            \\  <title>Zyte Performance Dashboard</title>
            \\  <style>
            \\    * { margin: 0; padding: 0; box-sizing: border-box; }
            \\    body {
            \\      font-family: -apple-system, system-ui, sans-serif;
            \\      background: #1a1a1a;
            \\      color: #e0e0e0;
            \\      padding: 20px;
            \\    }
            \\    .container { max-width: 1200px; margin: 0 auto; }
            \\    h1 { color: #00ffff; margin-bottom: 20px; }
            \\    .stats {
            \\      display: grid;
            \\      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            \\      gap: 20px;
            \\      margin-bottom: 30px;
            \\    }
            \\    .stat-card {
            \\      background: #2a2a2a;
            \\      padding: 20px;
            \\      border-radius: 8px;
            \\      border-left: 4px solid #00ffff;
            \\    }
            \\    .stat-label { color: #888; font-size: 14px; margin-bottom: 5px; }
            \\    .stat-value { font-size: 32px; font-weight: bold; color: #00ff00; }
            \\    table {
            \\      width: 100%;
            \\      background: #2a2a2a;
            \\      border-radius: 8px;
            \\      overflow: hidden;
            \\    }
            \\    th, td {
            \\      padding: 12px;
            \\      text-align: left;
            \\      border-bottom: 1px solid #3a3a3a;
            \\    }
            \\    th { background: #333; color: #00ffff; }
            \\    tr:hover { background: #333; }
            \\    .slow { color: #ff4444; }
            \\    .fast { color: #00ff00; }
            \\  </style>
            \\</head>
            \\<body>
            \\  <div class="container">
            \\    <h1>⚡ Zyte Performance Dashboard</h1>
            \\
        );
        
        // Calculate stats
        var total_time: f64 = 0;
        for (self.entries.items) |entry| {
            total_time += entry.duration_ms;
        }
        
        const avg_time = if (self.entries.items.len > 0)
            total_time / @as(f64, @floatFromInt(self.entries.items.len))
        else
            0;
        
        try writer.print(
            \\    <div class="stats">
            \\      <div class="stat-card">
            \\        <div class="stat-label">Total Entries</div>
            \\        <div class="stat-value">{d}</div>
            \\      </div>
            \\      <div class="stat-card">
            \\        <div class="stat-label">Total Time</div>
            \\        <div class="stat-value">{d:.2}ms</div>
            \\      </div>
            \\      <div class="stat-card">
            \\        <div class="stat-label">Average Time</div>
            \\        <div class="stat-value">{d:.2}ms</div>
            \\      </div>
            \\    </div>
            \\
        , .{ self.entries.items.len, total_time, avg_time });
        
        try writer.writeAll(
            \\    <table>
            \\      <thead>
            \\        <tr>
            \\          <th>Operation</th>
            \\          <th>Duration</th>
            \\          <th>Memory</th>
            \\          <th>Status</th>
            \\        </tr>
            \\      </thead>
            \\      <tbody>
            \\
        );
        
        for (self.entries.items) |entry| {
            const status_class = if (entry.duration_ms > 16.67) "slow" else "fast";
            const status_text = if (entry.duration_ms > 16.67) "Slow" else "Fast";
            
            try writer.print(
                \\        <tr>
                \\          <td>{s}</td>
                \\          <td>{d:.2}ms</td>
                \\          <td>{d} bytes</td>
                \\          <td class="{s}">{s}</td>
                \\        </tr>
                \\
            , .{ entry.name, entry.duration_ms, entry.memory_after, status_class, status_text });
        }
        
        try writer.writeAll(
            \\      </tbody>
            \\    </table>
            \\  </div>
            \\</body>
            \\</html>
        );
        
        return html.toOwnedSlice();
    }
};

// Global profiler instance
var global_profiler: ?Profiler = null;

pub fn initGlobalProfiler(allocator: std.mem.Allocator) void {
    global_profiler = Profiler.init(allocator);
}

pub fn deinitGlobalProfiler() void {
    if (global_profiler) |*p| {
        p.deinit();
        global_profiler = null;
    }
}

pub fn start(name: []const u8) !void {
    if (global_profiler) |*p| {
        try p.start(name);
    }
}

pub fn end(name: []const u8) !void {
    if (global_profiler) |*p| {
        try p.end(name);
    }
}

pub fn printReport() !void {
    if (global_profiler) |*p| {
        try p.printReport();
    }
}
