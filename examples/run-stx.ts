#!/usr/bin/env bun
import { serve } from "bun";
import stxPlugin from "../packages/stx/src";
import fs from "node:fs";
import path from "node:path";

// Command line argument for the STX file
const stxFilePath = process.argv[2];

if (!stxFilePath) {
  console.error("Error: Please provide a path to an STX file");
  console.error("Usage: bun run-stx.ts <file.stx>");
  process.exit(1);
}

// Verify the file exists
const absolutePath = path.resolve(stxFilePath);
if (!fs.existsSync(absolutePath)) {
  console.error(`Error: File not found: ${absolutePath}`);
  process.exit(1);
}

// Verify it's an STX file
if (!absolutePath.endsWith(".stx")) {
  console.error(`Error: File must have .stx extension: ${absolutePath}`);
  process.exit(1);
}

// Build the STX file to HTML
const outputDir = path.join(process.cwd(), ".stx-output");
fs.mkdirSync(outputDir, { recursive: true });

console.log(`Building ${stxFilePath}...`);

// Build the STX file
const result = await Bun.build({
  entrypoints: [absolutePath],
  outdir: outputDir,
  plugins: [stxPlugin],
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

// Find the HTML output
const htmlOutput = result.outputs.find(o => o.path.endsWith(".html"));
if (!htmlOutput) {
  console.error("No HTML output found");
  process.exit(1);
}

// Start a server to serve the HTML
const htmlContent = await Bun.file(htmlOutput.path).text();
const port = 3000;

console.log(`Starting server on http://localhost:${port}...`);

const server = serve({
  port,
  fetch(request) {
    const url = new URL(request.url);

    // Serve the main HTML for the root path
    if (url.pathname === "/") {
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    // Fallback 404 response
    return new Response("Not Found", { status: 404 });
  },
  error(error) {
    return new Response(`<pre>${error}\n${error.stack}</pre>`, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  },
});

console.log(`Server running at ${server.url}`);
console.log("Press Ctrl+C to stop the server");