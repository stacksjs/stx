const std = @import("std");

/// Native Dialog System
/// Provides comprehensive native dialogs with platform-specific implementations

pub const DialogType = enum {
    file_open,
    file_save,
    directory,
    color,
    font,
    message,
    confirm,
    input,
    progress,
    custom,
};

pub const DialogResult = union(enum) {
    ok: void,
    cancel: void,
    yes: void,
    no: void,
    file_path: []const u8,
    file_paths: []const []const u8,
    directory_path: []const u8,
    color: Color,
    font: Font,
    text: []const u8,
};

pub const Color = struct {
    r: u8,
    g: u8,
    b: u8,
    a: u8,

    pub fn rgb(r: u8, g: u8, b: u8) Color {
        return Color{ .r = r, .g = g, .b = b, .a = 255 };
    }

    pub fn rgba(r: u8, g: u8, b: u8, a: u8) Color {
        return Color{ .r = r, .g = g, .b = b, .a = a };
    }

    pub fn toHex(self: Color) []const u8 {
        var buf: [7]u8 = undefined;
        _ = std.fmt.bufPrint(&buf, "#{x:0>2}{x:0>2}{x:0>2}", .{ self.r, self.g, self.b }) catch return "#000000";
        return &buf;
    }

    pub fn fromHex(hex: []const u8) !Color {
        if (hex.len < 6) return error.InvalidHex;
        const start: usize = if (hex[0] == '#') 1 else 0;

        const r = try std.fmt.parseInt(u8, hex[start .. start + 2], 16);
        const g = try std.fmt.parseInt(u8, hex[start + 2 .. start + 4], 16);
        const b = try std.fmt.parseInt(u8, hex[start + 4 .. start + 6], 16);

        return Color.rgb(r, g, b);
    }
};

pub const Font = struct {
    family: []const u8,
    size: f32,
    weight: FontWeight,
    style: FontStyle,

    pub const FontWeight = enum {
        thin,
        light,
        regular,
        medium,
        semibold,
        bold,
        black,

        pub fn toNumber(self: FontWeight) u16 {
            return switch (self) {
                .thin => 100,
                .light => 300,
                .regular => 400,
                .medium => 500,
                .semibold => 600,
                .bold => 700,
                .black => 900,
            };
        }
    };

    pub const FontStyle = enum {
        normal,
        italic,
        oblique,
    };
};

pub const FileFilter = struct {
    name: []const u8,
    extensions: []const []const u8,

    pub fn create(name: []const u8, extensions: []const []const u8) FileFilter {
        return FileFilter{
            .name = name,
            .extensions = extensions,
        };
    }
};

pub const FileDialogOptions = struct {
    title: []const u8 = "Select File",
    default_path: ?[]const u8 = null,
    filters: []const FileFilter = &[_]FileFilter{},
    multi_select: bool = false,
    show_hidden: bool = false,
    create_directories: bool = false,
    default_extension: ?[]const u8 = null,
};

pub const DirectoryDialogOptions = struct {
    title: []const u8 = "Select Directory",
    default_path: ?[]const u8 = null,
    create_directories: bool = true,
    show_hidden: bool = false,
};

pub const MessageDialogOptions = struct {
    title: []const u8 = "Message",
    message: []const u8,
    detail: ?[]const u8 = null,
    type: MessageType = .info,
    buttons: ButtonSet = .ok,

    pub const MessageType = enum {
        info,
        warning,
        error_msg,
        question,
    };

    pub const ButtonSet = enum {
        ok,
        ok_cancel,
        yes_no,
        yes_no_cancel,
        retry_cancel,
    };
};

pub const ConfirmDialogOptions = struct {
    title: []const u8 = "Confirm",
    message: []const u8,
    detail: ?[]const u8 = null,
    confirm_text: []const u8 = "OK",
    cancel_text: []const u8 = "Cancel",
    destructive: bool = false,
};

pub const InputDialogOptions = struct {
    title: []const u8 = "Input",
    message: []const u8,
    default_value: []const u8 = "",
    placeholder: ?[]const u8 = null,
    secure: bool = false,
    multiline: bool = false,
};

pub const ProgressDialogOptions = struct {
    title: []const u8 = "Progress",
    message: []const u8,
    cancelable: bool = true,
    indeterminate: bool = false,
    min: f32 = 0.0,
    max: f32 = 100.0,
};

pub const ColorDialogOptions = struct {
    title: []const u8 = "Select Color",
    default_color: Color = Color.rgb(255, 255, 255),
    show_alpha: bool = true,
    show_palette: bool = true,
    custom_colors: []const Color = &[_]Color{},
};

pub const FontDialogOptions = struct {
    title: []const u8 = "Select Font",
    default_font: ?Font = null,
    min_size: f32 = 8.0,
    max_size: f32 = 72.0,
    show_effects: bool = true,
    show_color: bool = false,
};

