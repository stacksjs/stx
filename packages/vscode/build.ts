// Build the VSCode extension
console.log("Building VSCode extension...");

try {
  // 1. Build the main extension
  const result = await Bun.build({
    entrypoints: ["./src/extension.ts"],
    outdir: "./dist",
    target: "node",
    format: "cjs",
    external: ["vscode"],
    minify: false, // Disable minification for easier debugging
    sourcemap: "external",
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    process.exit(1);
  }

  // 2. Build the TypeScript plugin
  const pluginResult = await Bun.build({
    entrypoints: ["./src/typescript-stx-plugin.ts"],
    outdir: "./dist",
    target: "node",
    format: "cjs",
    external: ["typescript", "typescript/lib/tsserverlibrary"],
    minify: false,
    sourcemap: "external",
  });

  if (!pluginResult.success) {
    console.error("TypeScript plugin build failed:", pluginResult.logs);
    process.exit(1);
  }

  console.log("Build complete!");
} catch (error) {
  console.error("Build error:", error);
  process.exit(1);
}
