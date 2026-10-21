import dts from 'bun-plugin-dtsx'

console.log('Building @stacksjs/desktop...')

const host = await Bun.build({
  splitting: true,
  entrypoints: ['./src/index.ts', './src/test-utils.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  sourcemap: 'none',
  minify: true,
  // Keep craft-native external. This package is a thin wrapper that re-exports
  // it (windows, tray, packaging); bundling would freeze whatever craft-native
  // version was present at build time, so a consumer's newer craft-native
  // (e.g. App Store packaging fields) would be silently ignored.
  external: ['craft-native'],
  plugins: [dts()],
})

if (!host.success) throw new AggregateError(host.logs, 'Desktop host build failed')

// A browser entry must be built for a browser on its own. Bun-targeted shared
// chunks can carry import.meta.require even when the page never calls a host
// API; that syntax prevents a classic-script module registry from executing.
const browser = await Bun.build({
  entrypoints: ['./src/browser.ts'],
  outdir: './dist',
  target: 'browser',
  format: 'esm',
  sourcemap: 'none',
  minify: true,
  external: ['craft-native'],
  plugins: [dts()],
})

if (!browser.success) throw new AggregateError(browser.logs, 'Desktop browser build failed')

console.log('Build complete!')
