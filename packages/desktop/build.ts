import dts from 'bun-plugin-dtsx'

console.log('Building @stacksjs/desktop...')

await Bun.build({
  entrypoints: ['./src/index.ts', './src/browser.ts', './src/test-utils.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  sourcemap: 'external',
  minify: false,
  // Keep craft-native external. This package is a thin wrapper that re-exports
  // it (windows, tray, packaging); bundling would freeze whatever craft-native
  // version was present at build time, so a consumer's newer craft-native
  // (e.g. App Store packaging fields) would be silently ignored.
  external: ['craft-native'],
  plugins: [dts()],
})

console.log('Build complete!')
