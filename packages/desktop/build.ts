import dts from 'bun-plugin-dtsx'

console.log('Building @stacksjs/desktop...')

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  sourcemap: 'external',
  minify: false,
  plugins: [dts()],
  external: ['@stacksjs/zyte'],
})

console.log('Build complete!')
