const std = @import("std");

pub const LogLevel = enum {
    Debug,
    Info,
    Warning,
    Error,

    pub fn toString(self: LogLevel) []const u8 {
        return switch (self) {
            .Debug => "DEBUG",
            .Info => "INFO",
            .Warning => "WARN",
            .Error => "ERROR",
        };
    }

    pub fn color(self: LogLevel) []const u8 {
        return switch (self) {
            .Debug => "\x1B[36m", // Cyan
            .Info => "\x1B[32m", // Green
            .Warning => "\x1B[33m", // Yellow
            .Error => "\x1B[31m", // Red
        };
    }
};

var current_level: LogLevel = .Info;

pub fn setLevel(level: LogLevel) void {
    current_level = level;
}

pub fn getLevel() LogLevel {
    return current_level;
}

pub fn shouldLog(level: LogLevel) bool {
    return @intFromEnum(level) >= @intFromEnum(current_level);
}

pub fn log(
    comptime level: LogLevel,
    comptime format: []const u8,
    args: anytype,
) void {
    if (!shouldLog(level)) return;

    const reset = "\x1B[0m";
    const dim = "\x1B[2m";

    const timestamp = getTimestamp();

    std.debug.print("{s}[{s}]{s} {s}{s}{s} ", .{
        dim,
        timestamp,
        reset,
        level.color(),
        level.toString(),
        reset,
    });

    std.debug.print(format, args);
    std.debug.print("\n", .{});
}

pub fn debug(comptime format: []const u8, args: anytype) void {
    log(.Debug, format, args);
}

pub fn info(comptime format: []const u8, args: anytype) void {
    log(.Info, format, args);
}

pub fn warn(comptime format: []const u8, args: anytype) void {
    log(.Warning, format, args);
}

pub fn err(comptime format: []const u8, args: anytype) void {
    log(.Error, format, args);
}

fn getTimestamp() []const u8 {
    // Simple timestamp - hours:minutes:seconds
    const timestamp = std.time.timestamp();
    const seconds = @mod(timestamp, 60);
    const minutes = @mod(@divFloor(timestamp, 60), 60);
    const hours = @mod(@divFloor(timestamp, 3600), 24);

    var buf: [8]u8 = undefined;
    _ = std.fmt.bufPrint(&buf, "{d:0>2}:{d:0>2}:{d:0>2}", .{ hours, minutes, seconds }) catch unreachable;
    return &buf;
}
