const std = @import("std");

/// Async/Await System for Zyte
/// Provides non-blocking I/O and task scheduling

pub const Task = struct {
    fn_ptr: *const fn (*anyopaque) anyerror!void,
    context: *anyopaque,
    result: ?anyerror!void,
    completed: bool,
    mutex: std.Thread.Mutex,

    pub fn init(fn_ptr: *const fn (*anyopaque) anyerror!void, context: *anyopaque) Task {
        return Task{
            .fn_ptr = fn_ptr,
            .context = context,
            .result = null,
            .completed = false,
            .mutex = std.Thread.Mutex{},
        };
    }

    pub fn run(self: *Task) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        self.result = self.fn_ptr(self.context);
        self.completed = true;
    }

    pub fn isComplete(self: *Task) bool {
        self.mutex.lock();
        defer self.mutex.unlock();
        return self.completed;
    }

    pub fn getResult(self: *Task) ?anyerror!void {
        self.mutex.lock();
        defer self.mutex.unlock();
        return self.result;
    }
};

pub const AsyncFile = struct {
    path: []const u8,
    file: ?std.fs.File,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, path: []const u8) AsyncFile {
        return AsyncFile{
            .path = path,
            .file = null,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *AsyncFile) void {
        if (self.file) |file| {
            file.close();
        }
    }

    pub fn readAsync(self: *AsyncFile) !Task {
        const Context = struct {
            file: *AsyncFile,
            data: []u8,
        };

        const context = try self.allocator.create(Context);
        context.* = .{ .file = self, .data = &[_]u8{} };

        return Task.init(readTask, @ptrCast(context));
    }

    fn readTask(ctx: *anyopaque) !void {
        const context: *Context = @ptrCast(@alignCast(ctx));
        const file = try std.fs.cwd().openFile(context.file.path, .{});
        defer file.close();

        context.data = try file.readToEndAlloc(context.file.allocator, 10 * 1024 * 1024);
    }

    pub fn writeAsync(self: *AsyncFile, data: []const u8) !Task {
        const Context = struct {
            file: *AsyncFile,
            data: []const u8,
        };

        const context = try self.allocator.create(Context);
        context.* = .{ .file = self, .data = data };

        return Task.init(writeTask, @ptrCast(context));
    }

    fn writeTask(ctx: *anyopaque) !void {
        const context: *Context = @ptrCast(@alignCast(ctx));
        const file = try std.fs.cwd().createFile(context.file.path, .{});
        defer file.close();

        try file.writeAll(context.data);
    }
};

pub const StreamReader = struct {
    file: std.fs.File,
    buffer: []u8,
    buffer_size: usize,
    position: usize,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, file: std.fs.File, buffer_size: usize) !StreamReader {
        const buffer = try allocator.alloc(u8, buffer_size);
        return StreamReader{
            .file = file,
            .buffer = buffer,
            .buffer_size = buffer_size,
            .position = 0,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *StreamReader) void {
        self.allocator.free(self.buffer);
    }

    pub fn readChunk(self: *StreamReader) !?[]const u8 {
        const bytes_read = try self.file.read(self.buffer);
        if (bytes_read == 0) return null;

        self.position += bytes_read;
        return self.buffer[0..bytes_read];
    }

    pub fn readLine(self: *StreamReader) !?[]const u8 {
        var line = std.ArrayList(u8).init(self.allocator);
        defer line.deinit();

        while (true) {
            const chunk = try self.readChunk() orelse return null;

            for (chunk) |byte| {
                if (byte == '\n') {
                    return try line.toOwnedSlice();
                }
                try line.append(byte);
            }
        }
    }

    pub fn skip(self: *StreamReader, bytes: usize) !void {
        try self.file.seekBy(@intCast(bytes));
        self.position += bytes;
    }

    pub fn getPosition(self: StreamReader) usize {
        return self.position;
    }
};

pub const StreamWriter = struct {
    file: std.fs.File,
    buffer: std.ArrayList(u8),
    auto_flush_size: usize,

    pub fn init(allocator: std.mem.Allocator, file: std.fs.File, auto_flush_size: usize) StreamWriter {
        return StreamWriter{
            .file = file,
            .buffer = std.ArrayList(u8).init(allocator),
            .auto_flush_size = auto_flush_size,
        };
    }

    pub fn deinit(self: *StreamWriter) void {
        self.flush() catch {};
        self.buffer.deinit();
    }

    pub fn write(self: *StreamWriter, data: []const u8) !void {
        try self.buffer.appendSlice(data);

        if (self.buffer.items.len >= self.auto_flush_size) {
            try self.flush();
        }
    }

    pub fn writeLine(self: *StreamWriter, line: []const u8) !void {
        try self.write(line);
        try self.write("\n");
    }

    pub fn flush(self: *StreamWriter) !void {
        if (self.buffer.items.len == 0) return;

        try self.file.writeAll(self.buffer.items);
        self.buffer.clearRetainingCapacity();
    }
};

