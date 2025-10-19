const std = @import("std");
const renderer = @import("renderer.zig");

/// Advanced Theming System
/// Provides comprehensive theming with hot-reload and custom themes

pub const ThemeMode = enum {
    light,
    dark,
    auto, // Follow system preference
    custom,
};

pub const ColorScheme = struct {
    // Primary colors
    primary: renderer.Color,
    primary_variant: renderer.Color,
    secondary: renderer.Color,
    secondary_variant: renderer.Color,

    // Background
    background: renderer.Color,
    surface: renderer.Color,
    error: renderer.Color,

    // Text
    on_primary: renderer.Color,
    on_secondary: renderer.Color,
    on_background: renderer.Color,
    on_surface: renderer.Color,
    on_error: renderer.Color,

    // Additional
    divider: renderer.Color,
    shadow: renderer.Color,
    overlay: renderer.Color,
    disabled: renderer.Color,
    placeholder: renderer.Color,
    border: renderer.Color,

    // Status colors
    success: renderer.Color,
    warning: renderer.Color,
    info: renderer.Color,

    // Interactive states
    hover: renderer.Color,
    pressed: renderer.Color,
    focused: renderer.Color,
    selected: renderer.Color,
};

pub const Typography = struct {
    // Font families
    primary_font: []const u8 = "system-ui",
    monospace_font: []const u8 = "monospace",

    // Sizes
    h1_size: f32 = 32.0,
    h2_size: f32 = 28.0,
    h3_size: f32 = 24.0,
    h4_size: f32 = 20.0,
    h5_size: f32 = 18.0,
    h6_size: f32 = 16.0,
    body_size: f32 = 14.0,
    caption_size: f32 = 12.0,

    // Weights
    light: u16 = 300,
    regular: u16 = 400,
    medium: u16 = 500,
    semibold: u16 = 600,
    bold: u16 = 700,

    // Line heights
    tight: f32 = 1.2,
    normal: f32 = 1.5,
    relaxed: f32 = 1.8,
};

pub const Spacing = struct {
    xs: f32 = 4.0,
    sm: f32 = 8.0,
    md: f32 = 16.0,
    lg: f32 = 24.0,
    xl: f32 = 32.0,
    xxl: f32 = 48.0,
};

pub const BorderRadius = struct {
    none: f32 = 0.0,
    sm: f32 = 4.0,
    md: f32 = 8.0,
    lg: f32 = 12.0,
    xl: f32 = 16.0,
    full: f32 = 9999.0,
};

pub const Shadows = struct {
    none: Shadow = .{ .x = 0, .y = 0, .blur = 0, .spread = 0, .color = renderer.Color.rgba(0, 0, 0, 0) },
    sm: Shadow = .{ .x = 0, .y = 1, .blur = 2, .spread = 0, .color = renderer.Color.rgba(0, 0, 0, 25) },
    md: Shadow = .{ .x = 0, .y = 2, .blur = 4, .spread = 0, .color = renderer.Color.rgba(0, 0, 0, 25) },
    lg: Shadow = .{ .x = 0, .y = 4, .blur = 8, .spread = 0, .color = renderer.Color.rgba(0, 0, 0, 25) },
    xl: Shadow = .{ .x = 0, .y = 8, .blur = 16, .spread = 0, .color = renderer.Color.rgba(0, 0, 0, 25) },
};

pub const Shadow = struct {
    x: i32,
    y: i32,
    blur: u32,
    spread: i32,
    color: renderer.Color,
};

pub const Transitions = struct {
    fast: u32 = 150, // ms
    normal: u32 = 300,
    slow: u32 = 500,

    easing_linear: []const u8 = "linear",
    easing_ease: []const u8 = "ease",
    easing_ease_in: []const u8 = "ease-in",
    easing_ease_out: []const u8 = "ease-out",
    easing_ease_in_out: []const u8 = "ease-in-out",
};

