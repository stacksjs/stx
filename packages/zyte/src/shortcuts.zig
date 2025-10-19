const std = @import("std");

/// Advanced Keyboard Shortcuts Module
/// Provides comprehensive keyboard shortcut management

pub const Key = enum {
    // Letters
    a, b, c, d, e, f, g, h, i, j, k, l, m,
    n, o, p, q, r, s, t, u, v, w, x, y, z,

    // Numbers
    @"0", @"1", @"2", @"3", @"4", @"5", @"6", @"7", @"8", @"9",

    // Function keys
    f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12,
    f13, f14, f15, f16, f17, f18, f19, f20,

    // Navigation
    left, right, up, down,
    home, end, page_up, page_down,

    // Editing
    backspace, delete, insert,
    enter, tab, escape, space,

    // Symbols
    minus, equal, left_bracket, right_bracket,
    backslash, semicolon, quote, comma, period, slash,
    grave,

    // Media keys
    volume_up, volume_down, volume_mute,
    media_play, media_pause, media_stop,
    media_next, media_previous,

    // Browser keys
    browser_back, browser_forward, browser_refresh,
    browser_stop, browser_search, browser_favorites, browser_home,

    // Application keys
    launch_mail, launch_media, launch_app1, launch_app2,

    // Numpad
    numpad_0, numpad_1, numpad_2, numpad_3, numpad_4,
    numpad_5, numpad_6, numpad_7, numpad_8, numpad_9,
    numpad_multiply, numpad_add, numpad_subtract,
    numpad_decimal, numpad_divide, numpad_enter,

    // Lock keys
    caps_lock, num_lock, scroll_lock,

    // System
    print_screen, pause, help, sleep,
};

pub const Modifiers = struct {
    ctrl: bool = false,
    alt: bool = false,
    shift: bool = false,
    meta: bool = false, // Command on Mac, Windows key on Windows

    pub fn none() Modifiers {
        return .{};
    }

    pub fn ctrl() Modifiers {
        return .{ .ctrl = true };
    }

    pub fn alt() Modifiers {
        return .{ .alt = true };
    }

    pub fn shift() Modifiers {
        return .{ .shift = true };
    }

    pub fn meta() Modifiers {
        return .{ .meta = true };
    }

    pub fn equals(self: Modifiers, other: Modifiers) bool {
        return self.ctrl == other.ctrl and
            self.alt == other.alt and
            self.shift == other.shift and
            self.meta == other.meta;
    }
};

pub const Shortcut = struct {
    key: Key,
    modifiers: Modifiers,
    action: ShortcutAction,
    global: bool = false,
    enabled: bool = true,
    description: ?[]const u8 = null,
};

pub const ShortcutAction = *const fn () void;

pub const ShortcutManager = struct {
    shortcuts: std.ArrayList(Shortcut),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) ShortcutManager {
        return ShortcutManager{
            .shortcuts = std.ArrayList(Shortcut).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *ShortcutManager) void {
        self.shortcuts.deinit();
    }

    /// Register a keyboard shortcut
    pub fn register(self: *ShortcutManager, shortcut: Shortcut) !void {
        try self.shortcuts.append(shortcut);
    }

    /// Unregister a shortcut
    pub fn unregister(self: *ShortcutManager, key: Key, modifiers: Modifiers) void {
        var i: usize = 0;
        while (i < self.shortcuts.items.len) {
            const shortcut = self.shortcuts.items[i];
            if (shortcut.key == key and shortcut.modifiers.equals(modifiers)) {
                _ = self.shortcuts.swapRemove(i);
            } else {
                i += 1;
            }
        }
    }

    /// Handle key press
    pub fn handleKeyPress(self: *ShortcutManager, key: Key, modifiers: Modifiers) bool {
        for (self.shortcuts.items) |shortcut| {
            if (shortcut.enabled and shortcut.key == key and shortcut.modifiers.equals(modifiers)) {
                shortcut.action();
                return true;
            }
        }
        return false;
    }

    /// Enable/disable a shortcut
    pub fn setEnabled(self: *ShortcutManager, key: Key, modifiers: Modifiers, enabled: bool) void {
        for (self.shortcuts.items) |*shortcut| {
            if (shortcut.key == key and shortcut.modifiers.equals(modifiers)) {
                shortcut.enabled = enabled;
            }
        }
    }

    /// Get all registered shortcuts
    pub fn getAll(self: ShortcutManager) []const Shortcut {
        return self.shortcuts.items;
    }

    /// Clear all shortcuts
    pub fn clear(self: *ShortcutManager) void {
        self.shortcuts.clearRetainingCapacity();
    }
};

