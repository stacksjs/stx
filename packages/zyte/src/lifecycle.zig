const std = @import("std");

pub const LifecyclePhase = enum {
    initializing,
    starting,
    running,
    pausing,
    paused,
    resuming,
    stopping,
    stopped,
};

pub const LifecycleHook = *const fn () anyerror!void;

pub const Lifecycle = struct {
    phase: LifecyclePhase,
    hooks: std.StringHashMap(std.ArrayList(LifecycleHook)),
    allocator: std.mem.Allocator,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .phase = .initializing,
            .hooks = std.StringHashMap(std.ArrayList(LifecycleHook)).init(allocator),
            .allocator = allocator,
        };
    }
    
    pub fn deinit(self: *Self) void {
        var it = self.hooks.iterator();
        while (it.next()) |entry| {
            entry.value_ptr.deinit();
        }
        self.hooks.deinit();
    }
    
    pub fn registerHook(self: *Self, phase_name: []const u8, hook: LifecycleHook) !void {
        const result = try self.hooks.getOrPut(phase_name);
        if (!result.found_existing) {
            result.value_ptr.* = std.ArrayList(LifecycleHook).init(self.allocator);
        }
        try result.value_ptr.append(hook);
    }
    
    pub fn onStart(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("start", hook);
    }
    
    pub fn onStop(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("stop", hook);
    }
    
    pub fn onPause(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("pause", hook);
    }
    
    pub fn onResume(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("resume", hook);
    }
    
    pub fn beforeStart(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("before_start", hook);
    }
    
    pub fn afterStart(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("after_start", hook);
    }
    
    pub fn beforeStop(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("before_stop", hook);
    }
    
    pub fn afterStop(self: *Self, hook: LifecycleHook) !void {
        try self.registerHook("after_stop", hook);
    }
    
    fn runHooks(self: *Self, phase_name: []const u8) !void {
        if (self.hooks.get(phase_name)) |hooks_list| {
            for (hooks_list.items) |hook| {
                try hook();
            }
        }
    }
    
    pub fn start(self: *Self) !void {
        try self.runHooks("before_start");
        self.phase = .starting;
        try self.runHooks("start");
        self.phase = .running;
        try self.runHooks("after_start");
    }
    
    pub fn stop(self: *Self) !void {
        try self.runHooks("before_stop");
        self.phase = .stopping;
        try self.runHooks("stop");
        self.phase = .stopped;
        try self.runHooks("after_stop");
    }
    
    pub fn pause(self: *Self) !void {
        self.phase = .pausing;
        try self.runHooks("pause");
        self.phase = .paused;
    }
    
    pub fn resume(self: *Self) !void {
        self.phase = .resuming;
        try self.runHooks("resume");
        self.phase = .running;
    }
    
    pub fn getPhase(self: Self) LifecyclePhase {
        return self.phase;
    }
    
    pub fn isRunning(self: Self) bool {
        return self.phase == .running;
    }
    
    pub fn isPaused(self: Self) bool {
        return self.phase == .paused;
    }
    
    pub fn isStopped(self: Self) bool {
        return self.phase == .stopped;
    }
};
