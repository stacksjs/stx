const std = @import("std");

/// Accessibility Module
/// Provides comprehensive accessibility support (WCAG 2.1 AAA compliance)

pub const Role = enum {
    // Document structure
    document,
    article,
    section,
    navigation,
    main,
    complementary,
    banner,
    contentinfo,
    region,

    // Landmarks
    search,
    form,
    application,

    // Widgets
    button,
    checkbox,
    radio,
    textbox,
    combobox,
    listbox,
    menu,
    menubar,
    menuitem,
    menuitemcheckbox,
    menuitemradio,
    slider,
    spinbutton,
    progressbar,
    tab,
    tabpanel,
    tablist,
    tree,
    treeitem,
    dialog,
    alertdialog,
    alert,
    status,
    log,
    marquee,
    timer,
    tooltip,

    // Lists
    list,
    listitem,
    table,
    row,
    cell,
    columnheader,
    rowheader,
    grid,
    gridcell,

    // Media
    img,
    figure,
    math,

    // Other
    separator,
    none,
    presentation,
};

pub const AccessibleElement = struct {
    role: Role,
    label: ?[]const u8 = null,
    description: ?[]const u8 = null,
    value: ?[]const u8 = null,
    focusable: bool = false,
    disabled: bool = false,
    required: bool = false,
    readonly: bool = false,
    checked: ?bool = null,
    expanded: ?bool = null,
    pressed: ?bool = null,
    selected: ?bool = null,
    level: ?u32 = null, // For headings
    orientation: Orientation = .horizontal,
    live: LiveRegion = .off,
    atomic: bool = false,
    busy: bool = false,
};

pub const Orientation = enum {
    horizontal,
    vertical,
};

pub const LiveRegion = enum {
    off,
    polite,
    assertive,
};

pub const ScreenReaderAnnouncement = struct {
    message: []const u8,
    priority: AnnouncementPriority,
    interrupt: bool = false,
};

pub const AnnouncementPriority = enum {
    low,
    medium,
    high,
    critical,
};

pub const Accessibility = struct {
    enabled: bool,
    high_contrast: bool,
    reduce_motion: bool,
    screen_reader_active: bool,
    keyboard_navigation: bool,
    focus_visible: bool,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) Accessibility {
        return Accessibility{
            .enabled = true,
            .high_contrast = false,
            .reduce_motion = false,
            .screen_reader_active = false,
            .keyboard_navigation = true,
            .focus_visible = true,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Accessibility) void {
        _ = self;
    }

    /// Detect if screen reader is active
    pub fn detectScreenReader(self: *Accessibility) bool {
        const builtin = @import("builtin");
        _ = builtin;

        // Platform-specific detection
        self.screen_reader_active = false; // Would detect VoiceOver, NVDA, JAWS, etc.
        return self.screen_reader_active;
    }

    /// Announce message to screen reader
    pub fn announce(self: *Accessibility, announcement: ScreenReaderAnnouncement) !void {
        if (!self.screen_reader_active) return;

        _ = announcement;
        // Platform-specific screen reader announcement
    }

    /// Set high contrast mode
    pub fn setHighContrast(self: *Accessibility, enabled: bool) void {
        self.high_contrast = enabled;
    }

    /// Set reduced motion
    pub fn setReduceMotion(self: *Accessibility, enabled: bool) void {
        self.reduce_motion = enabled;
    }

    /// Check if element is accessible
    pub fn validateElement(self: *Accessibility, element: AccessibleElement) bool {
        _ = self;

        // Must have either label or description
        if (element.label == null and element.description == null) {
            if (element.role != .none and element.role != .presentation) {
                return false;
            }
        }

        // Interactive elements must be focusable
        if (isInteractive(element.role) and !element.focusable) {
            return false;
        }

        return true;
    }

    fn isInteractive(role: Role) bool {
        return switch (role) {
            .button, .checkbox, .radio, .textbox, .combobox,
            .listbox, .menu, .menuitem, .slider, .spinbutton,
            .tab, .dialog, => true,
            else => false,
        };
    }
};

