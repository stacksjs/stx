const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Create the zyte module
    const zyte_module = b.createModule(.{
        .root_source_file = b.path("src/main.zig"),
    });

    // Example executable
    const exe = b.addExecutable(.{
        .name = "zyte-example",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/example.zig"),
            .target = target,
            .optimize = optimize,
            .imports = &.{
                .{ .name = "zyte", .module = zyte_module },
            },
        }),
    });

    // Add system libraries based on platform
    const target_os = target.result.os.tag;
    switch (target_os) {
        .macos => {
            exe.linkFramework("Cocoa");
            exe.linkFramework("WebKit");
        },
        .linux => {
            exe.linkSystemLibrary("gtk+-3.0");
            exe.linkSystemLibrary("webkit2gtk-4.0");
        },
        .windows => {
            exe.linkSystemLibrary("ole32");
            exe.linkSystemLibrary("user32");
            exe.linkSystemLibrary("gdi32");
        },
        else => {},
    }

    exe.linkLibC();
    b.installArtifact(exe);

    const run_cmd = b.addRunArtifact(exe);
    run_cmd.step.dependOn(b.getInstallStep());

    if (b.args) |args| {
        run_cmd.addArgs(args);
    }

    const run_step = b.step("run", "Run the example app");
    run_step.dependOn(&run_cmd.step);

    // Minimal app executable
    const minimal_exe = b.addExecutable(.{
        .name = "zyte-minimal",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/minimal.zig"),
            .target = target,
            .optimize = optimize,
            .imports = &.{
                .{ .name = "zyte", .module = zyte_module },
            },
        }),
    });

    switch (target_os) {
        .macos => {
            minimal_exe.linkFramework("Cocoa");
            minimal_exe.linkFramework("WebKit");
        },
        .linux => {
            minimal_exe.linkSystemLibrary("gtk+-3.0");
            minimal_exe.linkSystemLibrary("webkit2gtk-4.0");
        },
        .windows => {
            minimal_exe.linkSystemLibrary("ole32");
            minimal_exe.linkSystemLibrary("user32");
            minimal_exe.linkSystemLibrary("gdi32");
        },
        else => {},
    }

    minimal_exe.linkLibC();
    b.installArtifact(minimal_exe);

    const run_minimal_cmd = b.addRunArtifact(minimal_exe);
    run_minimal_cmd.step.dependOn(b.getInstallStep());

    if (b.args) |args| {
        run_minimal_cmd.addArgs(args);
    }

    const run_minimal_step = b.step("run-minimal", "Run the minimal app");
    run_minimal_step.dependOn(&run_minimal_cmd.step);

    // Tests
    const lib_unit_tests = b.addTest(.{
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/main.zig"),
            .target = target,
            .optimize = optimize,
        }),
    });

    const run_lib_unit_tests = b.addRunArtifact(lib_unit_tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_lib_unit_tests.step);

    // Cross-compilation helpers
    const build_linux = b.step("build-linux", "Build for Linux");
    const build_windows = b.step("build-windows", "Build for Windows");
    const build_macos = b.step("build-macos", "Build for macOS");
    const build_all = b.step("build-all", "Build for all platforms");

    // Linux target
    const linux_target = b.resolveTargetQuery(.{
        .cpu_arch = .x86_64,
        .os_tag = .linux,
        .abi = .gnu,
    });

    const linux_exe = b.addExecutable(.{
        .name = "zyte-linux",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/minimal.zig"),
            .target = linux_target,
            .optimize = optimize,
            .imports = &.{
                .{ .name = "zyte", .module = zyte_module },
            },
        }),
    });
    linux_exe.linkSystemLibrary("gtk+-3.0");
    linux_exe.linkSystemLibrary("webkit2gtk-4.0");
    linux_exe.linkLibC();

    const linux_install = b.addInstallArtifact(linux_exe, .{});
    build_linux.dependOn(&linux_install.step);
    build_all.dependOn(&linux_install.step);

    // Windows target
    const windows_target = b.resolveTargetQuery(.{
        .cpu_arch = .x86_64,
        .os_tag = .windows,
        .abi = .gnu,
    });

    const windows_exe = b.addExecutable(.{
        .name = "zyte-windows",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/minimal.zig"),
            .target = windows_target,
            .optimize = optimize,
            .imports = &.{
                .{ .name = "zyte", .module = zyte_module },
            },
        }),
    });
    windows_exe.linkSystemLibrary("ole32");
    windows_exe.linkSystemLibrary("user32");
    windows_exe.linkSystemLibrary("gdi32");
    windows_exe.linkLibC();

    const windows_install = b.addInstallArtifact(windows_exe, .{});
    build_windows.dependOn(&windows_install.step);
    build_all.dependOn(&windows_install.step);

    // macOS target
    const macos_target = b.resolveTargetQuery(.{
        .cpu_arch = .aarch64,
        .os_tag = .macos,
    });

    const macos_exe = b.addExecutable(.{
        .name = "zyte-macos",
        .root_module = b.createModule(.{
            .root_source_file = b.path("src/minimal.zig"),
            .target = macos_target,
            .optimize = optimize,
            .imports = &.{
                .{ .name = "zyte", .module = zyte_module },
            },
        }),
    });
    macos_exe.linkFramework("Cocoa");
    macos_exe.linkFramework("WebKit");
    macos_exe.linkLibC();

    const macos_install = b.addInstallArtifact(macos_exe, .{});
    build_macos.dependOn(&macos_install.step);
    build_all.dependOn(&macos_install.step);
}
