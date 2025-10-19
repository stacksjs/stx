const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // Library
    const lib = b.addStaticLibrary(.{
        .name = "zyte",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    // Add system libraries based on platform
    const target_os = target.result.os.tag;
    switch (target_os) {
        .macos => {
            lib.linkFramework("Cocoa");
            lib.linkFramework("WebKit");
        },
        .linux => {
            lib.linkSystemLibrary("gtk+-3.0");
            lib.linkSystemLibrary("webkit2gtk-4.0");
        },
        .windows => {
            lib.linkSystemLibrary("ole32");
            lib.linkSystemLibrary("user32");
            lib.linkSystemLibrary("gdi32");
        },
        else => {},
    }

    lib.linkLibC();
    b.installArtifact(lib);

    // Example executable
    const exe = b.addExecutable(.{
        .name = "zyte-example",
        .root_source_file = b.path("src/example.zig"),
        .target = target,
        .optimize = optimize,
    });

    exe.root_module.addImport("zyte", &lib.root_module);

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

    // Tests
    const lib_unit_tests = b.addTest(.{
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });

    const run_lib_unit_tests = b.addRunArtifact(lib_unit_tests);
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&run_lib_unit_tests.step);
}
