const std = @import("std");

/// Performance Optimization Module
/// Provides caching, pooling, and optimization utilities

pub const Cache = struct {
    entries: std.StringHashMap(CacheEntry),
    max_size: usize,
    current_size: usize,
    allocator: std.mem.Allocator,

    const CacheEntry = struct {
        data: []const u8,
        timestamp: i64,
        access_count: usize,
        size: usize,
    };

    pub fn init(allocator: std.mem.Allocator, max_size: usize) Cache {
        return Cache{
            .entries = std.StringHashMap(CacheEntry).init(allocator),
            .max_size = max_size,
            .current_size = 0,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Cache) void {
        var iter = self.entries.valueIterator();
        while (iter.next()) |entry| {
            self.allocator.free(entry.data);
        }
        self.entries.deinit();
    }

    pub fn get(self: *Cache, key: []const u8) ?[]const u8 {
        if (self.entries.getPtr(key)) |entry| {
            entry.access_count += 1;
            entry.timestamp = std.time.milliTimestamp();
            return entry.data;
        }
        return null;
    }

    pub fn put(self: *Cache, key: []const u8, data: []const u8) !void {
        const size = data.len;

        // Evict if necessary
        while (self.current_size + size > self.max_size and self.entries.count() > 0) {
            try self.evictLRU();
        }

        const owned_data = try self.allocator.dupe(u8, data);
        const entry = CacheEntry{
            .data = owned_data,
            .timestamp = std.time.milliTimestamp(),
            .access_count = 0,
            .size = size,
        };

        try self.entries.put(key, entry);
        self.current_size += size;
    }

    pub fn remove(self: *Cache, key: []const u8) void {
        if (self.entries.fetchRemove(key)) |kv| {
            self.allocator.free(kv.value.data);
            self.current_size -= kv.value.size;
        }
    }

    pub fn clear(self: *Cache) void {
        var iter = self.entries.valueIterator();
        while (iter.next()) |entry| {
            self.allocator.free(entry.data);
        }
        self.entries.clearRetainingCapacity();
        self.current_size = 0;
    }

    fn evictLRU(self: *Cache) !void {
        var oldest_key: ?[]const u8 = null;
        var oldest_time: i64 = std.math.maxInt(i64);

        var iter = self.entries.iterator();
        while (iter.next()) |entry| {
            if (entry.value_ptr.timestamp < oldest_time) {
                oldest_time = entry.value_ptr.timestamp;
                oldest_key = entry.key_ptr.*;
            }
        }

        if (oldest_key) |key| {
            self.remove(key);
        }
    }

    pub fn getHitRate(self: Cache) f64 {
        var total_accesses: usize = 0;
        var iter = self.entries.valueIterator();
        while (iter.next()) |entry| {
            total_accesses += entry.access_count;
        }

        if (total_accesses == 0) return 0.0;
        return @as(f64, @floatFromInt(self.entries.count())) / @as(f64, @floatFromInt(total_accesses));
    }
};

pub const ObjectPool = struct {
    available: std.ArrayList(*anyopaque),
    in_use: std.ArrayList(*anyopaque),
    create_fn: *const fn (std.mem.Allocator) anyerror!*anyopaque,
    destroy_fn: *const fn (*anyopaque, std.mem.Allocator) void,
    reset_fn: ?*const fn (*anyopaque) void,
    allocator: std.mem.Allocator,
    max_size: usize,

    pub fn init(
        allocator: std.mem.Allocator,
        max_size: usize,
        create_fn: *const fn (std.mem.Allocator) anyerror!*anyopaque,
        destroy_fn: *const fn (*anyopaque, std.mem.Allocator) void,
        reset_fn: ?*const fn (*anyopaque) void,
    ) ObjectPool {
        return ObjectPool{
            .available = std.ArrayList(*anyopaque).init(allocator),
            .in_use = std.ArrayList(*anyopaque).init(allocator),
            .create_fn = create_fn,
            .destroy_fn = destroy_fn,
            .reset_fn = reset_fn,
            .allocator = allocator,
            .max_size = max_size,
        };
    }

    pub fn deinit(self: *ObjectPool) void {
        for (self.available.items) |obj| {
            self.destroy_fn(obj, self.allocator);
        }
        for (self.in_use.items) |obj| {
            self.destroy_fn(obj, self.allocator);
        }
        self.available.deinit();
        self.in_use.deinit();
    }

    pub fn acquire(self: *ObjectPool) !*anyopaque {
        if (self.available.popOrNull()) |obj| {
            try self.in_use.append(obj);
            return obj;
        }

        if (self.in_use.items.len < self.max_size) {
            const obj = try self.create_fn(self.allocator);
            try self.in_use.append(obj);
            return obj;
        }

        return error.PoolExhausted;
    }

    pub fn release(self: *ObjectPool, obj: *anyopaque) !void {
        for (self.in_use.items, 0..) |item, i| {
            if (item == obj) {
                _ = self.in_use.swapRemove(i);

                if (self.reset_fn) |reset| {
                    reset(obj);
                }

                try self.available.append(obj);
                return;
            }
        }
    }

    pub fn availableCount(self: ObjectPool) usize {
        return self.available.items.len;
    }

    pub fn inUseCount(self: ObjectPool) usize {
        return self.in_use.items.len;
    }
};

pub const LazyLoader = struct {
    loaded: bool,
    load_fn: *const fn () anyerror!void,
    mutex: std.Thread.Mutex,

    pub fn init(load_fn: *const fn () anyerror!void) LazyLoader {
        return LazyLoader{
            .loaded = false,
            .load_fn = load_fn,
            .mutex = std.Thread.Mutex{},
        };
    }

    pub fn load(self: *LazyLoader) !void {
        if (self.loaded) return;

        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.loaded) return;

        try self.load_fn();
        self.loaded = true;
    }

    pub fn isLoaded(self: LazyLoader) bool {
        return self.loaded;
    }
};