pub const Promise = struct {
    state: State,
    result: ?anyerror![]const u8,
    callbacks: std.ArrayList(Callback),
    error_callbacks: std.ArrayList(ErrorCallback),
    mutex: std.Thread.Mutex,
    allocator: std.mem.Allocator,

    const State = enum {
        pending,
        fulfilled,
        rejected,
    };

    const Callback = *const fn ([]const u8) void;
    const ErrorCallback = *const fn (anyerror) void;

    pub fn init(allocator: std.mem.Allocator) Promise {
        return Promise{
            .state = .pending,
            .result = null,
            .callbacks = std.ArrayList(Callback).init(allocator),
            .error_callbacks = std.ArrayList(ErrorCallback).init(allocator),
            .mutex = std.Thread.Mutex{},
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Promise) void {
        self.callbacks.deinit();
        self.error_callbacks.deinit();
    }

    pub fn resolve(self: *Promise, value: []const u8) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.state != .pending) return;

        self.state = .fulfilled;
        self.result = value;

        for (self.callbacks.items) |callback| {
            callback(value);
        }
    }

    pub fn reject(self: *Promise, err: anyerror) void {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.state != .pending) return;

        self.state = .rejected;
        self.result = err;

        for (self.error_callbacks.items) |callback| {
            callback(err);
        }
    }

    pub fn then(self: *Promise, callback: Callback) !void {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.state == .fulfilled) {
            if (self.result) |result| {
                if (result) |value| {
                    callback(value);
                }
            }
        } else {
            try self.callbacks.append(callback);
        }
    }

    pub fn catch_(self: *Promise, callback: ErrorCallback) !void {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.state == .rejected) {
            if (self.result) |result| {
                if (result) |_| {} else |err| {
                    callback(err);
                }
            }
        } else {
            try self.error_callbacks.append(callback);
        }
    }
};

pub const EventLoop = struct {
    tasks: std.ArrayList(*Task),
    running: bool,
    mutex: std.Thread.Mutex,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) EventLoop {
        return EventLoop{
            .tasks = std.ArrayList(*Task).init(allocator),
            .running = false,
            .mutex = std.Thread.Mutex{},
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *EventLoop) void {
        self.tasks.deinit();
    }

    pub fn submit(self: *EventLoop, task: *Task) !void {
        self.mutex.lock();
        defer self.mutex.unlock();
        try self.tasks.append(task);
    }

    pub fn run(self: *EventLoop) void {
        self.running = true;

        while (self.running) {
            self.mutex.lock();

            var i: usize = 0;
            while (i < self.tasks.items.len) {
                const task = self.tasks.items[i];

                if (!task.isComplete()) {
                    // Spawn thread to run task
                    const thread = std.Thread.spawn(.{}, runTask, .{task}) catch {
                        i += 1;
                        continue;
                    };
                    thread.detach();
                }

                if (task.isComplete()) {
                    _ = self.tasks.swapRemove(i);
                } else {
                    i += 1;
                }
            }

            self.mutex.unlock();

            // Small sleep to prevent busy waiting
            std.time.sleep(1_000_000); // 1ms
        }
    }

    fn runTask(task: *Task) void {
        task.run();
    }

    pub fn stop(self: *EventLoop) void {
        self.running = false;
    }
};

pub const Channels = struct {
    pub fn Channel(comptime T: type) type {
        return struct {
            buffer: std.ArrayList(T),
            mutex: std.Thread.Mutex,
            condition: std.Thread.Condition,
            closed: bool,
            allocator: std.mem.Allocator,

            const Self = @This();

            pub fn init(allocator: std.mem.Allocator) Self {
                return Self{
                    .buffer = std.ArrayList(T).init(allocator),
                    .mutex = std.Thread.Mutex{},
                    .condition = std.Thread.Condition{},
                    .closed = false,
                    .allocator = allocator,
                };
            }

            pub fn deinit(self: *Self) void {
                self.buffer.deinit();
            }

            pub fn send(self: *Self, value: T) !void {
                self.mutex.lock();
                defer self.mutex.unlock();

                if (self.closed) return error.ChannelClosed;

                try self.buffer.append(value);
                self.condition.signal();
            }

            pub fn receive(self: *Self) !T {
                self.mutex.lock();
                defer self.mutex.unlock();

                while (self.buffer.items.len == 0) {
                    if (self.closed) return error.ChannelClosed;
                    self.condition.wait(&self.mutex);
                }

                return self.buffer.orderedRemove(0);
            }

            pub fn tryReceive(self: *Self) ?T {
                self.mutex.lock();
                defer self.mutex.unlock();

                if (self.buffer.items.len == 0) return null;
                return self.buffer.orderedRemove(0);
            }

            pub fn close(self: *Self) void {
                self.mutex.lock();
                defer self.mutex.unlock();

                self.closed = true;
                self.condition.broadcast();
            }
        };
    }
};
