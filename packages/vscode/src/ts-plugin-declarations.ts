/**
 * The declaration files the TypeScript plugin falls back to (stacksjs/stx#2028),
 * written by build.ts into `dist/types/`: the package's own `stx.d.ts` (the
 * runtime globals, typed) and `stx-module.d.ts` (the virtual `stx` module,
 * which references `stx.d.ts`).
 *
 * They are what `stx typecheck` puts in its own program, so the editor and the
 * CLI resolve the same names to the same types. The plugin prefers the copy an
 * app has installed with `@stacksjs/stx`, which matches the runtime it actually
 * runs; these are for an app whose installed version predates the file.
 */
import { copyFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'

/** The package whose declarations ship with the plugin. */
const STX_PACKAGE_DIR = path.join(import.meta.dir, '..', '..', 'stx')

/** The files, by name; `stx-module.d.ts` is the one a buffer references. */
export const STX_DECLARATION_FILES = ['stx.d.ts', 'stx-module.d.ts'] as const

/** Write the plugin's declaration files into `dir`, returning their paths. */
export function writeStxDeclarations(dir: string, stxPackageDir: string = STX_PACKAGE_DIR): string[] {
  mkdirSync(dir, { recursive: true })
  for (const file of STX_DECLARATION_FILES)
    copyFileSync(path.join(stxPackageDir, file), path.join(dir, file))
  return STX_DECLARATION_FILES.map(file => path.join(dir, file))
}
