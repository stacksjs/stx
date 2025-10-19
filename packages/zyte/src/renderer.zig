const std = @import("std");

/// Native Rendering Module
/// Provides alternative to WebView for pure native UI

pub const RenderBackend = enum {
    webview, // Default WebView rendering
    native, // Pure native rendering
    hybrid, // Mix of native and web
};

pub const Color = struct {
    r: u8,
    g: u8,
    b: u8,
    a: u8 = 255,

    pub fn rgb(r: u8, g: u8, b: u8) Color {
        return Color{ .r = r, .g = g, .b = b };
    }

    pub fn rgba(r: u8, g: u8, b: u8, a: u8) Color {
        return Color{ .r = r, .g = g, .b = b, .a = a };
    }

    pub fn fromHex(hex: u32) Color {
        return Color{
            .r = @intCast((hex >> 16) & 0xFF),
            .g = @intCast((hex >> 8) & 0xFF),
            .b = @intCast(hex & 0xFF),
            .a = 255,
        };
    }
};

pub const Point = struct {
    x: i32,
    y: i32,
};

pub const Size = struct {
    width: u32,
    height: u32,
};

pub const Rect = struct {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
};

pub const Font = struct {
    family: []const u8,
    size: f32,
    weight: FontWeight = .normal,
    style: FontStyle = .normal,
};

pub const FontWeight = enum {
    thin,
    light,
    normal,
    medium,
    semibold,
    bold,
    black,
};

pub const FontStyle = enum {
    normal,
    italic,
    oblique,
};

pub const Renderer = struct {
    backend: RenderBackend,
    canvas: ?*Canvas,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, backend: RenderBackend) Renderer {
        return Renderer{
            .backend = backend,
            .canvas = null,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Renderer) void {
        if (self.canvas) |canvas| {
            canvas.deinit();
        }
    }

    pub fn createCanvas(self: *Renderer, width: u32, height: u32) !*Canvas {
        const canvas = try self.allocator.create(Canvas);
        canvas.* = try Canvas.init(self.allocator, width, height);
        self.canvas = canvas;
        return canvas;
    }
};

