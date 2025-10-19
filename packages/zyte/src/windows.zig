const std = @import("std");

// Windows implementation using Win32 API and WebView2
// Requires: Microsoft.Web.WebView2 NuGet package

// Windows API types
pub const HWND = *anyopaque;
pub const HINSTANCE = *anyopaque;
pub const HMENU = *anyopaque;
pub const LPVOID = ?*anyopaque;
pub const LPCWSTR = [*:0]const u16;
pub const LPWSTR = [*:0]u16;
pub const UINT = c_uint;
pub const WPARAM = usize;
pub const LPARAM = isize;
pub const LRESULT = isize;
pub const DWORD = c_ulong;
pub const BOOL = c_int;

pub const WNDCLASSEXW = extern struct {
    cbSize: UINT,
    style: UINT,
    lpfnWndProc: *const fn (HWND, UINT, WPARAM, LPARAM) callconv(.C) LRESULT,
    cbClsExtra: c_int,
    cbWndExtra: c_int,
    hInstance: HINSTANCE,
    hIcon: ?*anyopaque,
    hCursor: ?*anyopaque,
    hbrBackground: ?*anyopaque,
    lpszMenuName: ?LPCWSTR,
    lpszClassName: LPCWSTR,
    hIconSm: ?*anyopaque,
};

pub const MSG = extern struct {
    hwnd: ?HWND,
    message: UINT,
    wParam: WPARAM,
    lParam: LPARAM,
    time: DWORD,
    pt: extern struct {
        x: c_long,
        y: c_long,
    },
};

pub const RECT = extern struct {
    left: c_long,
    top: c_long,
    right: c_long,
    bottom: c_long,
};

// Constants
pub const WS_OVERLAPPEDWINDOW: DWORD = 0x00CF0000;
pub const WS_VISIBLE: DWORD = 0x10000000;
pub const WS_POPUP: DWORD = 0x80000000;
pub const WS_THICKFRAME: DWORD = 0x00040000;
pub const WS_EX_TOPMOST: DWORD = 0x00000008;
pub const WS_EX_LAYERED: DWORD = 0x00080000;
pub const CW_USEDEFAULT: c_int = @bitCast(@as(c_uint, 0x80000000));
pub const SW_SHOW: c_int = 5;
pub const SW_HIDE: c_int = 0;
pub const SW_MAXIMIZE: c_int = 3;
pub const SW_MINIMIZE: c_int = 6;
pub const WM_DESTROY: UINT = 0x0002;
pub const WM_CLOSE: UINT = 0x0010;
pub const PM_REMOVE: UINT = 0x0001;

// Win32 API functions
pub extern "user32" fn RegisterClassExW(*const WNDCLASSEXW) callconv(.C) u16;
pub extern "user32" fn CreateWindowExW(
    dwExStyle: DWORD,
    lpClassName: LPCWSTR,
    lpWindowName: LPCWSTR,
    dwStyle: DWORD,
    x: c_int,
    y: c_int,
    nWidth: c_int,
    nHeight: c_int,
    hWndParent: ?HWND,
    hMenu: ?HMENU,
    hInstance: HINSTANCE,
    lpParam: LPVOID,
) callconv(.C) ?HWND;
pub extern "user32" fn ShowWindow(hWnd: HWND, nCmdShow: c_int) callconv(.C) BOOL;
pub extern "user32" fn UpdateWindow(hWnd: HWND) callconv(.C) BOOL;
pub extern "user32" fn GetMessageW(lpMsg: *MSG, hWnd: ?HWND, wMsgFilterMin: UINT, wMsgFilterMax: UINT) callconv(.C) BOOL;
pub extern "user32" fn PeekMessageW(lpMsg: *MSG, hWnd: ?HWND, wMsgFilterMin: UINT, wMsgFilterMax: UINT, wRemoveMsg: UINT) callconv(.C) BOOL;
pub extern "user32" fn TranslateMessage(lpMsg: *const MSG) callconv(.C) BOOL;
pub extern "user32" fn DispatchMessageW(lpMsg: *const MSG) callconv(.C) LRESULT;
pub extern "user32" fn DefWindowProcW(hWnd: HWND, Msg: UINT, wParam: WPARAM, lParam: LPARAM) callconv(.C) LRESULT;
pub extern "user32" fn PostQuitMessage(nExitCode: c_int) callconv(.C) void;
pub extern "user32" fn DestroyWindow(hWnd: HWND) callconv(.C) BOOL;
pub extern "user32" fn SetWindowTextW(hWnd: HWND, lpString: LPCWSTR) callconv(.C) BOOL;
pub extern "user32" fn SetWindowPos(hWnd: HWND, hWndInsertAfter: ?HWND, X: c_int, Y: c_int, cx: c_int, cy: c_int, uFlags: UINT) callconv(.C) BOOL;
pub extern "user32" fn LoadCursorW(hInstance: ?HINSTANCE, lpCursorName: LPCWSTR) callconv(.C) ?*anyopaque;
pub extern "kernel32" fn GetModuleHandleW(lpModuleName: ?LPCWSTR) callconv(.C) ?HINSTANCE;