/// Predefined common shortcuts
pub const CommonShortcuts = struct {
    /// Save - Ctrl/Cmd+S
    pub fn save(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .s,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Save",
        };
    }

    /// Open - Ctrl/Cmd+O
    pub fn open(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .o,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Open",
        };
    }

    /// Copy - Ctrl/Cmd+C
    pub fn copy(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .c,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Copy",
        };
    }

    /// Paste - Ctrl/Cmd+V
    pub fn paste(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .v,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Paste",
        };
    }

    /// Cut - Ctrl/Cmd+X
    pub fn cut(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .x,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Cut",
        };
    }

    /// Undo - Ctrl/Cmd+Z
    pub fn undo(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .z,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Undo",
        };
    }

    /// Redo - Ctrl/Cmd+Shift+Z
    pub fn redo(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .z,
            .modifiers = if (builtin.target.os.tag == .macos)
                Modifiers{ .meta = true, .shift = true }
            else
                Modifiers{ .ctrl = true, .shift = true },
            .action = action,
            .description = "Redo",
        };
    }

    /// Select All - Ctrl/Cmd+A
    pub fn selectAll(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .a,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Select All",
        };
    }

    /// Find - Ctrl/Cmd+F
    pub fn find(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .f,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Find",
        };
    }

    /// New - Ctrl/Cmd+N
    pub fn new(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .n,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "New",
        };
    }

    /// Quit - Ctrl/Cmd+Q
    pub fn quit(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .q,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Quit",
        };
    }

    /// Fullscreen - F11
    pub fn fullscreen(action: ShortcutAction) Shortcut {
        return Shortcut{
            .key = .f11,
            .modifiers = Modifiers.none(),
            .action = action,
            .description = "Fullscreen",
        };
    }

    /// DevTools - F12
    pub fn devTools(action: ShortcutAction) Shortcut {
        return Shortcut{
            .key = .f12,
            .modifiers = Modifiers.none(),
            .action = action,
            .description = "Developer Tools",
        };
    }

    /// Reload - Ctrl/Cmd+R
    pub fn reload(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .r,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Reload",
        };
    }

    /// Zoom In - Ctrl/Cmd++
    pub fn zoomIn(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .equal, // Plus key
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Zoom In",
        };
    }

    /// Zoom Out - Ctrl/Cmd+-
    pub fn zoomOut(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .minus,
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Zoom Out",
        };
    }

    /// Zoom Reset - Ctrl/Cmd+0
    pub fn zoomReset(action: ShortcutAction) Shortcut {
        const builtin = @import("builtin");
        return Shortcut{
            .key = .@"0",
            .modifiers = if (builtin.target.os.tag == .macos) Modifiers.meta() else Modifiers.ctrl(),
            .action = action,
            .description = "Reset Zoom",
        };
    }
};

/// Shortcut recorder for capturing user input
pub const ShortcutRecorder = struct {
    recording: bool,
    current_key: ?Key,
    current_modifiers: Modifiers,
    callback: ?*const fn (Key, Modifiers) void,

    pub fn init() ShortcutRecorder {
        return ShortcutRecorder{
            .recording = false,
            .current_key = null,
            .current_modifiers = Modifiers.none(),
            .callback = null,
        };
    }

    pub fn startRecording(self: *ShortcutRecorder, callback: *const fn (Key, Modifiers) void) void {
        self.recording = true;
        self.callback = callback;
        self.current_key = null;
        self.current_modifiers = Modifiers.none();
    }

    pub fn stopRecording(self: *ShortcutRecorder) void {
        self.recording = false;
        self.callback = null;
    }

    pub fn handleKeyPress(self: *ShortcutRecorder, key: Key, modifiers: Modifiers) void {
        if (!self.recording) return;

        self.current_key = key;
        self.current_modifiers = modifiers;

        if (self.callback) |callback| {
            callback(key, modifiers);
        }

        self.stopRecording();
    }
};
