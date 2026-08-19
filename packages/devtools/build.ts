await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  target: 'bun',
  format: 'esm',
  splitting: true,
  sourcemap: 'external',
  minify: true,
  external: ['*.stx'],
})

console.log('Build complete!')