pub const Debouncer = struct {
    delay_ms: u64,
    last_call: i64,
    timer: ?std.time.Timer,
    callback: *const fn () void,

    pub fn init(delay_ms: u64, callback: *const fn () void) Debouncer {
        return Debouncer{
            .delay_ms = delay_ms,
            .last_call = 0,
            .timer = null,
            .callback = callback,
        };
    }

    pub fn call(self: *Debouncer) void {
        const now = std.time.milliTimestamp();
        self.last_call = now;

        // In a real implementation, would use a timer thread
        // For now, just track the last call time
    }

    pub fn shouldExecute(self: Debouncer) bool {
        const now = std.time.milliTimestamp();
        const elapsed = now - self.last_call;
        return elapsed >= self.delay_ms;
    }
};

pub const Throttler = struct {
    interval_ms: u64,
    last_execution: i64,
    callback: *const fn () void,

    pub fn init(interval_ms: u64, callback: *const fn () void) Throttler {
        return Throttler{
            .interval_ms = interval_ms,
            .last_execution = 0,
            .callback = callback,
        };
    }

    pub fn call(self: *Throttler) void {
        const now = std.time.milliTimestamp();
        const elapsed = now - self.last_execution;

        if (elapsed >= self.interval_ms) {
            self.callback();
            self.last_execution = now;
        }
    }
};

