const std = @import("std");
const log = @import("log.zig");

pub const DebugOverlay = struct {
    enabled: bool = false,
    show_fps: bool = true,
    show_memory: bool = true,
    show_events: bool = true,
    show_network: bool = false,
    position: OverlayPosition = .top_right,
    
    pub const OverlayPosition = enum {
        top_left,
        top_right,
        bottom_left,
        bottom_right,
    };
};

pub const DevMode = struct {
    enabled: bool = false,
    overlay: DebugOverlay = .{},
    verbose_logging: bool = false,
    break_on_errors: bool = false,
    hot_reload_enabled: bool = true,
    profiling_enabled: bool = false,
    
    allocator: std.mem.Allocator,
    
    const Self = @This();
    
    pub fn init(allocator: std.mem.Allocator) Self {
        return .{
            .allocator = allocator,
        };
    }
    
    pub fn enable(self: *Self) void {
        self.enabled = true;
        self.overlay.enabled = true;
        self.verbose_logging = true;
        log.setLevel(.Debug);
        log.info("Developer mode enabled", .{});
    }
    
    pub fn disable(self: *Self) void {
        self.enabled = false;
        self.overlay.enabled = false;
        self.verbose_logging = false;
        log.setLevel(.Info);
        log.info("Developer mode disabled", .{});
    }
    
    pub fn toggle(self: *Self) void {
        if (self.enabled) {
            self.disable();
        } else {
            self.enable();
        }
    }
    
    pub fn getOverlayHTML(self: Self) ![]const u8 {
        if (!self.overlay.enabled) {
            return "";
        }
        
        const position_css = switch (self.overlay.position) {
            .top_left => "top: 10px; left: 10px;",
            .top_right => "top: 10px; right: 10px;",
            .bottom_left => "bottom: 10px; left: 10px;",
            .bottom_right => "bottom: 10px; right: 10px;",
        };
        
        return try std.fmt.allocPrint(self.allocator,
            \\<div id="zyte-debug-overlay" style="
            \\  position: fixed;
            \\  {s}
            \\  background: rgba(0, 0, 0, 0.85);
            \\  color: #00ff00;
            \\  font-family: monospace;
            \\  font-size: 12px;
            \\  padding: 10px;
            \\  border-radius: 5px;
            \\  z-index: 999999;
            \\  min-width: 200px;
            \\  backdrop-filter: blur(10px);
            \\">
            \\  <div style="font-weight: bold; margin-bottom: 5px; color: #00ffff;">
            \\    ⚡ Zyte Dev Mode
            \\  </div>
            \\  <div id="zyte-fps" style="margin: 3px 0;">FPS: <span>--</span></div>
            \\  <div id="zyte-memory" style="margin: 3px 0;">Memory: <span>--</span></div>
            \\  <div id="zyte-events" style="margin: 3px 0;">Events: <span>0</span></div>
            \\  <div style="margin-top: 8px; padding-top: 5px; border-top: 1px solid #333;">
            \\    <div style="font-size: 10px; color: #888;">
            \\      Press Ctrl+Shift+D to toggle
            \\    </div>
            \\  </div>
            \\</div>
            \\<script>
            \\(function() {{
            \\  let frameCount = 0;
            \\  let lastTime = performance.now();
            \\  let eventCount = 0;
            \\  
            \\  function updateOverlay() {{
            \\    frameCount++;
            \\    const now = performance.now();
            \\    const delta = now - lastTime;
            \\    
            \\    if (delta >= 1000) {{
            \\      const fps = Math.round((frameCount * 1000) / delta);
            \\      document.querySelector('#zyte-fps span').textContent = fps;
            \\      frameCount = 0;
            \\      lastTime = now;
            \\      
            \\      // Update memory if available
            \\      if (performance.memory) {{
            \\        const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
            \\        const totalMB = Math.round(performance.memory.totalJSHeapSize / 1048576);
            \\        document.querySelector('#zyte-memory span').textContent = 
            \\          usedMB + ' / ' + totalMB + ' MB';
            \\      }}
            \\    }}
            \\    
            \\    requestAnimationFrame(updateOverlay);
            \\  }}
            \\  
            \\  // Track events
            \\  const originalAddEventListener = EventTarget.prototype.addEventListener;
            \\  EventTarget.prototype.addEventListener = function(...args) {{
            \\    eventCount++;
            \\    document.querySelector('#zyte-events span').textContent = eventCount;
            \\    return originalAddEventListener.apply(this, args);
            \\  }};
            \\  
            \\  // Keyboard shortcut to toggle
            \\  document.addEventListener('keydown', (e) => {{
            \\    if (e.ctrlKey && e.shiftKey && e.key === 'D') {{
            \\      const overlay = document.getElementById('zyte-debug-overlay');
            \\      overlay.style.display = overlay.style.display === 'none' ? 'block' : 'none';
            \\    }}
            \\  }});
            \\  
            \\  updateOverlay();
            \\}})();
            \\</script>
        , .{position_css});
    }
    
    pub fn logEvent(self: Self, event_name: []const u8, data: []const u8) void {
        if (!self.enabled or !self.verbose_logging) return;
        log.debug("Event: {s} - {s}", .{ event_name, data });
    }
    
    pub fn logError(self: Self, err: anyerror, context: []const u8) void {
        log.err("Error in {s}: {}", .{ context, err });
        
        if (self.break_on_errors) {
            log.fatal("Breaking on error (dev mode)", .{});
            // In a real debugger, this would trigger a breakpoint
        }
    }
    
    pub fn logPerformance(self: Self, operation: []const u8, duration_ms: f64) void {
        if (!self.enabled or !self.profiling_enabled) return;
        
        if (duration_ms > 16.67) { // More than 1 frame at 60fps
            log.warn("Performance: {s} took {d:.2}ms (slow!)", .{ operation, duration_ms });
        } else {
            log.debug("Performance: {s} took {d:.2}ms", .{ operation, duration_ms });
        }
    }
};

// Global dev mode instance
var global_devmode: ?DevMode = null;

pub fn initGlobalDevMode(allocator: std.mem.Allocator) void {
    global_devmode = DevMode.init(allocator);
}

pub fn getGlobalDevMode() ?*DevMode {
    if (global_devmode) |*dm| {
        return dm;
    }
    return null;
}

pub fn enable() void {
    if (global_devmode) |*dm| {
        dm.enable();
    }
}

pub fn disable() void {
    if (global_devmode) |*dm| {
        dm.disable();
    }
}

pub fn isEnabled() bool {
    if (global_devmode) |dm| {
        return dm.enabled;
    }
    return false;
}
