/**
 * Package (and with `--publish`, publish) the extension.
 *
 *   bun scripts/package.ts [--out <file.vsix>] [--publish]
 *
 * `vsce package --no-dependencies` keeps the VSIX to the bundles in dist/, but
 * it also leaves out everything under node_modules, including the one package
 * the extension needs there: the TypeScript server plugin, which tsserver will
 * only load by package name from `<extension>/node_modules` (see
 * ts-plugin-package.ts). So it is added to the VSIX after vsce writes it, and
 * a publish uploads that VSIX rather than letting vsce package a second time.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import process from 'node:process'
import { TS_PLUGIN_DIR, writeTsPluginPackage } from './ts-plugin-package'

const ROOT = join(import.meta.dir, '..')
const BASE_URLS = [
  '--baseContentUrl',
  'https://github.com/stacksjs/stx/blob/main/packages/vscode',
  '--baseImagesUrl',
  'https://raw.githubusercontent.com/stacksjs/stx/main/packages/vscode',
]

function run(command: string[], cwd = ROOT, capture = false): string {
  const result = Bun.spawnSync(command, { cwd, stdout: capture ? 'pipe' : 'inherit', stderr: 'inherit', env: process.env })
  if (result.exitCode !== 0)
    throw new Error(`${command.join(' ')} exited with ${result.exitCode}`)
  return capture ? result.stdout.toString() : ''
}

/** Build the VSIX at `out`, with the TypeScript plugin package in it. */
export function packageExtension(out: string): string {
  const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

  // vsce runs `vscode:prepublish` (the build) first.
  run(['bun', 'x', '--bun', 'vsce', 'package', '--no-dependencies', ...BASE_URLS, '--out', out])

  // A staging tree whose layout is the VSIX's, so zip records the paths
  // VS Code extracts: extension/node_modules/<package>/...
  const stage = mkdtempSync(join(tmpdir(), 'stx-vsix-'))
  try {
    writeTsPluginPackage(join(stage, 'extension'), manifest.version)
    run(['zip', '-q', '-r', '-X', '-D', out, `extension/${TS_PLUGIN_DIR}`], stage)
  }
  finally {
    rmSync(stage, { recursive: true, force: true })
  }

  const listing = run(['unzip', '-Z1', out], ROOT, true)
  if (!listing.includes(`extension/${TS_PLUGIN_DIR}/index.js`))
    throw new Error(`${out} is missing the TypeScript plugin package`)

  return out
}

if (import.meta.main) {
  const args = process.argv.slice(2)
  const outFlag = args.indexOf('--out')
  const manifest = await Bun.file(join(ROOT, 'package.json')).json()
  const out = resolve(outFlag === -1 ? join(ROOT, `${manifest.name}-${manifest.version}.vsix`) : args[outFlag + 1])

  packageExtension(out)
  console.log(`Packaged ${out}`)

  if (args.includes('--publish')) {
    if (!existsSync(out))
      throw new Error(`${out} was not written`)
    run(['bun', 'x', '--bun', 'vsce', 'publish', '--packagePath', out])
    console.log(`Published ${manifest.publisher}.${manifest.name}@${manifest.version}`)
  }
}