pub const Theme = struct {
    name: []const u8,
    mode: ThemeMode,
    colors: ColorScheme,
    typography: Typography,
    spacing: Spacing,
    radius: BorderRadius,
    shadows: Shadows,
    transitions: Transitions,
    custom_properties: std.StringHashMap([]const u8),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, name: []const u8, mode: ThemeMode) Theme {
        return Theme{
            .name = name,
            .mode = mode,
            .colors = if (mode == .dark) defaultDarkColors() else defaultLightColors(),
            .typography = Typography{},
            .spacing = Spacing{},
            .radius = BorderRadius{},
            .shadows = Shadows{},
            .transitions = Transitions{},
            .custom_properties = std.StringHashMap([]const u8).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Theme) void {
        self.custom_properties.deinit();
    }

    pub fn setCustomProperty(self: *Theme, key: []const u8, value: []const u8) !void {
        try self.custom_properties.put(key, value);
    }

    pub fn getCustomProperty(self: Theme, key: []const u8) ?[]const u8 {
        return self.custom_properties.get(key);
    }

    pub fn toCSS(self: Theme, allocator: std.mem.Allocator) ![]const u8 {
        var css = std.ArrayList(u8).init(allocator);
        const writer = css.writer();

        try writer.writeAll(":root {\n");

        // Colors
        try writer.print("  --color-primary: #{x:0>6};\n", .{colorToHex(self.colors.primary)});
        try writer.print("  --color-secondary: #{x:0>6};\n", .{colorToHex(self.colors.secondary)});
        try writer.print("  --color-background: #{x:0>6};\n", .{colorToHex(self.colors.background)});
        try writer.print("  --color-surface: #{x:0>6};\n", .{colorToHex(self.colors.surface)});

        // Typography
        try writer.print("  --font-primary: {s};\n", .{self.typography.primary_font});
        try writer.print("  --font-size-body: {d}px;\n", .{self.typography.body_size});

        // Spacing
        try writer.print("  --spacing-sm: {d}px;\n", .{self.spacing.sm});
        try writer.print("  --spacing-md: {d}px;\n", .{self.spacing.md});
        try writer.print("  --spacing-lg: {d}px;\n", .{self.spacing.lg});

        // Custom properties
        var iter = self.custom_properties.iterator();
        while (iter.next()) |entry| {
            try writer.print("  --{s}: {s};\n", .{ entry.key_ptr.*, entry.value_ptr.* });
        }

        try writer.writeAll("}\n");

        return css.toOwnedSlice();
    }

    fn colorToHex(color: renderer.Color) u32 {
        return (@as(u32, color.r) << 16) | (@as(u32, color.g) << 8) | @as(u32, color.b);
    }
};