pub const Canvas = struct {
    width: u32,
    height: u32,
    pixels: []u32,
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, width: u32, height: u32) !Canvas {
        const pixels = try allocator.alloc(u32, width * height);
        @memset(pixels, 0xFFFFFFFF); // White background

        return Canvas{
            .width = width,
            .height = height,
            .pixels = pixels,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Canvas) void {
        self.allocator.free(self.pixels);
    }

    pub fn clear(self: *Canvas, color: Color) void {
        const pixel = (@as(u32, color.a) << 24) | (@as(u32, color.r) << 16) | (@as(u32, color.g) << 8) | color.b;
        @memset(self.pixels, pixel);
    }

    pub fn drawRect(self: *Canvas, rect: Rect, color: Color) void {
        const pixel = (@as(u32, color.a) << 24) | (@as(u32, color.r) << 16) | (@as(u32, color.g) << 8) | color.b;

        var y: i32 = rect.y;
        while (y < rect.y + @as(i32, @intCast(rect.height))) : (y += 1) {
            if (y < 0 or y >= @as(i32, @intCast(self.height))) continue;

            var x: i32 = rect.x;
            while (x < rect.x + @as(i32, @intCast(rect.width))) : (x += 1) {
                if (x < 0 or x >= @as(i32, @intCast(self.width))) continue;

                const index = @as(usize, @intCast(y)) * self.width + @as(usize, @intCast(x));
                self.pixels[index] = pixel;
            }
        }
    }

    pub fn drawCircle(self: *Canvas, center: Point, radius: u32, color: Color) void {
        const pixel = (@as(u32, color.a) << 24) | (@as(u32, color.r) << 16) | (@as(u32, color.g) << 8) | color.b;
        const r_sq = @as(i32, @intCast(radius * radius));

        var y: i32 = center.y - @as(i32, @intCast(radius));
        while (y <= center.y + @as(i32, @intCast(radius))) : (y += 1) {
            if (y < 0 or y >= @as(i32, @intCast(self.height))) continue;

            var x: i32 = center.x - @as(i32, @intCast(radius));
            while (x <= center.x + @as(i32, @intCast(radius))) : (x += 1) {
                if (x < 0 or x >= @as(i32, @intCast(self.width))) continue;

                const dx = x - center.x;
                const dy = y - center.y;
                if (dx * dx + dy * dy <= r_sq) {
                    const index = @as(usize, @intCast(y)) * self.width + @as(usize, @intCast(x));
                    self.pixels[index] = pixel;
                }
            }
        }
    }

    pub fn drawLine(self: *Canvas, from: Point, to: Point, color: Color) void {
        const pixel = (@as(u32, color.a) << 24) | (@as(u32, color.r) << 16) | (@as(u32, color.g) << 8) | color.b;

        var x0 = from.x;
        var y0 = from.y;
        const x1 = to.x;
        const y1 = to.y;

        const dx = @abs(x1 - x0);
        const dy = @abs(y1 - y0);
        const sx: i32 = if (x0 < x1) 1 else -1;
        const sy: i32 = if (y0 < y1) 1 else -1;
        var err = dx - dy;

        while (true) {
            if (x0 >= 0 and x0 < @as(i32, @intCast(self.width)) and y0 >= 0 and y0 < @as(i32, @intCast(self.height))) {
                const index = @as(usize, @intCast(y0)) * self.width + @as(usize, @intCast(x0));
                self.pixels[index] = pixel;
            }

            if (x0 == x1 and y0 == y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    pub fn drawText(self: *Canvas, text: []const u8, pos: Point, font: Font, color: Color) void {
        _ = self;
        _ = text;
        _ = pos;
        _ = font;
        _ = color;
        // Would render text using platform-specific text rendering
    }

    pub fn getPixel(self: Canvas, x: u32, y: u32) ?Color {
        if (x >= self.width or y >= self.height) return null;

        const pixel = self.pixels[y * self.width + x];
        return Color{
            .a = @intCast((pixel >> 24) & 0xFF),
            .r = @intCast((pixel >> 16) & 0xFF),
            .g = @intCast((pixel >> 8) & 0xFF),
            .b = @intCast(pixel & 0xFF),
        };
    }

    pub fn setPixel(self: *Canvas, x: u32, y: u32, color: Color) void {
        if (x >= self.width or y >= self.height) return;

        const pixel = (@as(u32, color.a) << 24) | (@as(u32, color.r) << 16) | (@as(u32, color.g) << 8) | color.b;
        self.pixels[y * self.width + x] = pixel;
    }
};

/// UI Component system for native rendering
pub const Component = struct {
    bounds: Rect,
    visible: bool,
    children: std.ArrayList(*Component),
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator, bounds: Rect) Component {
        return Component{
            .bounds = bounds,
            .visible = true,
            .children = std.ArrayList(*Component).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *Component) void {
        for (self.children.items) |child| {
            child.deinit();
            self.allocator.destroy(child);
        }
        self.children.deinit();
    }

    pub fn addChild(self: *Component, child: *Component) !void {
        try self.children.append(child);
    }

    pub fn render(self: *Component, canvas: *Canvas) void {
        if (!self.visible) return;

        // Render self
        canvas.drawRect(self.bounds, Color.rgb(200, 200, 200));

        // Render children
        for (self.children.items) |child| {
            child.render(canvas);
        }
    }
};

/// Button component
pub const Button = struct {
    component: Component,
    text: []const u8,
    background: Color,
    foreground: Color,
    font: Font,

    pub fn init(allocator: std.mem.Allocator, bounds: Rect, text: []const u8) Button {
        return Button{
            .component = Component.init(allocator, bounds),
            .text = text,
            .background = Color.rgb(100, 100, 200),
            .foreground = Color.rgb(255, 255, 255),
            .font = Font{
                .family = "system",
                .size = 14.0,
            },
        };
    }

    pub fn render(self: *Button, canvas: *Canvas) void {
        canvas.drawRect(self.component.bounds, self.background);
        // Would render text
        _ = self.text;
        _ = self.foreground;
        _ = self.font;
    }
};

/// Label component
pub const Label = struct {
    component: Component,
    text: []const u8,
    color: Color,
    font: Font,

    pub fn init(allocator: std.mem.Allocator, bounds: Rect, text: []const u8) Label {
        return Label{
            .component = Component.init(allocator, bounds),
            .text = text,
            .color = Color.rgb(0, 0, 0),
            .font = Font{
                .family = "system",
                .size = 14.0,
            },
        };
    }

    pub fn render(self: *Label, canvas: *Canvas) void {
        canvas.drawText(self.text, Point{ .x = self.component.bounds.x, .y = self.component.bounds.y }, self.font, self.color);
    }
};
