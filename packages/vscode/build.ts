// Build the VSCode extension
console.log("Building VSCode extension...");

await Bun.build({
  entrypoints: ["./src/extension.ts"],
  outdir: "./dist",
  target: "node",
  external: ["vscode"],
  minify: true,
  sourcemap: "external",
});

console.log("Build complete!");
