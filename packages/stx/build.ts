import { dts } from 'bun-plugin-dtsx'

// Build the main library
await Bun.build({
  entrypoints: ['./src/index.ts'],
  splitting: false,
  outdir: './dist',
  plugins: [dts()],
  target: 'bun',
  minify: true,
})

// Build CLI separately
await Bun.build({
  entrypoints: ['./bin/cli.ts'],
  splitting: false,
  outdir: './dist',
  target: 'bun',
  minify: true,
})

// Add shebang to CLI
const cliPath = './dist/cli.js'
const cliContent = await Bun.file(cliPath).text()
if (!cliContent.startsWith('#!/')) {
  await Bun.write(cliPath, `#!/usr/bin/env bun\n${cliContent}`)
}

// Build the client-side library
await Bun.build({
  entrypoints: ['./client.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'browser',
})