pub const ThemeManager = struct {
    current_theme: *Theme,
    themes: std.StringHashMap(Theme),
    watchers: std.ArrayList(ThemeChangeCallback),
    allocator: std.mem.Allocator,

    pub const ThemeChangeCallback = *const fn (*Theme) void;

    pub fn init(allocator: std.mem.Allocator) !ThemeManager {
        var themes = std.StringHashMap(Theme).init(allocator);

        // Add default themes
        const light = Theme.init(allocator, "light", .light);
        const dark = Theme.init(allocator, "dark", .dark);

        try themes.put("light", light);
        try themes.put("dark", dark);

        const current = try allocator.create(Theme);
        current.* = light;

        return ThemeManager{
            .current_theme = current,
            .themes = themes,
            .watchers = std.ArrayList(ThemeChangeCallback).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *ThemeManager) void {
        var iter = self.themes.valueIterator();
        while (iter.next()) |theme| {
            theme.deinit();
        }
        self.themes.deinit();
        self.watchers.deinit();
        self.allocator.destroy(self.current_theme);
    }

    pub fn setTheme(self: *ThemeManager, name: []const u8) !void {
        if (self.themes.get(name)) |theme| {
            self.current_theme.* = theme;
            self.notifyWatchers();
        } else {
            return error.ThemeNotFound;
        }
    }

    pub fn registerTheme(self: *ThemeManager, theme: Theme) !void {
        try self.themes.put(theme.name, theme);
    }

    pub fn getCurrentTheme(self: ThemeManager) *Theme {
        return self.current_theme;
    }

    pub fn onThemeChange(self: *ThemeManager, callback: ThemeChangeCallback) !void {
        try self.watchers.append(callback);
    }

    fn notifyWatchers(self: *ThemeManager) void {
        for (self.watchers.items) |callback| {
            callback(self.current_theme);
        }
    }

    pub fn detectSystemTheme(self: *ThemeManager) ThemeMode {
        _ = self;
        // Platform-specific system theme detection
        const builtin = @import("builtin");
        _ = builtin;
        return .light; // Would detect actual system preference
    }

    pub fn enableAutoTheme(self: *ThemeManager) !void {
        const system_mode = self.detectSystemTheme();
        const theme_name = if (system_mode == .dark) "dark" else "light";
        try self.setTheme(theme_name);
    }
};

// Predefined color schemes
pub fn defaultLightColors() ColorScheme {
    return ColorScheme{
        .primary = renderer.Color.rgb(33, 150, 243),
        .primary_variant = renderer.Color.rgb(25, 118, 210),
        .secondary = renderer.Color.rgb(255, 152, 0),
        .secondary_variant = renderer.Color.rgb(245, 124, 0),

        .background = renderer.Color.rgb(250, 250, 250),
        .surface = renderer.Color.rgb(255, 255, 255),
        .error = renderer.Color.rgb(244, 67, 54),

        .on_primary = renderer.Color.rgb(255, 255, 255),
        .on_secondary = renderer.Color.rgb(0, 0, 0),
        .on_background = renderer.Color.rgb(0, 0, 0),
        .on_surface = renderer.Color.rgb(0, 0, 0),
        .on_error = renderer.Color.rgb(255, 255, 255),

        .divider = renderer.Color.rgba(0, 0, 0, 30),
        .shadow = renderer.Color.rgba(0, 0, 0, 25),
        .overlay = renderer.Color.rgba(0, 0, 0, 50),
        .disabled = renderer.Color.rgba(0, 0, 0, 100),
        .placeholder = renderer.Color.rgba(0, 0, 0, 150),
        .border = renderer.Color.rgba(0, 0, 0, 30),

        .success = renderer.Color.rgb(76, 175, 80),
        .warning = renderer.Color.rgb(255, 193, 7),
        .info = renderer.Color.rgb(33, 150, 243),

        .hover = renderer.Color.rgba(0, 0, 0, 10),
        .pressed = renderer.Color.rgba(0, 0, 0, 20),
        .focused = renderer.Color.rgba(33, 150, 243, 30),
        .selected = renderer.Color.rgba(33, 150, 243, 50),
    };
}

pub fn defaultDarkColors() ColorScheme {
    return ColorScheme{
        .primary = renderer.Color.rgb(144, 202, 249),
        .primary_variant = renderer.Color.rgb(100, 181, 246),
        .secondary = renderer.Color.rgb(255, 204, 128),
        .secondary_variant = renderer.Color.rgb(255, 183, 77),

        .background = renderer.Color.rgb(18, 18, 18),
        .surface = renderer.Color.rgb(30, 30, 30),
        .error = renderer.Color.rgb(239, 83, 80),

        .on_primary = renderer.Color.rgb(0, 0, 0),
        .on_secondary = renderer.Color.rgb(0, 0, 0),
        .on_background = renderer.Color.rgb(255, 255, 255),
        .on_surface = renderer.Color.rgb(255, 255, 255),
        .on_error = renderer.Color.rgb(0, 0, 0),

        .divider = renderer.Color.rgba(255, 255, 255, 30),
        .shadow = renderer.Color.rgba(0, 0, 0, 50),
        .overlay = renderer.Color.rgba(0, 0, 0, 70),
        .disabled = renderer.Color.rgba(255, 255, 255, 100),
        .placeholder = renderer.Color.rgba(255, 255, 255, 150),
        .border = renderer.Color.rgba(255, 255, 255, 30),

        .success = renderer.Color.rgb(129, 199, 132),
        .warning = renderer.Color.rgb(255, 213, 79),
        .info = renderer.Color.rgb(144, 202, 249),

        .hover = renderer.Color.rgba(255, 255, 255, 10),
        .pressed = renderer.Color.rgba(255, 255, 255, 20),
        .focused = renderer.Color.rgba(144, 202, 249, 30),
        .selected = renderer.Color.rgba(144, 202, 249, 50),
    };
}

// Theme presets
pub const Presets = struct {
    pub fn materialLight(allocator: std.mem.Allocator) Theme {
        return Theme.init(allocator, "material-light", .light);
    }

    pub fn materialDark(allocator: std.mem.Allocator) Theme {
        return Theme.init(allocator, "material-dark", .dark);
    }

    pub fn nord(allocator: std.mem.Allocator) Theme {
        var theme = Theme.init(allocator, "nord", .dark);
        theme.colors.primary = renderer.Color.rgb(136, 192, 208);
        theme.colors.background = renderer.Color.rgb(46, 52, 64);
        theme.colors.surface = renderer.Color.rgb(59, 66, 82);
        return theme;
    }

    pub fn dracula(allocator: std.mem.Allocator) Theme {
        var theme = Theme.init(allocator, "dracula", .dark);
        theme.colors.primary = renderer.Color.rgb(189, 147, 249);
        theme.colors.background = renderer.Color.rgb(40, 42, 54);
        theme.colors.surface = renderer.Color.rgb(68, 71, 90);
        return theme;
    }

    pub fn gruvbox(allocator: std.mem.Allocator) Theme {
        var theme = Theme.init(allocator, "gruvbox", .dark);
        theme.colors.primary = renderer.Color.rgb(251, 184, 108);
        theme.colors.background = renderer.Color.rgb(40, 40, 40);
        theme.colors.surface = renderer.Color.rgb(60, 56, 54);
        return theme;
    }
};