pub const BatchProcessor = struct {
    items: std.ArrayList(*anyopaque),
    batch_size: usize,
    process_fn: *const fn ([]const *anyopaque) void,
    allocator: std.mem.Allocator,

    pub fn init(
        allocator: std.mem.Allocator,
        batch_size: usize,
        process_fn: *const fn ([]const *anyopaque) void,
    ) BatchProcessor {
        return BatchProcessor{
            .items = std.ArrayList(*anyopaque).init(allocator),
            .batch_size = batch_size,
            .process_fn = process_fn,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *BatchProcessor) void {
        self.flush();
        self.items.deinit();
    }

    pub fn add(self: *BatchProcessor, item: *anyopaque) !void {
        try self.items.append(item);

        if (self.items.items.len >= self.batch_size) {
            self.flush();
        }
    }

    pub fn flush(self: *BatchProcessor) void {
        if (self.items.items.len == 0) return;

        self.process_fn(self.items.items);
        self.items.clearRetainingCapacity();
    }
};

pub const Memoizer = struct {
    cache: std.StringHashMap([]const u8),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) Memoizer {
        return Memoizer{
            .cache = std.StringHashMap([]const u8).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Memoizer) void {
        var iter = self.cache.valueIterator();
        while (iter.next()) |value| {
            self.allocator.free(value.*);
        }
        self.cache.deinit();
    }

    pub fn get(self: *Memoizer, key: []const u8) ?[]const u8 {
        return self.cache.get(key);
    }

    pub fn put(self: *Memoizer, key: []const u8, value: []const u8) !void {
        const owned_value = try self.allocator.dupe(u8, value);
        try self.cache.put(key, owned_value);
    }

    pub fn clear(self: *Memoizer) void {
        var iter = self.cache.valueIterator();
        while (iter.next()) |value| {
            self.allocator.free(value.*);
        }
        self.cache.clearRetainingCapacity();
    }
};

pub const WorkQueue = struct {
    tasks: std.ArrayList(Task),
    workers: std.ArrayList(std.Thread),
    running: bool,
    mutex: std.Thread.Mutex,
    condition: std.Thread.Condition,
    allocator: std.mem.Allocator,

    const Task = struct {
        fn_ptr: *const fn (*anyopaque) void,
        context: *anyopaque,
    };

    pub fn init(allocator: std.mem.Allocator, worker_count: usize) !WorkQueue {
        var queue = WorkQueue{
            .tasks = std.ArrayList(Task).init(allocator),
            .workers = std.ArrayList(std.Thread).init(allocator),
            .running = true,
            .mutex = std.Thread.Mutex{},
            .condition = std.Thread.Condition{},
            .allocator = allocator,
        };

        // Start worker threads
        var i: usize = 0;
        while (i < worker_count) : (i += 1) {
            const thread = try std.Thread.spawn(.{}, workerThread, .{&queue});
            try queue.workers.append(thread);
        }

        return queue;
    }

    pub fn deinit(self: *WorkQueue) void {
        self.running = false;
        self.condition.broadcast();

        for (self.workers.items) |thread| {
            thread.join();
        }

        self.workers.deinit();
        self.tasks.deinit();
    }

    pub fn submit(self: *WorkQueue, fn_ptr: *const fn (*anyopaque) void, context: *anyopaque) !void {
        self.mutex.lock();
        defer self.mutex.unlock();

        try self.tasks.append(Task{
            .fn_ptr = fn_ptr,
            .context = context,
        });

        self.condition.signal();
    }

    fn workerThread(queue: *WorkQueue) void {
        while (queue.running) {
            queue.mutex.lock();

            while (queue.tasks.items.len == 0 and queue.running) {
                queue.condition.wait(&queue.mutex);
            }

            if (!queue.running) {
                queue.mutex.unlock();
                break;
            }

            const task = queue.tasks.orderedRemove(0);
            queue.mutex.unlock();

            task.fn_ptr(task.context);
        }
    }
};

pub const ResourcePreloader = struct {
    resources: std.StringHashMap([]const u8),
    loading: std.StringHashMap(bool),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) ResourcePreloader {
        return ResourcePreloader{
            .resources = std.StringHashMap([]const u8).init(allocator),
            .loading = std.StringHashMap(bool).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *ResourcePreloader) void {
        var iter = self.resources.valueIterator();
        while (iter.next()) |value| {
            self.allocator.free(value.*);
        }
        self.resources.deinit();
        self.loading.deinit();
    }

    pub fn preload(self: *ResourcePreloader, path: []const u8) !void {
        if (self.resources.contains(path)) return;
        if (self.loading.contains(path)) return;

        try self.loading.put(path, true);

        // Load resource (simplified)
        const data = try self.allocator.dupe(u8, "resource data");
        try self.resources.put(path, data);

        _ = self.loading.remove(path);
    }

    pub fn get(self: ResourcePreloader, path: []const u8) ?[]const u8 {
        return self.resources.get(path);
    }

    pub fn isLoading(self: ResourcePreloader, path: []const u8) bool {
        return self.loading.contains(path);
    }
};
