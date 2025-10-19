const std = @import("std");

/// WebAssembly Plugin System
/// Allows loading and running WASM modules as plugins

pub const WasmModule = struct {
    name: []const u8,
    bytes: []const u8,
    instance: ?*anyopaque,
    exports: std.StringHashMap(WasmFunction),
    imports: std.StringHashMap(WasmFunction),
    memory: ?[]u8,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, name: []const u8, bytes: []const u8) !WasmModule {
        return WasmModule{
            .name = name,
            .bytes = bytes,
            .instance = null,
            .exports = std.StringHashMap(WasmFunction).init(allocator),
            .imports = std.StringHashMap(WasmFunction).init(allocator),
            .memory = null,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *WasmModule) void {
        if (self.memory) |mem| {
            self.allocator.free(mem);
        }
        self.exports.deinit();
        self.imports.deinit();
    }

    pub fn load(self: *WasmModule) !void {
        // Parse WASM binary format
        if (self.bytes.len < 8) return error.InvalidWasm;
        if (!std.mem.eql(u8, self.bytes[0..4], "\x00asm")) return error.InvalidWasm;

        // Would parse full WASM format here
        // For now, simplified implementation
    }

    pub fn call(self: *WasmModule, function_name: []const u8, args: []const WasmValue) ![]const WasmValue {
        _ = self;
        _ = function_name;
        _ = args;
        // Would execute WASM function
        return &[_]WasmValue{};
    }

    pub fn getExport(self: WasmModule, name: []const u8) ?WasmFunction {
        return self.exports.get(name);
    }

    pub fn registerImport(self: *WasmModule, name: []const u8, func: WasmFunction) !void {
        try self.imports.put(name, func);
    }
};

pub const WasmValue = union(enum) {
    i32: i32,
    i64: i64,
    f32: f32,
    f64: f64,

    pub fn asI32(self: WasmValue) !i32 {
        return switch (self) {
            .i32 => |v| v,
            else => error.TypeMismatch,
        };
    }

    pub fn asI64(self: WasmValue) !i64 {
        return switch (self) {
            .i64 => |v| v,
            else => error.TypeMismatch,
        };
    }

    pub fn asF32(self: WasmValue) !f32 {
        return switch (self) {
            .f32 => |v| v,
            else => error.TypeMismatch,
        };
    }

    pub fn asF64(self: WasmValue) !f64 {
        return switch (self) {
            .f64 => |v| v,
            else => error.TypeMismatch,
        };
    }
};

pub const WasmFunction = struct {
    params: []const WasmType,
    results: []const WasmType,
    func_ptr: *const fn ([]const WasmValue) anyerror![]const WasmValue,
};

pub const WasmType = enum {
    i32,
    i64,
    f32,
    f64,
    funcref,
    externref,
};

pub const WasmRuntime = struct {
    modules: std.StringHashMap(WasmModule),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) WasmRuntime {
        return WasmRuntime{
            .modules = std.StringHashMap(WasmModule).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *WasmRuntime) void {
        var iter = self.modules.valueIterator();
        while (iter.next()) |module| {
            module.deinit();
        }
        self.modules.deinit();
    }

    pub fn loadModule(self: *WasmRuntime, name: []const u8, path: []const u8) !void {
        const file = try std.fs.cwd().openFile(path, .{});
        defer file.close();

        const bytes = try file.readToEndAlloc(self.allocator, 10 * 1024 * 1024);
        defer self.allocator.free(bytes);

        var module = try WasmModule.init(self.allocator, name, bytes);
        try module.load();

        try self.modules.put(name, module);
    }

    pub fn getModule(self: *WasmRuntime, name: []const u8) ?*WasmModule {
        return self.modules.getPtr(name);
    }

    pub fn unloadModule(self: *WasmRuntime, name: []const u8) void {
        if (self.modules.fetchRemove(name)) |kv| {
            kv.value.deinit();
        }
    }
};

pub const PluginAPI = struct {
    // Host functions that plugins can call
    pub fn log(message: []const u8) void {
        std.debug.print("[Plugin] {s}\n", .{message});
    }

    pub fn allocate(size: usize) !*anyopaque {
        const allocator = std.heap.page_allocator;
        const memory = try allocator.alloc(u8, size);
        return @ptrCast(memory.ptr);
    }

    pub fn deallocate(ptr: *anyopaque, size: usize) void {
        const allocator = std.heap.page_allocator;
        const memory: [*]u8 = @ptrCast(ptr);
        allocator.free(memory[0..size]);
    }

    pub fn getCurrentTime() i64 {
        return std.time.milliTimestamp();
    }
};

