const std = @import("std");

/// Advanced Inter-Process Communication Module
/// Provides structured message passing between processes

pub const MessageType = enum {
    request,
    response,
    event,
    stream,
};

pub const Message = struct {
    id: u64,
    type: MessageType,
    channel: []const u8,
    data: []const u8,
    timestamp: i64,
    sender: ?[]const u8,
};

pub const MessageHandler = *const fn (Message) void;

pub const IPC = struct {
    channels: std.StringHashMap(std.ArrayList(MessageHandler)),
    pending_requests: std.AutoHashMap(u64, MessageHandler),
    next_id: u64,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) IPC {
        return IPC{
            .channels = std.StringHashMap(std.ArrayList(MessageHandler)).init(allocator),
            .pending_requests = std.AutoHashMap(u64, MessageHandler).init(allocator),
            .next_id = 1,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *IPC) void {
        var iter = self.channels.iterator();
        while (iter.next()) |entry| {
            entry.value_ptr.deinit();
        }
        self.channels.deinit();
        self.pending_requests.deinit();
    }

    /// Subscribe to a channel
    pub fn on(self: *IPC, channel: []const u8, handler: MessageHandler) !void {
        const result = try self.channels.getOrPut(channel);
        if (!result.found_existing) {
            result.value_ptr.* = std.ArrayList(MessageHandler).init(self.allocator);
        }
        try result.value_ptr.append(handler);
    }

    /// Unsubscribe from a channel
    pub fn off(self: *IPC, channel: []const u8, handler: MessageHandler) void {
        if (self.channels.get(channel)) |handlers| {
            for (handlers.items, 0..) |h, i| {
                if (h == handler) {
                    _ = handlers.swapRemove(i);
                    break;
                }
            }
        }
    }

    /// Send a message to a channel
    pub fn send(self: *IPC, channel: []const u8, data: []const u8) !void {
        const msg = Message{
            .id = self.next_id,
            .type = .event,
            .channel = channel,
            .data = data,
            .timestamp = std.time.milliTimestamp(),
            .sender = null,
        };
        self.next_id += 1;

        if (self.channels.get(channel)) |handlers| {
            for (handlers.items) |handler| {
                handler(msg);
            }
        }
    }

    /// Send request and wait for response
    pub fn request(self: *IPC, channel: []const u8, data: []const u8, handler: MessageHandler) !u64 {
        const id = self.next_id;
        self.next_id += 1;

        try self.pending_requests.put(id, handler);

        const msg = Message{
            .id = id,
            .type = .request,
            .channel = channel,
            .data = data,
            .timestamp = std.time.milliTimestamp(),
            .sender = null,
        };

        if (self.channels.get(channel)) |handlers| {
            for (handlers.items) |h| {
                h(msg);
            }
        }

        return id;
    }

    /// Send response to a request
    pub fn respond(self: *IPC, request_id: u64, data: []const u8) !void {
        if (self.pending_requests.get(request_id)) |handler| {
            const msg = Message{
                .id = request_id,
                .type = .response,
                .channel = "",
                .data = data,
                .timestamp = std.time.milliTimestamp(),
                .sender = null,
            };
            handler(msg);
            _ = self.pending_requests.remove(request_id);
        }
    }

    /// Broadcast to all channels
    pub fn broadcast(self: *IPC, data: []const u8) !void {
        var iter = self.channels.iterator();
        while (iter.next()) |entry| {
            try self.send(entry.key_ptr.*, data);
        }
    }
};

