/**
 * Build the browser extension: bundle each entry to the JS file the manifest
 * references, and copy the static assets (manifest + HTML) alongside. The result
 * (default `dist/`) is a loadable unpacked extension.
 */
import path from 'node:path'
import { cp, mkdir, rm } from 'node:fs/promises'

const root = import.meta.dir

// Entry → output basename (the names manifest.json / *.html reference).
const ENTRIES: Record<string, string> = {
  'content-script': 'src/content-script.ts',
  'inject': 'src/inject-entry.ts',
  'devtools': 'src/devtools.ts',
  'panel': 'src/panel.ts',
  'background': 'src/background.ts',
}

export async function build(outDir: string = path.join(root, 'dist')): Promise<void> {
  await rm(outDir, { recursive: true, force: true })
  await mkdir(outDir, { recursive: true })

  for (const [name, entry] of Object.entries(ENTRIES)) {
    const result = await Bun.build({
      entrypoints: [path.join(root, entry)],
      target: 'browser',
      minify: true,
    })
    if (!result.success)
      throw new Error(`build failed for ${entry}: ${result.logs.join('\n')}`)
    await Bun.write(path.join(outDir, `${name}.js`), await result.outputs[0].text())
  }

  // Static assets: manifest.json, devtools.html, panel.html, icons/.
  await cp(path.join(root, 'public'), outDir, { recursive: true })

  await stampManifestVersion(outDir)
}

/**
 * Write the package's version into the built manifest.
 *
 * `public/manifest.json` carried a hardcoded `0.2.70` while the package was at
 * `0.2.170`, and the two had been drifting for every release in between. The
 * Chrome Web Store rejects an upload whose version does not exceed the
 * published one, so the first submission would have been fine and the second
 * would have been rejected with a version number nobody could explain — the
 * repo says one thing and the artifact another (stacksjs/stx#1754).
 *
 * Stamped at build time rather than kept in sync by hand, because that is the
 * kind of sync that stops happening.
 */
async function stampManifestVersion(outDir: string): Promise<void> {
  const pkg = await Bun.file(path.join(root, 'package.json')).json() as { version?: string }
  if (!pkg.version)
    return

  const manifestPath = path.join(outDir, 'manifest.json')
  const manifest = await Bun.file(manifestPath).json() as Record<string, unknown>
  manifest.version = pkg.version

  await Bun.write(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

/**
 * Zip the built extension for a store upload.
 *
 * The store wants an archive whose manifest is at the ROOT, not inside a
 * `dist/` folder — uploading the wrapper directory is the classic first-attempt
 * rejection, so this zips the contents rather than the folder.
 */
export async function pack(outDir: string = path.join(root, 'dist')): Promise<string> {
  const pkg = await Bun.file(path.join(root, 'package.json')).json() as { version?: string }
  const zipPath = path.join(root, `stacks-devtools-${pkg.version ?? '0.0.0'}.zip`)

  await rm(zipPath, { force: true })

  const proc = Bun.spawn(['zip', '-r', '-q', zipPath, '.'], { cwd: outDir, stdout: 'inherit', stderr: 'inherit' })
  const code = await proc.exited
  if (code !== 0)
    throw new Error(`zip failed with code ${code}`)

  return zipPath
}

if (import.meta.main) {
  await build()
  // eslint-disable-next-line no-console
  console.log('built devtools-extension → dist/')

  if (process.argv.includes('--pack')) {
    const zipPath = await pack()
    // eslint-disable-next-line no-console
    console.log(`packed → ${path.basename(zipPath)}`)
  }
}
