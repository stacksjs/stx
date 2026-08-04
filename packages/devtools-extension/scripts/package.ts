/**
 * Produce the uploadable Chrome Web Store zip (stacksjs/stx#1754).
 *
 * The store takes a zip of the extension directory — not a directory, not a
 * tarball — so this is the one packaging step between a working `dist/` and a
 * submission. Run after `bun run build`.
 *
 * Uses the platform `zip` because the store rejects archives with directory
 * entries stored oddly, and shelling out to the system tool avoids
 * hand-rolling a zip writer for a once-per-release artifact.
 *
 * Run: bun scripts/package.ts
 */

import fs from 'node:fs'
import path from 'node:path'

const root = path.join(import.meta.dir, '..')
const dist = path.join(root, 'dist')
const manifestPath = path.join(dist, 'manifest.json')

if (!fs.existsSync(manifestPath)) {
  console.error('[devtools-extension] dist/manifest.json is missing — run `bun run build` first.')
  process.exit(1)
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))

// Fail loudly rather than uploading an archive the store will reject on
// submission, which is a slow way to find out.
const required = ['16', '32', '48', '128']
const missingIcons = required.filter((size) => {
  const rel = manifest.icons?.[size]
  return !rel || !fs.existsSync(path.join(dist, rel))
})
if (missingIcons.length > 0) {
  console.error(`[devtools-extension] manifest is missing icons at: ${missingIcons.join(', ')}`)
  process.exit(1)
}

const outDir = path.join(root, 'release')
fs.mkdirSync(outDir, { recursive: true })
const zipPath = path.join(outDir, `stacks-devtools-${manifest.version}.zip`)
fs.rmSync(zipPath, { force: true })

// -r recurse, -q quiet, -X drop macOS extended attributes (the store flags the
// __MACOSX entries they produce).
const result = Bun.spawnSync(['zip', '-r', '-q', '-X', zipPath, '.'], { cwd: dist })
if (result.exitCode !== 0) {
  console.error('[devtools-extension] zip failed:', new TextDecoder().decode(result.stderr))
  process.exit(1)
}

const bytes = fs.statSync(zipPath).size
console.log(`[devtools-extension] ${path.relative(root, zipPath)}  ${(bytes / 1024).toFixed(1)} KB`)
console.log('[devtools-extension] upload at https://chrome.google.com/webstore/devconsole')