/// Shared memory for fast IPC
pub const SharedMemory = struct {
    name: []const u8,
    size: usize,
    data: []u8,
    allocator: std.mem.Allocator,

    pub fn create(allocator: std.mem.Allocator, name: []const u8, size: usize) !SharedMemory {
        const data = try allocator.alloc(u8, size);
        @memset(data, 0);

        return SharedMemory{
            .name = name,
            .size = size,
            .data = data,
            .allocator = allocator,
        };
    }

    pub fn open(allocator: std.mem.Allocator, name: []const u8) !SharedMemory {
        _ = allocator;
        _ = name;
        return error.NotImplemented;
    }

    pub fn deinit(self: *SharedMemory) void {
        self.allocator.free(self.data);
    }

    pub fn write(self: *SharedMemory, offset: usize, data: []const u8) !void {
        if (offset + data.len > self.size) return error.OutOfBounds;
        @memcpy(self.data[offset .. offset + data.len], data);
    }

    pub fn read(self: *SharedMemory, offset: usize, len: usize) ![]const u8 {
        if (offset + len > self.size) return error.OutOfBounds;
        return self.data[offset .. offset + len];
    }
};

/// Message queue for async IPC
pub const MessageQueue = struct {
    messages: std.ArrayList(Message),
    mutex: std.Thread.Mutex,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) MessageQueue {
        return MessageQueue{
            .messages = std.ArrayList(Message).init(allocator),
            .mutex = std.Thread.Mutex{},
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *MessageQueue) void {
        self.messages.deinit();
    }

    pub fn push(self: *MessageQueue, msg: Message) !void {
        self.mutex.lock();
        defer self.mutex.unlock();
        try self.messages.append(msg);
    }

    pub fn pop(self: *MessageQueue) ?Message {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.messages.items.len == 0) return null;
        return self.messages.orderedRemove(0);
    }

    pub fn peek(self: *MessageQueue) ?Message {
        self.mutex.lock();
        defer self.mutex.unlock();

        if (self.messages.items.len == 0) return null;
        return self.messages.items[0];
    }

    pub fn size(self: *MessageQueue) usize {
        self.mutex.lock();
        defer self.mutex.unlock();
        return self.messages.items.len;
    }

    pub fn clear(self: *MessageQueue) void {
        self.mutex.lock();
        defer self.mutex.unlock();
        self.messages.clearRetainingCapacity();
    }
};

/// RPC (Remote Procedure Call) support
pub const RPC = struct {
    ipc: *IPC,
    procedures: std.StringHashMap(RPCHandler),
    allocator: std.mem.Allocator,

    pub const RPCHandler = *const fn ([]const u8) []const u8;

    pub fn init(allocator: std.mem.Allocator, ipc: *IPC) RPC {
        return RPC{
            .ipc = ipc,
            .procedures = std.StringHashMap(RPCHandler).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *RPC) void {
        self.procedures.deinit();
    }

    /// Register a remote procedure
    pub fn register(self: *RPC, name: []const u8, handler: RPCHandler) !void {
        try self.procedures.put(name, handler);
    }

    /// Call a remote procedure
    pub fn call(self: *RPC, name: []const u8, args: []const u8) ![]const u8 {
        if (self.procedures.get(name)) |handler| {
            return handler(args);
        }
        return error.ProcedureNotFound;
    }

    /// Call async with callback
    pub fn callAsync(self: *RPC, name: []const u8, args: []const u8, callback: MessageHandler) !void {
        const channel = try std.fmt.allocPrint(self.allocator, "rpc:{s}", .{name});
        defer self.allocator.free(channel);

        _ = try self.ipc.request(channel, args, callback);
    }
};

/// Stream support for continuous data transfer
pub const Stream = struct {
    ipc: *IPC,
    channel: []const u8,
    chunk_size: usize,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, ipc: *IPC, channel: []const u8) Stream {
        return Stream{
            .ipc = ipc,
            .channel = channel,
            .chunk_size = 4096,
            .allocator = allocator,
        };
    }

    pub fn write(self: *Stream, data: []const u8) !void {
        var offset: usize = 0;
        while (offset < data.len) {
            const chunk_end = @min(offset + self.chunk_size, data.len);
            const chunk = data[offset..chunk_end];

            try self.ipc.send(self.channel, chunk);
            offset = chunk_end;
        }
    }

    pub fn onData(self: *Stream, handler: MessageHandler) !void {
        try self.ipc.on(self.channel, handler);
    }

    pub fn close(self: *Stream) !void {
        try self.ipc.send(self.channel, "");
    }
};