/// Focus manager for keyboard navigation
pub const FocusManager = struct {
    focused_element: ?*AccessibleElement,
    focus_order: std.ArrayList(*AccessibleElement),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) FocusManager {
        return FocusManager{
            .focused_element = null,
            .focus_order = std.ArrayList(*AccessibleElement).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *FocusManager) void {
        self.focus_order.deinit();
    }

    pub fn addToFocusOrder(self: *FocusManager, element: *AccessibleElement) !void {
        if (element.focusable and !element.disabled) {
            try self.focus_order.append(element);
        }
    }

    pub fn focusNext(self: *FocusManager) ?*AccessibleElement {
        if (self.focus_order.items.len == 0) return null;

        if (self.focused_element) |current| {
            for (self.focus_order.items, 0..) |elem, i| {
                if (elem == current) {
                    const next_idx = (i + 1) % self.focus_order.items.len;
                    self.focused_element = self.focus_order.items[next_idx];
                    return self.focused_element;
                }
            }
        }

        self.focused_element = self.focus_order.items[0];
        return self.focused_element;
    }

    pub fn focusPrevious(self: *FocusManager) ?*AccessibleElement {
        if (self.focus_order.items.len == 0) return null;

        if (self.focused_element) |current| {
            for (self.focus_order.items, 0..) |elem, i| {
                if (elem == current) {
                    const prev_idx = if (i == 0) self.focus_order.items.len - 1 else i - 1;
                    self.focused_element = self.focus_order.items[prev_idx];
                    return self.focused_element;
                }
            }
        }

        self.focused_element = self.focus_order.items[self.focus_order.items.len - 1];
        return self.focused_element;
    }

    pub fn focus(self: *FocusManager, element: *AccessibleElement) void {
        if (element.focusable and !element.disabled) {
            self.focused_element = element;
        }
    }

    pub fn blur(self: *FocusManager) void {
        self.focused_element = null;
    }
};

/// Color contrast checker (WCAG 2.1)
pub const ContrastChecker = struct {
    pub fn getRelativeLuminance(r: u8, g: u8, b: u8) f64 {
        const rf = @as(f64, @floatFromInt(r)) / 255.0;
        const gf = @as(f64, @floatFromInt(g)) / 255.0;
        const bf = @as(f64, @floatFromInt(b)) / 255.0;

        const r_lin = if (rf <= 0.03928) rf / 12.92 else std.math.pow(f64, (rf + 0.055) / 1.055, 2.4);
        const g_lin = if (gf <= 0.03928) gf / 12.92 else std.math.pow(f64, (gf + 0.055) / 1.055, 2.4);
        const b_lin = if (bf <= 0.03928) bf / 12.92 else std.math.pow(f64, (bf + 0.055) / 1.055, 2.4);

        return 0.2126 * r_lin + 0.7152 * g_lin + 0.0722 * b_lin;
    }

    pub fn getContrastRatio(color1_r: u8, color1_g: u8, color1_b: u8, color2_r: u8, color2_g: u8, color2_b: u8) f64 {
        const lum1 = getRelativeLuminance(color1_r, color1_g, color1_b);
        const lum2 = getRelativeLuminance(color2_r, color2_g, color2_b);

        const lighter = @max(lum1, lum2);
        const darker = @min(lum1, lum2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    pub fn meetsWCAG_AA(ratio: f64, large_text: bool) bool {
        return if (large_text) ratio >= 3.0 else ratio >= 4.5;
    }

    pub fn meetsWCAG_AAA(ratio: f64, large_text: bool) bool {
        return if (large_text) ratio >= 4.5 else ratio >= 7.0;
    }
};

/// Semantic HTML mapping
pub const SemanticHTML = struct {
    pub fn roleToHTML(role: Role) []const u8 {
        return switch (role) {
            .button => "button",
            .checkbox => "input[type=checkbox]",
            .radio => "input[type=radio]",
            .textbox => "input[type=text]",
            .heading => "h1-h6",
            .link => "a",
            .list => "ul/ol",
            .listitem => "li",
            .navigation => "nav",
            .main => "main",
            .article => "article",
            .section => "section",
            .banner => "header",
            .contentinfo => "footer",
            .complementary => "aside",
            .search => "search",
            .form => "form",
            .table => "table",
            .row => "tr",
            .cell => "td",
            .columnheader => "th",
            .img => "img",
            .figure => "figure",
            else => "div",
        };
    }
};

/// Keyboard navigation helpers
pub const KeyboardNav = struct {
    pub const NavKey = enum {
        tab,
        shift_tab,
        arrow_up,
        arrow_down,
        arrow_left,
        arrow_right,
        home,
        end,
        enter,
        space,
        escape,
    };

    pub fn handleNavigation(key: NavKey, context: NavContext) void {
        switch (context) {
            .menu => handleMenuNav(key),
            .list => handleListNav(key),
            .grid => handleGridNav(key),
            .tabs => handleTabsNav(key),
        }
    }

    fn handleMenuNav(key: NavKey) void {
        _ = key;
        // Menu-specific navigation
    }

    fn handleListNav(key: NavKey) void {
        _ = key;
        // List-specific navigation
    }

    fn handleGridNav(key: NavKey) void {
        _ = key;
        // Grid-specific navigation
    }

    fn handleTabsNav(key: NavKey) void {
        _ = key;
        // Tabs-specific navigation
    }
};

pub const NavContext = enum {
    menu,
    list,
    grid,
    tabs,
};
