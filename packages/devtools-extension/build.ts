/**
 * Build the browser extension: bundle each entry to the JS file the manifest
 * references, and copy the static assets (manifest + HTML) alongside. The result
 * (default `dist/`) is a loadable unpacked extension.
 */
import { cp, mkdir, rm } from 'node:fs/promises'
import path from 'node:path'

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

  // Static assets: manifest.json, devtools.html, panel.html.
  await cp(path.join(root, 'public'), outDir, { recursive: true })
}

if (import.meta.main) {
  await build()
  // eslint-disable-next-line no-console
  console.log('built devtools-extension → dist/')
}