pub const Dialog = struct {
    type: DialogType,
    handle: ?*anyopaque = null,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, dialog_type: DialogType) Dialog {
        return Dialog{
            .type = dialog_type,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Dialog) void {
        // Platform-specific cleanup
        _ = self;
    }

    pub fn showFileOpen(allocator: std.mem.Allocator, options: FileDialogOptions) !?DialogResult {
        const dialog = Dialog.init(allocator, .file_open);
        _ = dialog;

        // Platform-specific implementation
        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacFileDialog(options),
            .linux => showLinuxFileDialog(options),
            .windows => showWindowsFileDialog(options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showFileSave(allocator: std.mem.Allocator, options: FileDialogOptions) !?DialogResult {
        const dialog = Dialog.init(allocator, .file_save);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacFileSaveDialog(options),
            .linux => showLinuxFileSaveDialog(options),
            .windows => showWindowsFileSaveDialog(options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showDirectory(allocator: std.mem.Allocator, options: DirectoryDialogOptions) !?DialogResult {
        const dialog = Dialog.init(allocator, .directory);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacDirectoryDialog(options),
            .linux => showLinuxDirectoryDialog(options),
            .windows => showWindowsDirectoryDialog(options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showMessage(allocator: std.mem.Allocator, options: MessageDialogOptions) !DialogResult {
        const dialog = Dialog.init(allocator, .message);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacMessageDialog(options),
            .linux => showLinuxMessageDialog(options),
            .windows => showWindowsMessageDialog(options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showConfirm(allocator: std.mem.Allocator, options: ConfirmDialogOptions) !DialogResult {
        const dialog = Dialog.init(allocator, .confirm);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacConfirmDialog(options),
            .linux => showLinuxConfirmDialog(options),
            .windows => showWindowsConfirmDialog(options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showInput(allocator: std.mem.Allocator, options: InputDialogOptions) !?DialogResult {
        const dialog = Dialog.init(allocator, .input);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacInputDialog(allocator, options),
            .linux => showLinuxInputDialog(allocator, options),
            .windows => showWindowsInputDialog(allocator, options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showColor(allocator: std.mem.Allocator, options: ColorDialogOptions) !?DialogResult {
        const dialog = Dialog.init(allocator, .color);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacColorDialog(options),
            .linux => showLinuxColorDialog(options),
            .windows => showWindowsColorDialog(options),
            else => error.UnsupportedPlatform,
        };
    }

    pub fn showFont(allocator: std.mem.Allocator, options: FontDialogOptions) !?DialogResult {
        const dialog = Dialog.init(allocator, .font);
        _ = dialog;

        const builtin = @import("builtin");
        return switch (builtin.target.os.tag) {
            .macos => showMacFontDialog(allocator, options),
            .linux => showLinuxFontDialog(allocator, options),
            .windows => showWindowsFontDialog(allocator, options),
            else => error.UnsupportedPlatform,
        };
    }
};

pub const ProgressDialog = struct {
    handle: ?*anyopaque,
    progress: f32,
    message: []const u8,
    cancelable: bool,
    canceled: bool,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, options: ProgressDialogOptions) !ProgressDialog {
        _ = options;
        return ProgressDialog{
            .handle = null,
            .progress = 0.0,
            .message = "",
            .cancelable = true,
            .canceled = false,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *ProgressDialog) void {
        _ = self;
    }

    pub fn setProgress(self: *ProgressDialog, value: f32) void {
        self.progress = value;
        // Update native dialog
    }

    pub fn setMessage(self: *ProgressDialog, message: []const u8) void {
        self.message = message;
        // Update native dialog
    }

    pub fn isCanceled(self: ProgressDialog) bool {
        return self.canceled;
    }

    pub fn close(self: *ProgressDialog) void {
        self.deinit();
    }
};

// Platform-specific implementations (simplified stubs)
fn showMacFileDialog(options: FileDialogOptions) !?DialogResult {
    _ = options;
    // Would use NSOpenPanel
    return null;
}

fn showMacFileSaveDialog(options: FileDialogOptions) !?DialogResult {
    _ = options;
    // Would use NSSavePanel
    return null;
}

fn showMacDirectoryDialog(options: DirectoryDialogOptions) !?DialogResult {
    _ = options;
    // Would use NSOpenPanel with canChooseDirectories
    return null;
}

fn showMacMessageDialog(options: MessageDialogOptions) !DialogResult {
    _ = options;
    // Would use NSAlert
    return DialogResult{ .ok = {} };
}

fn showMacConfirmDialog(options: ConfirmDialogOptions) !DialogResult {
    _ = options;
    // Would use NSAlert with buttons
    return DialogResult{ .ok = {} };
}

fn showMacInputDialog(allocator: std.mem.Allocator, options: InputDialogOptions) !?DialogResult {
    _ = allocator;
    _ = options;
    // Would use NSAlert with text field
    return null;
}

fn showMacColorDialog(options: ColorDialogOptions) !?DialogResult {
    _ = options;
    // Would use NSColorPanel
    return null;
}

fn showMacFontDialog(allocator: std.mem.Allocator, options: FontDialogOptions) !?DialogResult {
    _ = allocator;
    _ = options;
    // Would use NSFontPanel
    return null;
}

fn showLinuxFileDialog(options: FileDialogOptions) !?DialogResult {
    _ = options;
    // Would use GtkFileChooserDialog
    return null;
}

fn showLinuxFileSaveDialog(options: FileDialogOptions) !?DialogResult {
    _ = options;
    // Would use GtkFileChooserDialog with save action
    return null;
}

fn showLinuxDirectoryDialog(options: DirectoryDialogOptions) !?DialogResult {
    _ = options;
    // Would use GtkFileChooserDialog with select folder action
    return null;
}

fn showLinuxMessageDialog(options: MessageDialogOptions) !DialogResult {
    _ = options;
    // Would use GtkMessageDialog
    return DialogResult{ .ok = {} };
}

fn showLinuxConfirmDialog(options: ConfirmDialogOptions) !DialogResult {
    _ = options;
    // Would use GtkMessageDialog with yes/no buttons
    return DialogResult{ .ok = {} };
}

fn showLinuxInputDialog(allocator: std.mem.Allocator, options: InputDialogOptions) !?DialogResult {
    _ = allocator;
    _ = options;
    // Would use GtkDialog with GtkEntry
    return null;
}

fn showLinuxColorDialog(options: ColorDialogOptions) !?DialogResult {
    _ = options;
    // Would use GtkColorChooserDialog
    return null;
}

fn showLinuxFontDialog(allocator: std.mem.Allocator, options: FontDialogOptions) !?DialogResult {
    _ = allocator;
    _ = options;
    // Would use GtkFontChooserDialog
    return null;
}

fn showWindowsFileDialog(options: FileDialogOptions) !?DialogResult {
    _ = options;
    // Would use IFileOpenDialog COM interface
    return null;
}

fn showWindowsFileSaveDialog(options: FileDialogOptions) !?DialogResult {
    _ = options;
    // Would use IFileSaveDialog COM interface
    return null;
}

fn showWindowsDirectoryDialog(options: DirectoryDialogOptions) !?DialogResult {
    _ = options;
    // Would use IFileOpenDialog with FOS_PICKFOLDERS
    return null;
}

fn showWindowsMessageDialog(options: MessageDialogOptions) !DialogResult {
    _ = options;
    // Would use MessageBox or TaskDialog
    return DialogResult{ .ok = {} };
}

fn showWindowsConfirmDialog(options: ConfirmDialogOptions) !DialogResult {
    _ = options;
    // Would use MessageBox or TaskDialog
    return DialogResult{ .ok = {} };
}

fn showWindowsInputDialog(allocator: std.mem.Allocator, options: InputDialogOptions) !?DialogResult {
    _ = allocator;
    _ = options;
    // Would use custom dialog with edit control
    return null;
}

fn showWindowsColorDialog(options: ColorDialogOptions) !?DialogResult {
    _ = options;
    // Would use ChooseColor
    return null;
}

fn showWindowsFontDialog(allocator: std.mem.Allocator, options: FontDialogOptions) !?DialogResult {
    _ = allocator;
    _ = options;
    // Would use ChooseFont
    return null;
}

/// Common dialog presets for convenience
pub const CommonDialogs = struct {
    pub fn openImage(allocator: std.mem.Allocator) !?DialogResult {
        const filters = [_]FileFilter{
            FileFilter.create("Images", &[_][]const u8{ "png", "jpg", "jpeg", "gif", "bmp", "svg" }),
            FileFilter.create("All Files", &[_][]const u8{"*"}),
        };

        return Dialog.showFileOpen(allocator, .{
            .title = "Open Image",
            .filters = &filters,
        });
    }

    pub fn openText(allocator: std.mem.Allocator) !?DialogResult {
        const filters = [_]FileFilter{
            FileFilter.create("Text Files", &[_][]const u8{ "txt", "md", "json", "xml", "html" }),
            FileFilter.create("All Files", &[_][]const u8{"*"}),
        };

        return Dialog.showFileOpen(allocator, .{
            .title = "Open Text File",
            .filters = &filters,
        });
    }

    pub fn saveAs(allocator: std.mem.Allocator, default_name: []const u8) !?DialogResult {
        return Dialog.showFileSave(allocator, .{
            .title = "Save As",
            .default_path = default_name,
        });
    }

    pub fn confirmDelete(allocator: std.mem.Allocator, item_name: []const u8) !DialogResult {
        var message_buf: [256]u8 = undefined;
        const message = try std.fmt.bufPrint(&message_buf, "Are you sure you want to delete '{s}'?", .{item_name});

        return Dialog.showConfirm(allocator, .{
            .title = "Confirm Delete",
            .message = message,
            .confirm_text = "Delete",
            .destructive = true,
        });
    }

    pub fn showError(allocator: std.mem.Allocator, error_message: []const u8) !DialogResult {
        return Dialog.showMessage(allocator, .{
            .title = "Error",
            .message = error_message,
            .type = .error_msg,
        });
    }

    pub fn showInfo(allocator: std.mem.Allocator, info_message: []const u8) !DialogResult {
        return Dialog.showMessage(allocator, .{
            .title = "Information",
            .message = info_message,
            .type = .info,
        });
    }
};