// WebView2 bindings (simplified)
pub const ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler = opaque {};
pub const ICoreWebView2CreateCoreWebView2ControllerCompletedHandler = opaque {};
pub const ICoreWebView2Environment = opaque {};
pub const ICoreWebView2Controller = opaque {};
pub const ICoreWebView2 = opaque {};

pub extern "WebView2Loader" fn CreateCoreWebView2EnvironmentWithOptions(
    browserExecutableFolder: ?LPCWSTR,
    userDataFolder: ?LPCWSTR,
    options: ?*anyopaque,
    environmentCreatedHandler: ?*ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler,
) callconv(.C) c_long;

// Application state
var app_running = false;
var window_class_registered = false;
const CLASS_NAME = [_]u16{ 'Z', 'y', 't', 'e', 'W', 'i', 'n', 'd', 'o', 'w', 0 };

pub const WindowStyle = struct {
    frameless: bool = false,
    transparent: bool = false,
    always_on_top: bool = false,
    resizable: bool = true,
    closable: bool = true,
    miniaturizable: bool = true,
    fullscreen: bool = false,
    x: ?i32 = null,
    y: ?i32 = null,
    dark_mode: ?bool = null,
    enable_hot_reload: bool = false,
    dev_tools: bool = true,
};

pub const Window = struct {
    hwnd: HWND,
    controller: ?*ICoreWebView2Controller,
    webview: ?*ICoreWebView2,
    title: []const u8,
    width: u32,
    height: u32,
    x: i32,
    y: i32,

    pub fn create(options: @import("api.zig").WindowOptions) !Window {
        const hInstance = GetModuleHandleW(null) orelse return error.WindowCreationFailed;

        // Register window class if not already done
        if (!window_class_registered) {
            const wc = WNDCLASSEXW{
                .cbSize = @sizeOf(WNDCLASSEXW),
                .style = 0,
                .lpfnWndProc = WindowProc,
                .cbClsExtra = 0,
                .cbWndExtra = 0,
                .hInstance = hInstance,
                .hIcon = null,
                .hCursor = LoadCursorW(null, @ptrFromInt(32512)), // IDC_ARROW
                .hbrBackground = null,
                .lpszMenuName = null,
                .lpszClassName = &CLASS_NAME,
                .hIconSm = null,
            };

            if (RegisterClassExW(&wc) == 0) {
                return error.WindowCreationFailed;
            }
            window_class_registered = true;
        }

        // Determine window style
        var style: DWORD = if (options.frameless) WS_POPUP else WS_OVERLAPPEDWINDOW;
        if (!options.resizable and !options.frameless) {
            style &= ~WS_THICKFRAME;
        }
        style |= WS_VISIBLE;

        const ex_style: DWORD = if (options.always_on_top) WS_EX_TOPMOST else 0;

        // Convert title to wide string
        var title_wide: [256]u16 = undefined;
        const title_len = std.unicode.utf8ToUtf16Le(&title_wide, options.title) catch return error.WindowCreationFailed;
        title_wide[title_len] = 0;

        // Calculate window position
        const x = options.x orelse CW_USEDEFAULT;
        const y = options.y orelse CW_USEDEFAULT;

        // Create window
        const hwnd = CreateWindowExW(
            ex_style,
            &CLASS_NAME,
            &title_wide,
            style,
            x,
            y,
            @intCast(options.width),
            @intCast(options.height),
            null,
            null,
            hInstance,
            null,
        ) orelse return error.WindowCreationFailed;

        // Initialize WebView2 (simplified - actual implementation would be async)
        // For now, we'll return without WebView2 initialization

        return Window{
            .hwnd = hwnd,
            .controller = null,
            .webview = null,
            .title = options.title,
            .width = options.width,
            .height = options.height,
            .x = x,
            .y = y,
        };
    }

    pub fn show(self: *Window) void {
        _ = ShowWindow(self.hwnd, SW_SHOW);
        _ = UpdateWindow(self.hwnd);
    }

    pub fn hide(self: *Window) void {
        _ = ShowWindow(self.hwnd, SW_HIDE);
    }

    pub fn close(self: *Window) void {
        _ = DestroyWindow(self.hwnd);
    }

    pub fn setSize(self: *Window, width: u32, height: u32) void {
        _ = SetWindowPos(self.hwnd, null, 0, 0, @intCast(width), @intCast(height), 0x0002); // SWP_NOMOVE
        self.width = width;
        self.height = height;
    }

    pub fn setPosition(self: *Window, x: i32, y: i32) void {
        _ = SetWindowPos(self.hwnd, null, @intCast(x), @intCast(y), 0, 0, 0x0001); // SWP_NOSIZE
        self.x = x;
        self.y = y;
    }

    pub fn setTitle(self: *Window, title: []const u8) void {
        var title_wide: [256]u16 = undefined;
        const title_len = std.unicode.utf8ToUtf16Le(&title_wide, title) catch return;
        title_wide[title_len] = 0;
        _ = SetWindowTextW(self.hwnd, &title_wide);
        self.title = title;
    }

    pub fn loadURL(self: *Window, url: []const u8) !void {
        _ = self;
        _ = url;
        // Would use WebView2->Navigate()
        // This requires async WebView2 initialization
    }

    pub fn loadHTML(self: *Window, html: []const u8) !void {
        _ = self;
        _ = html;
        // Would use WebView2->NavigateToString()
    }

    pub fn maximize(self: *Window) void {
        _ = ShowWindow(self.hwnd, SW_MAXIMIZE);
    }

    pub fn minimize(self: *Window) void {
        _ = ShowWindow(self.hwnd, SW_MINIMIZE);
    }

    pub fn setFullscreen(self: *Window, fullscreen: bool) void {
        _ = self;
        _ = fullscreen;
        // Would modify window style and size
    }
};

