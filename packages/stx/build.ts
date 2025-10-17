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

// Build the client-side library
await Bun.build({
  entrypoints: ['./client.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'browser',
})

// Build the streaming examples
// await Bun.build({
//   entrypoints: [
//     './test/streaming/example-server.ts',
//     './test/streaming/client-example.ts',
//     './test/streaming/islands/notification-panel.ts'
//   ],
//   outdir: './test/streaming/dist',
//   target: 'browser',
// })