pub const PluginManager = struct {
    runtime: WasmRuntime,
    plugins: std.StringHashMap(Plugin),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) PluginManager {
        return PluginManager{
            .runtime = WasmRuntime.init(allocator),
            .plugins = std.StringHashMap(Plugin).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *PluginManager) void {
        self.runtime.deinit();
        self.plugins.deinit();
    }

    pub fn loadPlugin(self: *PluginManager, name: []const u8, path: []const u8) !void {
        try self.runtime.loadModule(name, path);

        if (self.runtime.getModule(name)) |module| {
            const plugin = Plugin{
                .name = name,
                .module = module,
                .enabled = true,
            };

            try self.plugins.put(name, plugin);

            // Call plugin initialization if exists
            if (module.getExport("init")) |init_fn| {
                _ = try module.call("init", &[_]WasmValue{});
                _ = init_fn;
            }
        }
    }

    pub fn unloadPlugin(self: *PluginManager, name: []const u8) !void {
        if (self.plugins.fetchRemove(name)) |kv| {
            // Call plugin cleanup if exists
            if (kv.value.module.getExport("deinit")) |_| {
                _ = try kv.value.module.call("deinit", &[_]WasmValue{});
            }

            self.runtime.unloadModule(name);
        }
    }

    pub fn getPlugin(self: *PluginManager, name: []const u8) ?*Plugin {
        return self.plugins.getPtr(name);
    }

    pub fn enablePlugin(self: *PluginManager, name: []const u8) !void {
        if (self.plugins.getPtr(name)) |plugin| {
            plugin.enabled = true;
        }
    }

    pub fn disablePlugin(self: *PluginManager, name: []const u8) !void {
        if (self.plugins.getPtr(name)) |plugin| {
            plugin.enabled = false;
        }
    }

    pub fn callPlugin(self: *PluginManager, name: []const u8, function: []const u8, args: []const WasmValue) ![]const WasmValue {
        if (self.plugins.get(name)) |plugin| {
            if (!plugin.enabled) return error.PluginDisabled;
            return try plugin.module.call(function, args);
        }
        return error.PluginNotFound;
    }
};

pub const Plugin = struct {
    name: []const u8,
    module: *WasmModule,
    enabled: bool,
};

// WASM binary parser (simplified)
pub const WasmParser = struct {
    bytes: []const u8,
    position: usize,

    pub fn init(bytes: []const u8) WasmParser {
        return WasmParser{
            .bytes = bytes,
            .position = 0,
        };
    }

    pub fn readByte(self: *WasmParser) !u8 {
        if (self.position >= self.bytes.len) return error.UnexpectedEOF;
        const byte = self.bytes[self.position];
        self.position += 1;
        return byte;
    }

    pub fn readU32(self: *WasmParser) !u32 {
        var result: u32 = 0;
        var shift: u5 = 0;

        while (true) {
            const byte = try self.readByte();
            result |= @as(u32, byte & 0x7F) << shift;

            if ((byte & 0x80) == 0) break;
            shift += 7;
        }

        return result;
    }

    pub fn readBytes(self: *WasmParser, len: usize) ![]const u8 {
        if (self.position + len > self.bytes.len) return error.UnexpectedEOF;
        const slice = self.bytes[self.position .. self.position + len];
        self.position += len;
        return slice;
    }

    pub fn checkMagic(self: *WasmParser) !void {
        const magic = try self.readBytes(4);
        if (!std.mem.eql(u8, magic, "\x00asm")) return error.InvalidMagic;
    }

    pub fn checkVersion(self: *WasmParser) !u32 {
        const version = try self.readU32();
        return version;
    }
};

// Plugin sandbox for security
pub const PluginSandbox = struct {
    allowed_apis: std.StringHashMap(bool),
    memory_limit: usize,
    cpu_time_limit: u64,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, memory_limit: usize, cpu_time_limit: u64) PluginSandbox {
        return PluginSandbox{
            .allowed_apis = std.StringHashMap(bool).init(allocator),
            .memory_limit = memory_limit,
            .cpu_time_limit = cpu_time_limit,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *PluginSandbox) void {
        self.allowed_apis.deinit();
    }

    pub fn allowAPI(self: *PluginSandbox, api_name: []const u8) !void {
        try self.allowed_apis.put(api_name, true);
    }

    pub fn isAPIAllowed(self: PluginSandbox, api_name: []const u8) bool {
        return self.allowed_apis.get(api_name) orelse false;
    }

    pub fn checkMemoryLimit(self: PluginSandbox, current_usage: usize) bool {
        return current_usage <= self.memory_limit;
    }
};
