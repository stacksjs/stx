import dts from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  plugins: [dts()],
  minify: true,
  sourcemap: 'external',
})

console.log('✓ Built @stacksjs/iconify-core')
