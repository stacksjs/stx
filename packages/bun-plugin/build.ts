import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['./src/index.ts', './src/client.ts', './src/preload.ts', './src/serve.ts'],
  outdir: './dist',
  plugins: [dts()],
  target: 'bun',
  splitting: true,
  minify: true,
})
