const std = @import("std");

/// Comprehensive error set for Zyte
pub const ZyteError = error{
    // Window errors
    WindowCreationFailed,
    WindowNotFound,
    InvalidWindowHandle,
    
    // WebView errors
    WebViewCreationFailed,
    WebViewLoadFailed,
    InvalidURL,
    
    // File errors
    FileNotFound,
    FileReadError,
    FileWriteError,
    InvalidPath,
    
    // Plugin errors
    PluginLoadFailed,
    PluginNotFound,
    PluginFunctionNotFound,
    InvalidPluginPath,
    
    // IPC errors
    IpcChannelNotFound,
    IpcMessageSendFailed,
    InvalidMessage,
    
    // Permission errors
    PermissionDenied,
    SandboxViolation,
    
    // Configuration errors
    ConfigLoadFailed,
    ConfigParseError,
    InvalidConfiguration,
    
    // Platform errors
    UnsupportedPlatform,
    PlatformApiError,
    
    // Network errors
    WebSocketConnectionFailed,
    NetworkError,
    
    // General errors
    NotImplemented,
    InvalidArgument,
    OutOfMemory,
    Timeout,
};

/// Error context for better debugging
pub const ErrorContext = struct {
    message: []const u8,
    file: []const u8,
    line: u32,
    
    pub fn create(message: []const u8, file: []const u8, line: u32) ErrorContext {
        return .{
            .message = message,
            .file = file,
            .line = line,
        };
    }
    
    pub fn print(self: ErrorContext) void {
        std.debug.print("[ERROR] {s}:{d} - {s}\n", .{ self.file, self.line, self.message });
    }
};

/// Helper macro for creating error contexts
pub fn errorContext(comptime message: []const u8) ErrorContext {
    return ErrorContext.create(message, @src().file, @src().line);
}
