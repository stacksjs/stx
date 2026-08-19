import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'bun-plugin-dtsx'

const __dirname = dirname(fileURLToPath(import.meta.url))

await Bun.build({
  entrypoints: [
    join(__dirname, 'src/index.ts'),
    join(__dirname, 'src/cli.ts'),
  ],
  outdir: join(__dirname, 'dist'),
  target: 'bun',
  format: 'esm',
  plugins: [dts()],
  minify: true,
  sourcemap: 'external',
})

console.log('✓ Built @stacksjs/iconify-generator')