fn WindowProc(hwnd: HWND, msg: UINT, wParam: WPARAM, lParam: LPARAM) callconv(.C) LRESULT {
    switch (msg) {
        WM_DESTROY, WM_CLOSE => {
            PostQuitMessage(0);
            return 0;
        },
        else => {},
    }
    return DefWindowProcW(hwnd, msg, wParam, lParam);
}

pub const App = struct {
    pub fn run() !void {
        app_running = true;
        var msg: MSG = undefined;

        while (GetMessageW(&msg, null, 0, 0) != 0) {
            _ = TranslateMessage(&msg);
            _ = DispatchMessageW(&msg);
        }
    }

    pub fn quit() void {
        app_running = false;
        PostQuitMessage(0);
    }
};

// Legacy API compatibility
pub fn createWindow(title: []const u8, width: u32, height: u32, html: []const u8) !*anyopaque {
    var window = try Window.create(.{
        .title = title,
        .width = width,
        .height = height,
    });
    try window.loadHTML(html);
    window.show();
    return window.hwnd;
}

pub fn createWindowWithURL(title: []const u8, width: u32, height: u32, url: []const u8, style: WindowStyle) !*anyopaque {
    var window = try Window.create(.{
        .title = title,
        .width = width,
        .height = height,
        .x = style.x,
        .y = style.y,
        .resizable = style.resizable,
        .frameless = style.frameless,
        .transparent = style.transparent,
        .fullscreen = style.fullscreen,
        .dark_mode = style.dark_mode,
        .dev_tools = style.dev_tools,
    });
    try window.loadURL(url);
    window.show();
    return window.hwnd;
}

