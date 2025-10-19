const std = @import("std");
const log = @import("log.zig");

pub const HotReloadConfig = struct {
    enabled: bool = true,
    watch_paths: []const []const u8 = &.{},
    ignore_patterns: []const []const u8 = &.{ ".git", "node_modules", ".DS_Store" },
    debounce_ms: u64 = 300,
    auto_reload: bool = true,
    reload_on_save: bool = true,
};

pub const FileWatcher = struct {
    watched_paths: std.StringHashMap(i64),
    ignore_patterns: []const []const u8,
    allocator: std.mem.Allocator,
    last_reload: i64 = 0,
    debounce_ms: u64,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator, config: HotReloadConfig) !Self {
        var watcher = Self{
            .watched_paths = std.StringHashMap(i64).init(allocator),
            .ignore_patterns = config.ignore_patterns,
            .allocator = allocator,
            .debounce_ms = config.debounce_ms,
        };
        
        // Add watch paths
        for (config.watch_paths) |path| {
            try watcher.addPath(path);
        }
        
        return watcher;
    }
    
    pub fn deinit(self: *Self) void {
        self.watched_paths.deinit();
    }
    
    pub fn addPath(self: *Self, path: []const u8) !void {
        const stat = std.fs.cwd().statFile(path) catch |err| {
            log.warn("Failed to stat {s}: {}", .{ path, err });
            return;
        };
        
        const mtime = @as(i64, @intCast(stat.mtime));
        try self.watched_paths.put(path, mtime);
        log.debug("Watching: {s}", .{path});
    }
    
    pub fn check(self: *Self) !bool {
        const now = std.time.milliTimestamp();
        
        // Debounce check
        if (now - self.last_reload < self.debounce_ms) {
            return false;
        }
        
        var iter = self.watched_paths.iterator();
        while (iter.next()) |entry| {
            const path = entry.key_ptr.*;
            const old_mtime = entry.value_ptr.*;
            
            const stat = std.fs.cwd().statFile(path) catch continue;
            const new_mtime = @as(i64, @intCast(stat.mtime));
            
            if (new_mtime > old_mtime) {
                log.info("File changed: {s}", .{path});
                entry.value_ptr.* = new_mtime;
                self.last_reload = now;
                return true;
            }
        }
        
        return false;
    }
    
    fn shouldIgnore(self: Self, path: []const u8) bool {
        for (self.ignore_patterns) |pattern| {
            if (std.mem.indexOf(u8, path, pattern) != null) {
                return true;
            }
        }
        return false;
    }
};

pub const HotReload = struct {
    config: HotReloadConfig,
    watcher: ?FileWatcher = null,
    callback: ?*const fn () void = null,
    allocator: std.mem.Allocator,
    running: bool = false,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator, config: HotReloadConfig) !Self {
        var hr = Self{
            .config = config,
            .allocator = allocator,
        };
        
        if (config.enabled and config.watch_paths.len > 0) {
            hr.watcher = try FileWatcher.init(allocator, config);
        }
        
        return hr;
    }
    
    pub fn deinit(self: *Self) void {
        if (self.watcher) |*w| {
            w.deinit();
        }
    }
    
    pub fn setCallback(self: *Self, callback: *const fn () void) void {
        self.callback = callback;
    }
    
    pub fn start(self: *Self) void {
        self.running = true;
        log.info("Hot reload started", .{});
    }
    
    pub fn stop(self: *Self) void {
        self.running = false;
        log.info("Hot reload stopped", .{});
    }
    
    pub fn poll(self: *Self) !void {
        if (!self.running or self.watcher == null) return;
        
        if (try self.watcher.?.check()) {
            log.info("Changes detected, triggering reload...", .{});
            
            if (self.callback) |cb| {
                cb();
            }
        }
    }
};

// Client-side hot reload script
pub const client_script =
    \\<script>
    \\(function() {
    \\  const WS_URL = 'ws://localhost:3456/_zyte_reload';
    \\  let ws = null;
    \\  let reconnectAttempts = 0;
    \\  const MAX_RECONNECT_ATTEMPTS = 10;
    \\  
    \\  function connect() {
    \\    ws = new WebSocket(WS_URL);
    \\    
    \\    ws.onopen = () => {
    \\      console.log('[Zyte HotReload] Connected');
    \\      reconnectAttempts = 0;
    \\    };
    \\    
    \\    ws.onmessage = (event) => {
    \\      if (event.data === 'reload') {
    \\        console.log('[Zyte HotReload] Reloading...');
    \\        location.reload();
    \\      }
    \\    };
    \\    
    \\    ws.onclose = () => {
    \\      console.log('[Zyte HotReload] Disconnected');
    \\      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    \\        reconnectAttempts++;
    \\        setTimeout(connect, 1000 * reconnectAttempts);
    \\      }
    \\    };
    \\    
    \\    ws.onerror = (error) => {
    \\      console.error('[Zyte HotReload] Error:', error);
    \\    };
    \\  }
    \\  
    \\  connect();
    \\})();
    \\</script>
;
