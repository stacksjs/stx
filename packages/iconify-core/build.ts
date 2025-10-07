import dts from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  plugins: [dts()],
  minify: false,
  sourcemap: 'external',
})

console.log('✓ Built @stx/iconify-core')
