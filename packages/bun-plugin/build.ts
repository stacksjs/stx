import { dts } from 'bun-plugin-dtsx'

await Bun.build({
  entrypoints: ['src/index.ts', 'src/client.ts'],
  outdir: '../../dist',
  plugins: [dts()],
  target: 'bun',
})