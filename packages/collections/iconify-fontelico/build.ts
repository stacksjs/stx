import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import dts from 'bun-plugin-dtsx'

const __dirname = dirname(fileURLToPath(import.meta.url))
const srcDir = join(__dirname, 'src')
const distDir = join(__dirname, 'dist')
const distEntry = join(distDir, 'index.js')

// Skip rebuild when dist is already up to date. Makes prepublishOnly a
// no-op when CI pre-built the package in parallel earlier in the
// pipeline — and a no-op for local re-runs that didn't touch src/.
//
// Walks src/ recursively so changes inside subdirectories (if we ever
// add them) properly invalidate the cached dist.
function isDistFresh() {
  if (!existsSync(distEntry)) return false
  const distMtime = statSync(distEntry).mtimeMs
  function newer(dir) {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const s = statSync(p)
      if (s.isDirectory()) {
        if (newer(p)) return true
      } else if (s.mtimeMs > distMtime) {
        return true
      }
    }
    return false
  }
  return !newer(srcDir)
}

if (isDistFresh()) {
  console.log('✓ @stacksjs/iconify-fontelico dist is fresh, skipping rebuild')
} else {
  await Bun.build({
    entrypoints: [join(srcDir, 'index.ts')],
    outdir: distDir,
    target: 'bun',
    format: 'esm',
    plugins: [dts()],
    minify: false,
    sourcemap: 'external',
    splitting: true,
  })
  console.log('✓ Built @stacksjs/iconify-fontelico')
}
