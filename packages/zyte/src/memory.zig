const std = @import("std");

/// Memory pool for efficient allocations
pub const MemoryPool = struct {
    arena: std.heap.ArenaAllocator,
    allocator: std.mem.Allocator,
    
    const Self = @This();
    
    pub fn init(backing_allocator: std.mem.Allocator) Self {
        return .{
            .arena = std.heap.ArenaAllocator.init(backing_allocator),
            .allocator = undefined,
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.arena.deinit();
    }
    
    pub fn allocator(self: *Self) std.mem.Allocator {
        return self.arena.allocator();
    }
    
    pub fn reset(self: *Self) void {
        _ = self.arena.reset(.retain_capacity);
    }
    
    pub fn resetFree(self: *Self) void {
        _ = self.arena.reset(.free_all);
    }
};

/// Stack-based temporary allocator
pub const TempAllocator = struct {
    fba: std.heap.FixedBufferAllocator,
    
    const Self = @This();
    
    pub fn init(buffer: []u8) Self {
        return .{
            .fba = std.heap.FixedBufferAllocator.init(buffer),
        };
    }
    
    pub fn allocator(self: *Self) std.mem.Allocator {
        return self.fba.allocator();
    }
    
    pub fn reset(self: *Self) void {
        self.fba.reset();
    }
};

/// Memory statistics and tracking
pub const MemoryStats = struct {
    allocations: usize = 0,
    deallocations: usize = 0,
    bytes_allocated: usize = 0,
    bytes_freed: usize = 0,
    peak_memory: usize = 0,
    current_memory: usize = 0,
    
    pub fn recordAlloc(self: *MemoryStats, size: usize) void {
        self.allocations += 1;
        self.bytes_allocated += size;
        self.current_memory += size;
        if (self.current_memory > self.peak_memory) {
            self.peak_memory = self.current_memory;
        }
    }
    
    pub fn recordFree(self: *MemoryStats, size: usize) void {
        self.deallocations += 1;
        self.bytes_freed += size;
        if (size <= self.current_memory) {
            self.current_memory -= size;
        } else {
            self.current_memory = 0;
        }
    }
    
    pub fn print(self: MemoryStats) void {
        std.debug.print(
            \\Memory Statistics:
            \\  Allocations: {d}
            \\  Deallocations: {d}
            \\  Bytes allocated: {d}
            \\  Bytes freed: {d}
            \\  Current memory: {d}
            \\  Peak memory: {d}
            \\
        , .{
            self.allocations,
            self.deallocations,
            self.bytes_allocated,
            self.bytes_freed,
            self.current_memory,
            self.peak_memory,
        });
    }
};

/// Tracking allocator wrapper
pub const TrackingAllocator = struct {
    parent_allocator: std.mem.Allocator,
    stats: MemoryStats,
    
    const Self = @This();
    
    pub fn init(parent: std.mem.Allocator) Self {
        return .{
            .parent_allocator = parent,
            .stats = .{},
        };
    }
    
    pub fn allocator(self: *Self) std.mem.Allocator {
        return .{
            .ptr = self,
            .vtable = &.{
                .alloc = alloc,
                .resize = resize,
                .free = free,
            },
        };
    }
    
    fn alloc(ctx: *anyopaque, len: usize, ptr_align: u8, ret_addr: usize) ?[*]u8 {
        const self: *Self = @ptrCast(@alignCast(ctx));
        const result = self.parent_allocator.rawAlloc(len, ptr_align, ret_addr);
        if (result) |_| {
            self.stats.recordAlloc(len);
        }
        return result;
    }
    
    fn resize(ctx: *anyopaque, buf: []u8, buf_align: u8, new_len: usize, ret_addr: usize) bool {
        const self: *Self = @ptrCast(@alignCast(ctx));
        const result = self.parent_allocator.rawResize(buf, buf_align, new_len, ret_addr);
        if (result) {
            if (new_len > buf.len) {
                self.stats.recordAlloc(new_len - buf.len);
            } else {
                self.stats.recordFree(buf.len - new_len);
            }
        }
        return result;
    }
    
    fn free(ctx: *anyopaque, buf: []u8, buf_align: u8, ret_addr: usize) void {
        const self: *Self = @ptrCast(@alignCast(ctx));
        self.parent_allocator.rawFree(buf, buf_align, ret_addr);
        self.stats.recordFree(buf.len);
    }
    
    pub fn getStats(self: *Self) MemoryStats {
        return self.stats;
    }
    
    pub fn printStats(self: *Self) void {
        self.stats.print();
    }
};

/// Helper function to create a scoped arena
pub fn createArena(backing_allocator: std.mem.Allocator) !MemoryPool {
    return MemoryPool.init(backing_allocator);
}

/// Helper function to create a temp allocator with a stack buffer
pub fn createTempAllocator(comptime size: usize) !struct { buffer: [size]u8, allocator: TempAllocator } {
    var result = .{
        .buffer = undefined,
        .allocator = undefined,
    };
    result.allocator = TempAllocator.init(&result.buffer);
    return result;
}
