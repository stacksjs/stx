const std = @import("std");
const builtin = @import("builtin");

pub const MenuItem = struct {
    title: []const u8,
    key_equivalent: ?[]const u8 = null,
    action: ?*const fn () void = null,
    submenu: ?[]const MenuItem = null,
};

pub const Menu = struct {
    items: []const MenuItem,
    allocator: std.mem.Allocator,

    const Self = @This();

    pub fn init(allocator: std.mem.Allocator, items: []const MenuItem) Self {
        return .{
            .allocator = allocator,
            .items = items,
        };
    }

    pub fn deinit(self: *Self) void {
        _ = self;
    }

    pub fn build(self: *Self) !void {
        if (builtin.os.tag == .macos) {
            try self.buildMacOS();
        }
    }

    fn buildMacOS(self: *Self) !void {
        _ = self;
        // Implementation will use macOS NSMenu APIs
        // For now, this is a placeholder
    }
};

/// Create a standard macOS menu bar
pub fn createStandardMenuBar(app_name: []const u8) Menu {
    _ = app_name;

    const items = [_]MenuItem{
        .{
            .title = "File",
            .submenu = &[_]MenuItem{
                .{ .title = "New", .key_equivalent = "n" },
                .{ .title = "Open...", .key_equivalent = "o" },
                .{ .title = "Save", .key_equivalent = "s" },
                .{ .title = "Close", .key_equivalent = "w" },
            },
        },
        .{
            .title = "Edit",
            .submenu = &[_]MenuItem{
                .{ .title = "Undo", .key_equivalent = "z" },
                .{ .title = "Redo", .key_equivalent = "Z" },
                .{ .title = "Cut", .key_equivalent = "x" },
                .{ .title = "Copy", .key_equivalent = "c" },
                .{ .title = "Paste", .key_equivalent = "v" },
            },
        },
        .{
            .title = "View",
            .submenu = &[_]MenuItem{
                .{ .title = "Reload", .key_equivalent = "r" },
                .{ .title = "Toggle DevTools", .key_equivalent = "i" },
            },
        },
    };

    return Menu{
        .allocator = std.heap.page_allocator,
        .items = &items,
    };
}