pub fn runApp() void {
    App.run() catch |err| {
        std.debug.print("Error running Windows app: {}\n", .{err});
    };
}

// Notifications using Windows Toast
pub extern "shell32" fn Shell_NotifyIconW(dwMessage: DWORD, lpData: *anyopaque) callconv(.C) BOOL;

pub fn showNotification(title: []const u8, message: []const u8) !void {
    _ = title;
    _ = message;
    // Would use Windows Toast Notifications API
    // This requires COM initialization and WinRT APIs
}

// Clipboard using Windows API
pub extern "user32" fn OpenClipboard(hWndNewOwner: ?HWND) callconv(.C) BOOL;
pub extern "user32" fn CloseClipboard() callconv(.C) BOOL;
pub extern "user32" fn EmptyClipboard() callconv(.C) BOOL;
pub extern "user32" fn SetClipboardData(uFormat: UINT, hMem: ?*anyopaque) callconv(.C) ?*anyopaque;
pub extern "user32" fn GetClipboardData(uFormat: UINT) callconv(.C) ?*anyopaque;
pub extern "kernel32" fn GlobalAlloc(uFlags: UINT, dwBytes: usize) callconv(.C) ?*anyopaque;
pub extern "kernel32" fn GlobalLock(hMem: *anyopaque) callconv(.C) LPVOID;
pub extern "kernel32" fn GlobalUnlock(hMem: *anyopaque) callconv(.C) BOOL;
pub extern "kernel32" fn GlobalSize(hMem: *anyopaque) callconv(.C) usize;

const CF_UNICODETEXT: UINT = 13;
const GMEM_MOVEABLE: UINT = 0x0002;

pub fn setClipboard(text: []const u8) !void {
    // Convert UTF-8 to UTF-16
    var text_wide_buf: [4096]u16 = undefined;
    const text_len = try std.unicode.utf8ToUtf16Le(&text_wide_buf, text);

    const byte_size = (text_len + 1) * 2; // +1 for null terminator, *2 for u16

    const hMem = GlobalAlloc(GMEM_MOVEABLE, byte_size) orelse return error.ClipboardError;
    const pMem = GlobalLock(hMem) orelse return error.ClipboardError;

    // Copy text to global memory
    const dest: [*]u16 = @ptrCast(@alignCast(pMem));
    @memcpy(dest[0..text_len], text_wide_buf[0..text_len]);
    dest[text_len] = 0; // Null terminator

    _ = GlobalUnlock(hMem);

    if (OpenClipboard(null) == 0) return error.ClipboardError;
    defer _ = CloseClipboard();

    _ = EmptyClipboard();
    _ = SetClipboardData(CF_UNICODETEXT, hMem);
}

pub fn getClipboard(allocator: std.mem.Allocator) ![]u8 {
    if (OpenClipboard(null) == 0) return error.ClipboardError;
    defer _ = CloseClipboard();

    const hMem = GetClipboardData(CF_UNICODETEXT) orelse return "";
    const pMem = GlobalLock(hMem) orelse return "";
    defer _ = GlobalUnlock(hMem);

    const text_wide: [*:0]const u16 = @ptrCast(@alignCast(pMem));
    const text_len = std.mem.indexOfSentinel(u16, 0, text_wide);

    // Convert UTF-16 to UTF-8
    const utf8_len = std.unicode.utf16leToUtf8AllocZ(allocator, text_wide[0..text_len]) catch return "";
    return utf8_len;
}
