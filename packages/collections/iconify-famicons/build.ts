import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'bun-plugin-dtsx'

const __dirname = dirname(fileURLToPath(import.meta.url))

await Bun.build({
  entrypoints: [join(__dirname, 'src/index.ts')],
  outdir: join(__dirname, 'dist'),
  target: 'bun',
  format: 'esm',
  plugins: [dts()],
  minify: false,
  sourcemap: 'external',
  splitting: true,
})

console.log('✓ Built @stx/iconify-famicons')
